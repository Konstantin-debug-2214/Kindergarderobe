/**
 * saisonwechsel.js – Screen "Soll-Mengen & Saisonwechsel" (#/saisonwechsel).
 *
 * Nur Kleidung. Beim Öffnen ist die kommende Jahreszeit gewählt.
 * Das Soll wird sofort gespeichert; die Haken der Besorgen-Liste sind eine
 * Merkhilfe im Oberflächen-Zustand und zählen nicht als Datenänderung.
 */

import { el, leeren } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { iconKnopf, knopf } from '../ui/knoepfe.js';
import { zaehler } from '../ui/formularteile.js';
import { leererZustand } from '../ui/kacheln.js';
import { waehleAus } from '../ui/dialog.js';
import { zeigeHinweis } from '../ui/hinweis.js';
import { speicher, SpeicherFehler } from '../storage.js';
import { hatVorgaenger } from '../router.js';
import { JAHRESZEITEN, TYP, jahreszeit as jahreszeitVon } from '../model.js';
import { imSchrank } from '../filters.js';
import { groesseText } from '../formular.js';
import {
  artenOhneZeile,
  baldZuKleinTeile,
  besorgen,
  checkSummen,
  kommendeJahreszeit,
  saisonHinweis,
  sollZeilen,
  standText,
} from '../saison.js';

/** Gewählte Jahreszeit – überlebt das Neuzeichnen nach einer Änderung. */
let gewaehlt = null;

/** Schlüssel eines Hakens in der Besorgen-Liste. */
const hakenSchluessel = (jahreszeitId, art) => `${jahreszeitId}|${art}`;

