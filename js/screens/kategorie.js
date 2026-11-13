/**
 * kategorie.js – Screen "Kategorie mit Filtern" (#/kategorie/:id).
 *
 * Filter, Suchbegriff und eine gewählte Ansicht stehen in der Adresse, z. B.
 * #/kategorie/unterteile?art=Badehose&ansicht=einzeln. Beim Betreten liest der
 * Screen sie von dort, jede Änderung schreibt sie ohne Verlaufseintrag zurück.
 * So stellt "Zurück" genau den vorherigen Stand wieder her – auch aus dem
 * Detail. Von der Übersicht aus führt die Kachel ohne Werte in die Kategorie,
 * die Filter beginnen dann leer.
 */

import { el, leeren } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { iconKnopf, knopf, suchfeld, zurueckKnopf } from '../ui/knoepfe.js';
import { leererZustand, teilKarte } from '../ui/kacheln.js';
import { wahlknoepfe } from '../ui/formularteile.js';
import { ergebnisliste, geltendeAnsicht } from '../ui/ergebnisliste.js';
import { speicher } from '../storage.js';
import { abfrageListenAusHash, adresseMitWerten, aktualisiereAdresse } from '../router.js';
import {
  ALTER_AB_VORGABEN,
  JAHRESZEITEN,
  MERKMAL,
  PASSFORM,
  kategorie as kategorieVon,
} from '../model.js';
import {
  anzahlFilter,
  einheitDativ,
  filterAktiv,
  istSpielzeugKategorie,
  leererFilter,
  passtZurSuche,
  stueck,
  teileDerKategorie,
  vorhandeneFilterwerte,
  wendeFilterAn,
} from '../filters.js';

/**
 * Zustand der Kategorie-Ansicht. Er entsteht beim Betreten aus der Adresse.
 * `filterOffen` gehört dazu, weil jede Filteränderung den Screen neu aufbaut –
 * sonst würde sich das Filterblatt auf dem Smartphone bei jedem Tipp schließen.
 * `ansicht` ist nur gesetzt, wenn die Adresse eine Ansicht vorgibt.
 */
let zustand = {
  kategorieId: null, filter: leererFilter(), suchbegriff: '', filterOffen: false, ansicht: null,
};

/** Filtergruppe -> Name in der Adresse, in dieser Reihenfolge. */
const ADRESS_NAMEN = {
  arten: 'art',
  jahreszeiten: 'jahreszeit',
  groessen: 'groesse',
  merkmale: 'merkmal',
  marken: 'marke',
  passformen: 'passform',
  alterAb: 'alter',
};

/** Diese Gruppen enthalten Zahlen. */
const ZAHL_GRUPPEN = new Set(['groessen', 'alterAb']);

/** Liest Filter, Suche und Ansicht aus der Adresse. */
function zustandAusAdresse(kategorieId) {
  const werte = abfrageListenAusHash(window.location.hash);
  const filter = leererFilter();

  for (const [gruppe, name] of Object.entries(ADRESS_NAMEN)) {
    const liste = werte[name] ?? [];
    filter[gruppe] = ZAHL_GRUPPEN.has(gruppe)
      ? liste.map(Number).filter(Number.isFinite)
      : liste;
  }

  return {
    kategorieId,
    filter,
    suchbegriff: werte.suche?.[0] ?? '',
    filterOffen: false,
    ansicht: werte.ansicht?.[0] ?? null,
  };
}

/** Die Adresse zu einem Zustand – für die Adresszeile und für Gruppen-Links. */
function adresseAus({ kategorieId, filter, suchbegriff, ansicht }) {
  const werte = {};
  for (const [gruppe, name] of Object.entries(ADRESS_NAMEN)) werte[name] = filter[gruppe];
  werte.suche = suchbegriff.trim() === '' ? null : suchbegriff;
  werte.ansicht = ansicht;
  return adresseMitWerten(`/kategorie/${kategorieId}`, werte);
}

/** Schreibt den aktuellen Zustand in die Adresse, ohne Verlaufseintrag. */
function merkeInAdresse() {
  aktualisiereAdresse(adresseAus(zustand));
}

