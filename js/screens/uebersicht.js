/**
 * uebersicht.js – Screen "Übersicht" (#/).
 *
 * Datum, Begrüßung, Backup-Hinweis, sechs Kategorie-Kacheln, vier
 * Jahreszeiten-Kacheln. Beim Tippen in die Suche treten die Treffer an die
 * Stelle der Kacheln. Der Suchbegriff steht in der Adresse (#/?suche=…),
 * damit "Zurück" aus einer Gruppe oder einem Teil zu denselben Treffern führt.
 */

import { el, leeren } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { iconKnopf, knopf, suchfeld } from '../ui/knoepfe.js';
import { banner } from '../ui/banner.js';
import { jahreszeitKachel, kategorieKachel, leererZustand, teilKarte } from '../ui/kacheln.js';
import { ergebnisliste, geltendeAnsicht } from '../ui/ergebnisliste.js';
import { speicher } from '../storage.js';
import { adresseMitWerten, aktualisiereAdresse } from '../router.js';
import { backupAlterInTagen, bannerSichtbar, exportiereBackup } from '../backup.js';
import {
  einheit,
  imSchrank,
  passtZurSuche,
  stueck,
  suche as sucheTeile,
  teileZuStatistik,
  zaehleJeJahreszeit,
  zaehleJeKategorie,
} from '../filters.js';
import { JAHRESZEITEN, KATEGORIEN, aktuelleJahreszeit } from '../model.js';
import { alterText, begruessung } from './einstellungen.js';

/**
 * Suchbegriff der Übersicht. Liegt außerhalb der Zeichenfunktion, weil jede
 * Datenänderung den Screen neu aufbaut. Beim Betreten kommt er aus der
 * Adresse – ohne ?suche=… beginnt die Übersicht leer.
 */
let suchbegriff = '';

/** Ansicht aus der Adresse (?ansicht=…); hat Vorrang vor der gemerkten Wahl. */
let ansichtAusAdresse = null;

/** Formatiert das heutige Datum, z. B. "Montag, 13. Oktober". */
function heutigesDatum() {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
}

/** Text des Backup-Hinweises, abhängig davon, ob es schon ein Backup gibt. */
export function bannerText(letztesBackupAm, heute = new Date()) {
  const tage = backupAlterInTagen(letztesBackupAm, heute);

  if (tage === null) {
    return 'Es gibt noch kein Backup. Zeit, die Daten zu sichern.';
  }
  if (tage === 0) {
    return 'Seit dem letzten Backup hat sich etwas geändert. Zeit, die Daten zu sichern.';
  }
  return `Das letzte Backup ist ${alterText(tage).replace('vor ', '')} alt. `
    + 'Zeit, die Daten zu sichern.';
}