export function saisonwechselScreen(parameter, { neuZeichnen = () => {}, frisch = true } = {}) {
  if (frisch || !gewaehlt) gewaehlt = kommendeJahreszeit();

  const jz = jahreszeitVon(gewaehlt);
  const teile = speicher.teile();
  const zeilen = sollZeilen(teile, speicher.sollMengen(), gewaehlt);
  const summen = checkSummen(zeilen);
  const einkauf = besorgen(zeilen);
  const baldKlein = baldZuKleinTeile(teile, gewaehlt);

  // Haken wegräumen, für die nichts mehr fehlt.
  speicher.besorgtAufraeumen(einkauf.map((eintrag) => hakenSchluessel(gewaehlt, eintrag.art)));
  const haken = new Set(speicher.besorgtHaken());

  /* --- Jahreszeiten-Knöpfe ------------------------------------------------ */

  const knoepfe = el(
    'div',
    { class: 'jahreszeitwahl', role: 'group', 'aria-label': 'Jahreszeit' },
    JAHRESZEITEN.map((eintrag) => {
      const aktiv = eintrag.id === gewaehlt;
      const knopfEl = el('button', {
        type: 'button',
        class: `jahreszeitwahl__knopf${aktiv ? ' jahreszeitwahl__knopf--aktiv' : ''}`,
        'data-jahreszeit': eintrag.id,
        'aria-pressed': String(aktiv),
      }, [
        icon(eintrag.id, 22),
        el('span', { class: 'jahreszeitwahl__texte' }, [
          el('span', { class: 'jahreszeitwahl__name', text: eintrag.name }),
        ]),
      ]);
      knopfEl.addEventListener('click', () => {
        gewaehlt = eintrag.id;
        neuZeichnen();
      });
      return knopfEl;
    }),
  );

  /* --- Soll ändern -------------------------------------------------------- */

  function setzeSoll(art, wert) {
    try {
      // Ein Soll von 0 bedeutet: kein Soll mehr.
      if (wert <= 0) speicher.sollMengeLoeschen(art, gewaehlt);
      else speicher.sollMengeSetzen(art, gewaehlt, wert);
    } catch (fehler) {
      zeigeHinweis(
        fehler instanceof SpeicherFehler ? fehler.message : 'Das Soll konnte nicht gespeichert werden.',
        { art: 'hinweis' },
      );
    }
  }

  async function artHinzufuegen() {
    const eigene = imSchrank(teile)
      .filter((teil) => teil.typ === TYP.KLEIDUNG)
      .map((teil) => teil.art);

    const gruppen = artenOhneZeile(zeilen, eigene);

    const wahl = await waehleAus({
      titel: `Art für ${jz.name} hinzufügen`,
      leerText: 'Alle Arten haben hier schon eine Zeile.',
      // Die Kategorie steht als Hinweis an jedem Eintrag.
      eintraege: gruppen.flatMap((gruppe) => gruppe.arten.map((art) => ({
        wert: art,
        titel: art,
        hinweis: gruppe.kategorie,
      }))),
    });

    if (!wahl) return;
    // Eine neu gewählte Art beginnt mit Soll 1.
    setzeSoll(wahl, 1);
  }

  /* --- Tabelle der Soll-Mengen (Tablet) ----------------------------------- */

  function sollTabelle() {
    const kopf = el('div', { class: 'solltabelle__kopf' }, [
      el('span', { text: 'Art' }),
      el('span', { class: 'solltabelle__zahl', text: 'Passend' }),
      el('span', { class: 'solltabelle__mitte', text: 'Soll' }),
      el('span', { text: 'Stand' }),
    ]);

    const reihen = zeilen.map((zeile) => el('div', { class: 'solltabelle__zeile' }, [
      el('span', { class: 'solltabelle__art', text: zeile.art }),
      el('span', { class: 'solltabelle__zahl', text: String(zeile.passend) }),
      el('span', { class: 'solltabelle__mitte' }, [
        zaehler({
          wert: zeile.soll ?? 0,
          min: 0,
          label: `Soll für ${zeile.art}`,
          beiAenderung: (wert) => setzeSoll(zeile.art, wert),
        }),
      ]),
      standEtikett(zeile),
    ]));

    return el('div', { class: 'solltabelle' }, [kopf, ...reihen]);
  }

  /** Soll-Mengen auf dem Smartphone: je Art eine Karte. */
  function sollKarten() {
    return el('div', { class: 'sollkarten' }, zeilen.map((zeile) => el(
      'div',
      { class: 'sollkarte' },
      [
        el('div', { class: 'sollkarte__kopf' }, [
          el('span', { class: 'sollkarte__art', text: zeile.art }),
          standEtikett(zeile),
        ]),
        el('div', { class: 'sollkarte__zeile' }, [
          el('span', {
            class: 'sollkarte__passend',
            text: `${zeile.passend} passend`,
          }),
          el('div', { class: 'sollkarte__soll' }, [
            el('span', { class: 'sollkarte__label', text: 'Soll' }),
            zaehler({
              wert: zeile.soll ?? 0,
              min: 0,
              label: `Soll für ${zeile.art}`,
              beiAenderung: (wert) => setzeSoll(zeile.art, wert),
            }),
          ]),
        ]),
      ],
    )));
  }

  const artKnopf = knopf({ text: 'Art', iconName: 'plus' });
  artKnopf.addEventListener('click', artHinzufuegen);

  const sollBereich = el('section', { class: 'karte sollbereich' }, [
    el('div', { class: 'bereich__kopf' }, [
      el('h2', { class: 'karte__titel', text: `Soll-Mengen ${jz.name}` }),
      el('p', { class: 'bereich__zusatz', text: 'optional · nur passende Teile zählen' }),
    ]),
    zeilen.length > 0
      ? el('div', {}, [
        el('div', { class: 'nur-tablet' }, [sollTabelle()]),
        el('div', { class: 'nur-smartphone' }, [sollKarten()]),
      ])
      : leererZustand({
        text: `Noch keine Soll-Mengen für ${jz.name}.`,
        hinweis: 'Lege mit „+ Art“ fest, wie viele Teile du brauchst.',
      }),
    el('div', { class: 'sollbereich__fuss' }, [artKnopf]),
  ]);

  /* --- Saisonwechsel-Check ------------------------------------------------ */

  const hinweis = saisonHinweis(gewaehlt);

  function besorgenListe() {
    if (einkauf.length === 0) {
      return el('p', { class: 'check__leer', text: 'Alles da.' });
    }

    return el('div', { class: 'besorgen' }, einkauf.map((eintrag) => {
      const schluessel = hakenSchluessel(gewaehlt, eintrag.art);
      const gesetzt = haken.has(schluessel);

      const kasten = el('input', { type: 'checkbox', class: 'kreuzliste__kasten' });
      kasten.checked = gesetzt;
      kasten.addEventListener('change', () => {
        speicher.besorgtSetzen(schluessel, kasten.checked);
        neuZeichnen();
      });

      return el('label', {
        class: `besorgen__zeile${gesetzt ? ' besorgen__zeile--erledigt' : ''}`,
      }, [
        kasten,
        el('span', { class: 'besorgen__art', text: eintrag.art }),
        el('span', {
          class: 'besorgen__anzahl',
          text: `noch ${eintrag.fehlt}`,
        }),
      ]);
    }));
  }

  function baldKleinListe() {
    if (baldKlein.length === 0) {
      return el('p', { class: 'check__leer', text: 'Nichts wird bald zu klein.' });
    }

    return el('div', { class: 'baldklein' }, baldKlein.map((teil) => el(
      'a',
      { class: 'baldklein__zeile', href: `#/teil/${encodeURIComponent(teil.id)}` },
      [
        el('span', { class: 'baldklein__name', text: teil.name }),
        teil.groesse
          ? el('span', { class: 'etikett-warnung', text: `Gr. ${groesseText(teil.groesse)}` })
          : null,
      ],
    )));
  }

  const checkBereich = el('section', { class: 'karte check' }, [
    el('h2', { class: 'karte__titel', text: 'Saisonwechsel-Check' }),
    el('p', { class: 'check__saison', text: hinweis.text }),

    el('div', { class: 'check__summen' }, [
      summenKachel('ist da', summen.istDa, 'neutral'),
      summenKachel('passt', summen.passt, 'gut'),
      summenKachel('fehlt', summen.fehlt, 'offen'),
    ]),

    el('p', { class: 'check__label', text: 'Besorgen' }),
    besorgenListe(),

    el('p', { class: 'check__label', text: 'Wird bald zu klein' }),
    baldKleinListe(),
  ]);

  /* --- Zusammenbau -------------------------------------------------------- */

  return el('div', { class: 'inhalt saisonwechsel' }, [
    el('header', { class: 'kopfzeile' }, [
      zurueckKnopf(),
      el('div', { class: 'kopfzeile__titelblock' }, [
        el('h1', { class: 'kopfzeile__titel nur-tablet', text: 'Soll-Mengen & Saisonwechsel' }),
        el('h1', { class: 'kopfzeile__titel nur-smartphone', text: 'Saisonwechsel' }),
        el('p', {
          class: 'kopfzeile__unterzeile nur-smartphone',
          text: 'Soll-Mengen & Check',
        }),
      ]),
    ]),

    knoepfe,

    // Auf dem Smartphone steht der Check oben, wie im Design.
    el('div', { class: 'saisonwechsel__raster' }, [
      el('div', { class: 'saisonwechsel__soll' }, [sollBereich]),
      el('div', { class: 'saisonwechsel__check' }, [checkBereich]),
    ]),
  ]);
}