export function kategorieScreen({ kategorieId }, { neuZeichnen = () => {}, frisch = true } = {}) {
  const kat = kategorieVon(kategorieId);

  // Unbekannte Kategorie führt zurück zur Übersicht.
  if (!kat) {
    window.location.replace(`${window.location.pathname}${window.location.search}#/`);
    return el('div', { class: 'inhalt' });
  }

  if (frisch) zustand = zustandAusAdresse(kategorieId);

  const istSpielzeug = istSpielzeugKategorie(kategorieId);
  const alleTeile = teileDerKategorie(speicher.teile(), kategorieId);
  const werte = vorhandeneFilterwerte(alleTeile);

  /** Teile nach Filter und Suche. */
  function sichtbareTeile() {
    return wendeFilterAn(alleTeile, zustand.filter)
      .filter((teil) => passtZurSuche(teil, zustand.suchbegriff));
  }

  // Nur Liste und Kopfzahl werden getauscht, damit der Fokus im Suchfeld bleibt.
  const listenbereich = el('div', { class: 'kategorie__liste', 'data-nach-oben': '' });
  const zaehlzeile = el('p', { class: 'zaehlzeile' });
  const chipzeile = el('div', { class: 'filterchips nur-smartphone' });
  const filterKnopfText = el('span', {});

  function zeichneListe() {
    const sichtbar = sichtbareTeile();
    const gesamt = stueck(alleTeile);
    const gezeigt = stueck(sichtbar);

    zaehlzeile.textContent = `${gezeigt} von ${gesamt} ${einheitDativ(kategorieId)}`;
    filterKnopfText.textContent = anzahlFilter(zustand.filter) > 0
      ? `Filter (${anzahlFilter(zustand.filter)})`
      : 'Filter';

    leeren(chipzeile).append(...bauChips());

    leeren(listenbereich).append(
      sichtbar.length > 0
        ? ergebnisliste({
          teile: sichtbar,
          ansicht: geltendeAnsicht(zustand.ansicht, speicher.ansichtGemerkt()),
          beiAnsicht: wechsleAnsicht,
          karte: (teil) => teilKarte(teil),
          gruppenZiel: gruppenAdresse,
        })
        : leererListenZustand(alleTeile.length === 0),
    );
  }

  /**
   * Tipp auf eine Gruppe: dieselbe Kategorie mit allen gesetzten Filtern,
   * nur auf diese Art beschränkt und einzeln. "Zurück" führt zur Gruppen-
   * ansicht, denn deren Stand steht in der Adresse davor.
   */
  function gruppenAdresse(gruppe) {
    return adresseAus({
      ...zustand,
      filter: { ...zustand.filter, arten: [gruppe.art] },
      ansicht: 'einzeln',
    });
  }

  /** Umschalter: Wahl merken; ein Wert aus der Adresse gilt dann nicht mehr. */
  function wechsleAnsicht(neu) {
    zustand.ansicht = null;
    speicher.ansichtMerken(neu);
    merkeInAdresse();
    neuZeichnen();
  }

  /** Leerer Zustand: ganz ohne Teile oder nur ohne Treffer. */
  function leererListenZustand(kategorieLeer) {
    if (kategorieLeer) {
      return leererZustand({
        text: 'Noch keine Teile.',
        hinweis: `In ${kat.name} ist noch nichts eingetragen.`,
        aktion: knopf({
          text: 'Teil hinzufügen',
          // Die Kategorie ist im Formular schon vorbelegt.
          href: `#/neu?kategorie=${encodeURIComponent(kategorieId)}`,
          iconName: 'plus',
          variante: 'primaer',
        }),
      });
    }

    const zuruecksetzen = knopf({ text: 'Filter zurücksetzen' });
    zuruecksetzen.addEventListener('click', alleFilterZuruecksetzen);

    return leererZustand({
      text: 'Keine Teile passen zu den Filtern.',
      hinweis: zustand.suchbegriff.trim() !== ''
        ? `Auch die Suche nach „${zustand.suchbegriff.trim()}“ bringt hier nichts.`
        : undefined,
      aktion: filterAktiv(zustand.filter) ? zuruecksetzen : undefined,
    });
  }

  function alleFilterZuruecksetzen() {
    zustand.filter = leererFilter();
    merkeInAdresse();
    neuZeichnen();
  }

  /** Schaltet einen Wert in einer Filtergruppe an oder aus. */
  function schalte(gruppe, wert) {
    const gesetzt = new Set(zustand.filter[gruppe]);
    if (gesetzt.has(wert)) gesetzt.delete(wert); else gesetzt.add(wert);
    zustand.filter = { ...zustand.filter, [gruppe]: [...gesetzt] };
    merkeInAdresse();
    neuZeichnen();
  }

  /* --- Filtergruppen ----------------------------------------------------- */

  function gruppe(label, inhalt) {
    if (!inhalt) return null;
    return el('div', { class: 'filtergruppe' }, [
      el('p', { class: 'filtergruppe__label', text: label }),
      inhalt,
    ]);
  }

  function filterGruppen() {
    if (istSpielzeug) {
      return [
        gruppe('Art', werte.arten.length > 0 ? wahlknoepfe({
          optionen: werte.arten.map((art) => ({ id: art, name: art })),
          wert: zustand.filter.arten,
          mehrfach: true,
          beiWahl: (wert) => schalte('arten', wert),
        }) : null),
        gruppe('Alter ab', werte.alterAb.length > 0 ? wahlknoepfe({
          optionen: werte.alterAb.map((jahre) => ({ id: jahre, name: `ab ${jahre}` })),
          wert: zustand.filter.alterAb,
          mehrfach: true,
          beiWahl: (wert) => schalte('alterAb', wert),
        }) : null),
        merkmalGruppe(),
      ].filter(Boolean);
    }

    return [
      gruppe('Jahreszeit', werte.jahreszeiten.length > 0 ? wahlknoepfe({
        optionen: werte.jahreszeiten.map((id) => ({
          id,
          name: JAHRESZEITEN.find((j) => j.id === id).name,
          iconName: id,
        })),
        wert: zustand.filter.jahreszeiten,
        mehrfach: true,
        klasse: 'wahl--jahreszeiten',
        beiWahl: (wert) => schalte('jahreszeiten', wert),
      }) : null),

      gruppe('Größe', werte.groessen.length > 0 ? wahlknoepfe({
        optionen: werte.groessen.map((wert) => ({ id: wert, name: String(wert) })),
        wert: zustand.filter.groessen,
        mehrfach: true,
        beiWahl: (wert) => schalte('groessen', wert),
      }) : null),

      merkmalGruppe(),

      gruppe('Passform', passformGruppe()),

      gruppe('Art', werte.arten.length > 0 ? wahlknoepfe({
        optionen: werte.arten.map((art) => ({ id: art, name: art })),
        wert: zustand.filter.arten,
        mehrfach: true,
        beiWahl: (wert) => schalte('arten', wert),
      }) : null),
    ].filter(Boolean);
  }

  function merkmalGruppe() {
    const inhalt = el('div', {}, [
      wahlknoepfe({
        optionen: MERKMAL,
        wert: zustand.filter.merkmale,
        mehrfach: true,
        beiWahl: (wert) => schalte('merkmale', wert),
      }),
      // Die Markenliste erscheint erst, wenn nach Marke gefiltert wird.
      zustand.filter.merkmale.includes('marke') && werte.marken.length > 0
        ? el('div', { class: 'filtergruppe__unter' }, [
          wahlknoepfe({
            optionen: werte.marken.map((marke) => ({ id: marke, name: marke })),
            wert: zustand.filter.marken,
            mehrfach: true,
            beiWahl: (wert) => schalte('marken', wert),
          }),
        ])
        : null,
    ]);

    return gruppe('Merkmal', inhalt);
  }

  /** Passform zeigt das Design als Kästchen zum Ankreuzen. */
  function passformGruppe() {
    return el(
      'div',
      { class: 'kreuzliste' },
      PASSFORM.map((p) => {
        const gesetzt = zustand.filter.passformen.includes(p.id);
        const kasten = el('input', { type: 'checkbox', class: 'kreuzliste__kasten' });
        kasten.checked = gesetzt;
        kasten.addEventListener('change', () => schalte('passformen', p.id));

        return el('label', { class: 'kreuzliste__zeile' }, [
          kasten,
          el('span', { text: p.name }),
        ]);
      }),
    );
  }

  /* --- Chips der gesetzten Filter (Smartphone) --------------------------- */

  function bauChips() {
    const chips = [];

    const beschriftung = {
      jahreszeiten: (wert) => JAHRESZEITEN.find((j) => j.id === wert)?.name ?? wert,
      groessen: (wert) => `Gr. ${wert}`,
      merkmale: (wert) => MERKMAL.find((m) => m.id === wert)?.name ?? wert,
      marken: (wert) => wert,
      passformen: (wert) => PASSFORM.find((p) => p.id === wert)?.name ?? wert,
      arten: (wert) => wert,
      alterAb: (wert) => `ab ${wert}`,
    };

    for (const [gruppenName, werteListe] of Object.entries(zustand.filter)) {
      for (const wert of werteListe) {
        const entfernen = el('button', {
          type: 'button',
          class: 'filterchip__entfernen',
          'aria-label': `Filter ${beschriftung[gruppenName](wert)} entfernen`,
        }, [icon('schliessen', 16)]);
        entfernen.addEventListener('click', () => schalte(gruppenName, wert));

        chips.push(el('span', { class: 'filterchip' }, [
          el('span', { text: beschriftung[gruppenName](wert) }),
          entfernen,
        ]));
      }
    }

    return chips;
  }

  /* --- Filterspalte und Filterblatt -------------------------------------- */

  /** Knopf "Zurücksetzen" – nur, wenn überhaupt etwas gesetzt ist. */
  function zuruecksetzenKnopf() {
    if (!filterAktiv(zustand.filter)) return null;
    const knopfEl = el('button', { type: 'button', class: 'textknopf', text: 'Zurücksetzen' });
    knopfEl.addEventListener('click', alleFilterZuruecksetzen);
    return knopfEl;
  }

  /** Die Filtergruppen ohne Kopfzeile – Spalte und Blatt bauen ihre eigene. */
  function filterGruppenBereich() {
    const gruppen = filterGruppen();
    return gruppen.length > 0
      ? gruppen
      : [el('p', { class: 'abschnitt__leer', text: 'Hier gibt es noch nichts zu filtern.' })];
  }

  function filterSpalte() {
    return [
      el('div', { class: 'filter__kopf' }, [
        el('h2', { class: 'filter__titel', text: 'Filter' }),
        zuruecksetzenKnopf(),
      ]),
      ...filterGruppenBereich(),
    ];
  }

  // Smartphone: das Filterblatt fährt von unten herein.
  const blatt = el('div', { class: 'filterblatt nur-smartphone', hidden: true });

  function schliesseBlatt() {
    zustand.filterOffen = false;
    neuZeichnen();
  }

  function zeichneBlatt() {
    const schliessen = iconKnopf({ label: 'Filter schließen', iconName: 'schliessen' });
    schliessen.addEventListener('click', schliesseBlatt);

    const fertig = knopf({ text: 'Fertig', variante: 'primaer' });
    fertig.addEventListener('click', schliesseBlatt);

    leeren(blatt).append(
      el('div', { class: 'filterblatt__flaeche' }, [
        el('div', { class: 'filterblatt__inhalt' }, [
          el('div', { class: 'filter__kopf' }, [
            el('h2', { class: 'filter__titel', text: 'Filter' }),
            el('div', { class: 'filter__kopf-aktionen' }, [zuruecksetzenKnopf(), schliessen]),
          ]),
          ...filterGruppenBereich(),
        ]),
        el('div', { class: 'filterblatt__fuss' }, [fertig]),
      ]),
    );
  }

  // Gesetzte Filter heben den Knopf hervor, wie im Design.
  const filterOeffnen = el('button', {
    type: 'button',
    class: `knopf nur-smartphone${filterAktiv(zustand.filter) ? ' knopf--primaer' : ''}`,
  }, [icon('filter', 20), filterKnopfText]);
  filterOeffnen.addEventListener('click', () => {
    zustand.filterOffen = true;
    neuZeichnen();
  });

  // Ein offenes Blatt übersteht das Neuzeichnen nach einer Filteränderung.
  if (zustand.filterOffen) {
    zeichneBlatt();
    blatt.hidden = false;
  }

  /* --- Zusammenbau ------------------------------------------------------- */

  const suche = suchfeld({
    label: `In ${kat.name} suchen`,
    platzhalter: `In ${kat.name} suchen`,
    klasse: 'kategorie__suche',
    wert: zustand.suchbegriff,
    beiEingabe: (wert) => {
      zustand.suchbegriff = wert;
      merkeInAdresse();
      zeichneListe();
    },
  });

  zeichneListe();

  // In einer leeren Kategorie gibt es nichts zu filtern und nichts zu suchen.
  const hatTeile = alleTeile.length > 0;

  return el('div', { class: 'inhalt kategorie' }, [
    el('header', { class: 'kopfzeile' }, [
      zurueckKnopf({ elternZiel: '#/' }),
      el('div', { class: 'kopfzeile__titelblock' }, [
        el('h1', { class: 'kopfzeile__titel', text: kat.name }),
        zaehlzeile,
      ]),
      hatTeile ? el('div', { class: 'kopfzeile__aktionen' }, [suche]) : null,
    ]),

    hatTeile
      ? el('div', { class: 'kategorie__steuerung nur-smartphone' }, [filterOeffnen, chipzeile])
      : null,

    el('div', { class: `kategorie__raster${hatTeile ? '' : ' kategorie__raster--leer'}` }, [
      hatTeile
        ? el('aside', { class: 'kategorie__filter nur-tablet', 'aria-label': 'Filter' }, filterSpalte())
        : null,
      listenbereich,
    ]),

    hatTeile ? blatt : null,
  ]);
}