export function uebersichtScreen(parameter = {}, { neuZeichnen = () => {}, frisch = true } = {}) {
  if (frisch) {
    suchbegriff = String(parameter.suche ?? '');
    ansichtAusAdresse = parameter.ansicht ?? null;
  }

  // Aus der Statistik kommt ein Filter in der Adresse: #/?art=… oder #/?groesse=…
  const statistikFilter = filterAusAdresse(parameter);

  /** Suche, Statistik-Filter und Ansicht als Adresse – ohne Verlaufseintrag. */
  function merkeInAdresse() {
    aktualisiereAdresse(adresseMitWerten('/', {
      art: statistikFilter?.art,
      groesse: statistikFilter?.groesse,
      suche: suchbegriff.trim() === '' ? null : suchbegriff,
      ansicht: ansichtAusAdresse,
    }));
  }

  /** Was die Trefferlisten zum Zusammenfassen brauchen. */
  const liste = {
    ansicht: () => geltendeAnsicht(ansichtAusAdresse, speicher.ansichtGemerkt()),
    wechsleAnsicht: (neu) => {
      ansichtAusAdresse = null;
      speicher.ansichtMerken(neu);
      merkeInAdresse();
      zeichneErgebnis();
    },
    // Tipp auf eine Gruppe: Kategorie-Ansicht mit dieser Art, einzeln. Suche
    // und Größe aus der Statistik gehen mit, damit genau diese Teile kommen.
    gruppenZiel: (gruppe) => adresseMitWerten(`/kategorie/${gruppe.kategorie}`, {
      art: gruppe.art,
      groesse: statistikFilter?.groesse,
      suche: suchbegriff.trim() === '' ? null : suchbegriff.trim(),
      ansicht: 'einzeln',
    }),
  };

  const einstellungen = speicher.einstellungen();
  const teile = speicher.teile();

  const begruessungsBlock = el('div', { class: 'uebersicht__begruessung' }, [
    el('p', { class: 'uebersicht__datum', text: heutigesDatum() }),
    el('h1', { class: 'uebersicht__hallo', text: begruessung(einstellungen.name) }),
  ]);

  // Beim Tippen wird nur dieser Bereich getauscht, damit der Fokus im
  // Suchfeld bleibt.
  const ergebnis = el('div', { class: 'uebersicht__ergebnis' });

  function zeichneErgebnis() {
    const trefferModus = Boolean(statistikFilter) || suchbegriff.trim() !== '';
    leeren(ergebnis).append(
      statistikFilter
        ? gefilterterBereich(teile, statistikFilter, suchbegriff, liste)
        : (trefferModus ? trefferBereich(teile, suchbegriff, liste) : kachelBereiche(teile)),
    );
    ordneBanner(trefferModus);
  }

  /**
   * Bei Treffern steht die Trefferzahl direkt unter dem Suchfeld; der
   * Backup-Hinweis rückt dafür ans Ende der Liste.
   */
  function ordneBanner(trefferModus) {
    if (!bannerHuelle || !ergebnis.parentNode) return;
    if (trefferModus) ergebnis.after(bannerHuelle);
    else ergebnis.before(bannerHuelle);
  }

  function sucheFeld(klasse) {
    return suchfeld({
      label: 'Kleidung oder Spielzeug suchen',
      platzhalter: 'Kleidung oder Spielzeug suchen',
      klasse,
      wert: suchbegriff,
      beiEingabe: (wert) => {
        suchbegriff = wert;
        merkeInAdresse();
        zeichneErgebnis();
      },
    });
  }

  // Tablet: alle Ziele liegen offen in der Kopfzeile.
  const werkzeugeTablet = el('div', { class: 'uebersicht__werkzeuge nur-tablet' }, [
    sucheFeld('uebersicht__suche'),
    knopf({ text: 'Kosten', href: '#/kosten', iconName: 'euro' }),
    iconKnopf({ label: 'Statistik', iconName: 'statistik', href: '#/statistik' }),
    iconKnopf({ label: 'Aussortiert', iconName: 'aussortiert', href: '#/aussortiert' }),
    iconKnopf({ label: 'Einstellungen', iconName: 'einstellungen', href: '#/einstellungen' }),
    knopf({ text: 'Teil hinzufügen', href: '#/neu', iconName: 'plus', variante: 'primaer' }),
  ]);

  // Smartphone: nur der "€"-Knopf; alles Weitere liegt in der unteren Leiste.
  const werkzeugeSmartphone = el('div', { class: 'uebersicht__werkzeuge nur-smartphone' }, [
    iconKnopf({ label: 'Kosten', iconName: 'euro', href: '#/kosten' }),
  ]);

  const sucheSmartphone = el('div', { class: 'uebersicht__suche-zeile nur-smartphone' }, [
    sucheFeld(),
  ]);

  const hinweis = backupBanner(einstellungen, neuZeichnen);
  const bannerHuelle = hinweis ? el('div', { class: 'uebersicht__banner' }, [hinweis]) : null;

  const screen = el('div', { class: 'inhalt' }, [
    el('header', { class: 'uebersicht__kopf' }, [
      begruessungsBlock,
      werkzeugeTablet,
      werkzeugeSmartphone,
    ]),
    sucheSmartphone,
    bannerHuelle,
    ergebnis,
  ]);

  zeichneErgebnis();
  return screen;
}

/* --- Kacheln -------------------------------------------------------------- */

function kachelBereiche(teile) {
  const jeKategorie = zaehleJeKategorie(teile);
  const jeJahreszeit = zaehleJeJahreszeit(teile);
  const gesamt = stueck(imSchrank(teile));
  const jetzt = aktuelleJahreszeit();

  return el('div', {}, [
    el('section', { class: 'bereich' }, [
      el('div', { class: 'bereich__kopf' }, [
        el('h2', { class: 'bereich__titel', text: 'Kategorien' }),
        el('p', {
          class: 'bereich__zusatz',
          text: `${gesamt} ${einheit(null, gesamt)} insgesamt`,
        }),
      ]),
      el(
        'div',
        { class: 'kachelraster' },
        KATEGORIEN.map((k) => kategorieKachel({
          id: k.id,
          name: k.name,
          anzahl: jeKategorie[k.id] ?? 0,
        })),
      ),
    ]),

    el('section', { class: 'bereich' }, [
      el('div', { class: 'bereich__kopf' }, [
        el('h2', { class: 'bereich__titel', text: 'Nach Jahreszeit' }),
      ]),
      el(
        'div',
        { class: 'jahreszeitraster' },
        JAHRESZEITEN.map((j) => jahreszeitKachel({
          id: j.id,
          name: j.name,
          monate: j.monateKurz,
          anzahl: jeJahreszeit[j.id] ?? 0,
          jetzt: j.id === jetzt,
        })),
      ),
    ]),
  ]);
}