/* --- Bausteine ------------------------------------------------------------- */

/**
 * Zurück zur vorherigen Seite – hierher führen Statistik und Einstellungen.
 * Ohne Vorgänger (direkt geöffnet oder neu geladen) geht es zur Statistik.
 */
function zurueckKnopf() {
  const knopfEl = iconKnopf({ label: 'Zurück', iconName: 'zurueck' });
  knopfEl.addEventListener('click', () => {
    if (hatVorgaenger()) window.history.back();
    else window.location.hash = '#/statistik';
  });
  return knopfEl;
}

function standEtikett(zeile) {
  if (zeile.stand === 'kein_soll') {
    return el('span', { class: 'stand stand--kein', text: 'kein Soll' });
  }
  if (zeile.stand === 'vollstaendig') {
    return el('span', { class: 'stand stand--gut' }, [
      icon('haken', 16),
      el('span', { text: 'vollständig' }),
    ]);
  }
  return el('span', { class: 'stand stand--offen' }, [
    icon('warnung', 16),
    el('span', { text: standText(zeile) }),
  ]);
}

function summenKachel(label, wert, art) {
  return el('div', { class: `summenkachel summenkachel--${art}` }, [
    el('p', { class: 'summenkachel__wert', text: String(wert) }),
    el('p', { class: 'summenkachel__label', text: label }),
  ]);
}