/* --- Suchtreffer ---------------------------------------------------------- */

/** Überschrift der Trefferansicht: "175 Treffer" (Stückzahl). */
function trefferKopf(gefunden) {
  return el('h2', { class: 'bereich__titel trefferzahl', text: `${gefunden} Treffer` });
}

function trefferBereich(teile, begriff, liste) {
  const treffer = sucheTeile(teile, begriff);

  if (treffer.length === 0) {
    return el('section', { class: 'bereich' }, [
      leererZustand({
        text: `Nichts gefunden für „${begriff.trim()}“.`,
        hinweis: 'Gesucht wird in Name, Art, Marke, Notiz und freien Merkmalen. '
          + 'Aussortierte Teile erscheinen hier nicht.',
      }),
    ]);
  }

  return el('section', { class: 'bereich' }, [
    el('div', { class: 'bereich__kopf' }, [trefferKopf(stueck(treffer))]),
    trefferListe(treffer, liste),
  ]);
}

/** Karten der Treffer – nach Art zusammengefasst oder einzeln. */
function trefferListe(treffer, liste) {
  return ergebnisliste({
    teile: treffer,
    ansicht: liste.ansicht(),
    beiAnsicht: liste.wechsleAnsicht,
    karte: (teil) => teilKarte(teil, { zeigeKategorie: true }),
    gruppenZiel: liste.gruppenZiel,
    zeigeKategorie: true,
  });
}

/* --- Backup-Hinweis ------------------------------------------------------- */

function backupBanner(einstellungen, neuZeichnen) {
  if (!bannerSichtbar(einstellungen, speicher.bannerAusgeblendetBei())) return null;

  const sichern = knopf({ text: 'Jetzt sichern', variante: 'primaer' });
  sichern.addEventListener('click', async () => {
    sichern.disabled = true;
    try {
      await exportiereBackup(speicher);
    } finally {
      sichern.disabled = false;
    }
  });

  return banner({
    art: 'hinweis',
    text: bannerText(einstellungen.letztesBackupAm),
    aktionen: [sichern],
    beiSchliessen: () => {
      // Den Zählerstand merken: Jede Änderung erhöht ihn, dadurch erscheint
      // der Hinweis von selbst wieder – auch nach einem Neuladen.
      speicher.bannerAusblenden(einstellungen.aenderungenSeitBackup);
      neuZeichnen();
    },
  });
}

/* --- Trefferansicht aus der Statistik ------------------------------------- */

/**
 * Liest einen Filter aus der Adresse.
 * @returns {{art?: string, groesse?: number, beschriftung: string}|null}
 */
function filterAusAdresse(parameter) {
  const art = parameter.art ? String(parameter.art) : null;
  const groesseRoh = parameter.groesse ? Number(parameter.groesse) : null;
  const groesse = Number.isFinite(groesseRoh) ? groesseRoh : null;

  if (!art && groesse === null) return null;

  return {
    art,
    groesse,
    beschriftung: art ? `Art: ${art}` : `Größe ${groesse}`,
  };
}

function gefilterterBereich(teile, filter, begriff, liste) {
  const treffer = teileZuStatistik(teile, filter)
    .filter((teil) => passtZurSuche(teil, begriff));

  // Das "×" nimmt den Filter weg und bringt die Kacheln zurück.
  const entfernen = el('a', {
    class: 'filterchip__entfernen',
    href: '#/',
    'aria-label': `Filter ${filter.beschriftung} entfernen`,
  }, [icon('schliessen', 16)]);

  const chip = el('span', { class: 'filterchip' }, [
    el('span', { text: filter.beschriftung }),
    entfernen,
  ]);

  return el('section', { class: 'bereich' }, [
    el('div', { class: 'bereich__kopf' }, [trefferKopf(stueck(treffer))]),
    el('div', { class: 'filterchips trefferchips' }, [chip]),
    treffer.length > 0
      ? trefferListe(treffer, liste)
      : leererZustand({
        text: `Nichts gefunden für „${filter.beschriftung}“.`,
        hinweis: 'Aussortierte Teile erscheinen hier nicht.',
      }),
  ]);
}
