/**
 * einstellungen.js – Screen "Einstellungen & Backup" (#/einstellungen).
 *
 * Auf dem Smartphone ist dieser Screen zugleich der Eintrag "Mehr" aus der
 * unteren Leiste und führt von hier zu Kosten sowie Soll-Mengen & Saisonwechsel.
 *
 * Die Karte "Backup-Erinnerung" aus dem Design entfällt bewusst
 * (siehe CLAUDE.md, "Bekannte Fehler im Design").
 */

import { el } from '../ui/dom.js';
import { kopfzeile } from '../ui/kopfzeile.js';
import { banner } from '../ui/banner.js';
import { frageNach } from '../ui/dialog.js';
import { anzeigeKasten, grosserKnopf, karte, listenZeile, textfeld } from '../ui/felder.js';
import { speicher, SpeicherFehler } from '../storage.js';
import {
  backupAlterInTagen,
  backupFaellig,
  exportiereBackup,
  pruefeImport,
  spieleImportEin,
} from '../backup.js';
import { formatEuro, jahressumme } from '../costs.js';

/** Begrüßung aus dem gespeicherten Namen; ohne Namen schlicht "Hallo!". */
export function begruessung(name) {
  const sauber = (name ?? '').trim();
  return sauber === '' ? 'Hallo!' : `Hallo, ${sauber}!`;
}

const DATUM_FORMAT = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

function formatDatum(isoText) {
  if (!isoText) return null;
  const datum = new Date(isoText);
  return Number.isNaN(datum.getTime()) ? null : DATUM_FORMAT.format(datum);
}

/**
 * Zuletzt gezeigte Rückmeldung (Export, Import). Sie liegt außerhalb des
 * Screens, weil jede Datenänderung den Screen neu aufbaut – sonst wäre die
 * Erfolgsmeldung sofort wieder weg. Beim Betreten des Screens wird sie
 * zurückgesetzt.
 * @type {null|{art: string, text: string, zusatz?: string}}
 */
let letzteMeldung = null;

export function einstellungenScreen(parameter, { neuZeichnen = () => {}, frisch = true } = {}) {
  if (frisch) letzteMeldung = null;

  const einstellungen = speicher.einstellungen();

  // Bereich für Rückmeldungen nach Export und Import.
  const meldungsbereich = el(
    'div',
    { class: 'meldungsbereich' },
    letzteMeldung ? [banner(letzteMeldung)] : [],
  );

  /**
   * Merkt die Meldung und baut den Screen neu auf. Das Neuzeichnen ist nötig,
   * weil Export und Import die Daten ändern und der Screen dadurch ohnehin
   * schon einmal neu gebaut wurde – dieser Aufruf hier hängt die Meldung in
   * die aktuelle Fassung.
   */
  function zeigeMeldung(meldung) {
    letzteMeldung = meldung;
    neuZeichnen();
  }

  return el('div', { class: 'inhalt' }, [
    kopfzeile({
      titel: 'Einstellungen & Backup',
      zurueckZu: '#/',
      zurueckKlasse: 'nur-tablet',
    }),

    // Auf dem Smartphone führen diese Zeilen zu den Screens ohne eigenen
    // Eintrag in der unteren Leiste.
    el('nav', { class: 'einstellungen__zeilen nur-smartphone', 'aria-label': 'Weitere Bereiche' }, [
      listenZeile({
        text: 'Kosten',
        wert: formatEuro(jahressumme(speicher.ausgaben(), new Date().getFullYear())),
        href: '#/kosten',
        iconName: 'euro',
      }),
      listenZeile({
        text: 'Soll-Mengen & Saisonwechsel',
        href: '#/saisonwechsel',
        iconName: 'liste',
      }),
    ]),

    meldungsbereich,

    el('div', { class: 'einstellungen__raster' }, [
      begruessungsKarte(einstellungen),
      backupKarte(einstellungen, zeigeMeldung),
    ]),
  ]);
}

/* --- Karte "Begrüßung" ---------------------------------------------------- */

function begruessungsKarte(einstellungen) {
  const vorschau = anzeigeKasten({
    label: 'So sieht es aus',
    wert: begruessung(einstellungen.name),
  });

  const feld = textfeld({
    label: 'Name des Kindes',
    wert: einstellungen.name,
    platzhalter: 'z. B. Mila',
    // Live-Vorschau bei jedem Tastendruck, gespeichert wird beim Verlassen
    // des Feldes oder mit der Eingabetaste – sonst würde das Neuzeichnen
    // nach dem Speichern den Schreibfluss unterbrechen.
    beiEingabe: (wert) => vorschau.setzeWert(begruessung(wert)),
    beiAenderung: (wert) => {
      if (wert === einstellungen.name) return;
      speicher.nameSetzen(wert);
    },
  });

  return karte({
    titel: 'Begrüßung',
    klasse: 'einstellungen__karte',
    inhalt: [feld, vorschau.element],
  });
}

/* --- Karte "Backup" ------------------------------------------------------- */

function backupKarte(einstellungen, zeigeMeldung) {
  const status = backupStatus(einstellungen);

  const exportKnopf = grosserKnopf({
    titel: 'Backup exportieren',
    hinweis: 'öffnet das Teilen-Menü (JSON-Datei)',
    iconName: 'export',
    variante: 'primaer',
    beiKlick: () => starteExport(zeigeMeldung),
  });

  const importKnopf = grosserKnopf({
    titel: 'Backup einspielen',
    hinweis: 'Datei wählen, Vorschau prüfen',
    iconName: 'import',
    beiKlick: () => starteImport(zeigeMeldung),
  });

  return karte({
    titel: 'Backup',
    klasse: 'einstellungen__karte',
    inhalt: [
      status,
      el('div', { class: 'einstellungen__backup-knoepfe' }, [exportKnopf, importKnopf]),
    ],
  });
}

/** Statusbanner: fällig (sandfarben) oder gesichert (grün). */
function backupStatus(einstellungen) {
  const faellig = backupFaellig(einstellungen);
  const datum = formatDatum(einstellungen.letztesBackupAm);
  const tage = backupAlterInTagen(einstellungen.letztesBackupAm);

  if (!datum) {
    return banner({
      art: faellig ? 'hinweis' : 'erfolg',
      text: 'Noch kein Backup vorhanden.',
      zusatz: faellig
        ? 'Es gibt ungesicherte Änderungen – jetzt das erste Backup anlegen.'
        : 'Sobald Daten da sind, lohnt sich das erste Backup.',
    });
  }

  return banner({
    art: faellig ? 'hinweis' : 'erfolg',
    text: `Letztes Backup: ${datum}`,
    zusatz: faellig
      ? `${alterText(tage)} – es gibt Änderungen seitdem, ein neues Backup ist fällig`
      : `${alterText(tage)} – alle Änderungen sind gesichert`,
  });
}

/** "heute", "vor 1 Tag" oder "vor 59 Tagen". */
export function alterText(tage) {
  if (tage === null || tage === undefined) return '';
  if (tage === 0) return 'heute';
  if (tage === 1) return 'vor 1 Tag';
  return `vor ${tage} Tagen`;
}

/* --- Export --------------------------------------------------------------- */

async function starteExport(zeigeMeldung) {
  try {
    const { status, dateiname } = await exportiereBackup(speicher);

    if (status === 'abgebrochen') {
      zeigeMeldung({
        art: 'hinweis',
        text: 'Das Backup wurde nicht gesichert.',
        zusatz: 'Das Teilen wurde abgebrochen – es hat sich nichts geändert.',
      });
      return;
    }

    zeigeMeldung({
      art: 'erfolg',
      text: 'Backup gesichert.',
      zusatz: status === 'geteilt'
        ? `${dateiname} wurde geteilt.`
        : `${dateiname} wurde heruntergeladen.`,
    });
  } catch (fehler) {
    zeigeMeldung({
      art: 'fehler',
      rolle: 'alert',
      text: 'Das Backup konnte nicht erstellt werden.',
      zusatz: fehler instanceof SpeicherFehler ? fehler.message : String(fehler.message ?? fehler),
    });
  }
}

/* --- Import --------------------------------------------------------------- */

function waehleDatei() {
  return new Promise((fertig) => {
    const eingabe = el('input', {
      type: 'file',
      accept: 'application/json,.json',
      class: 'nur-vorlesehilfe',
    });

    eingabe.addEventListener('change', () => {
      fertig(eingabe.files?.[0] ?? null);
      eingabe.remove();
    });
    // Bricht der Nutzer die Dateiauswahl ab, kommt kein "change" – der
    // Knopf bleibt dann einfach ohne Wirkung.
    eingabe.addEventListener('cancel', () => {
      fertig(null);
      eingabe.remove();
    });

    document.body.append(eingabe);
    eingabe.click();
  });
}

async function starteImport(zeigeMeldung) {
  const datei = await waehleDatei();
  if (!datei) return;

  let text;
  try {
    text = await datei.text();
  } catch {
    zeigeMeldung({
      art: 'fehler',
      rolle: 'alert',
      text: 'Die Datei konnte nicht gelesen werden.',
    });
    return;
  }

  const ergebnis = pruefeImport({ dateiname: datei.name, text });

  if (!ergebnis.ok) {
    zeigeMeldung({
      art: 'fehler',
      rolle: 'alert',
      text: ergebnis.fehler,
      zusatz: ergebnis.einzelheiten?.join(' · '),
    });
    return;
  }

  const bestaetigt = await frageNach({
    titel: 'Backup einspielen?',
    inhalt: [vorschauListe(ergebnis.vorschau)],
    warnung: 'Alle aktuellen Daten werden ersetzt. Das lässt sich nicht rückgängig machen.',
    bestaetigenText: 'Daten ersetzen',
  });

  if (!bestaetigt) {
    zeigeMeldung({ art: 'hinweis', text: 'Es wurde nichts verändert.' });
    return;
  }

  try {
    spieleImportEin(speicher, ergebnis);
    zeigeMeldung({
      art: 'erfolg',
      text: 'Backup eingespielt.',
      zusatz: `${ergebnis.vorschau.teileStueck} Teile wurden wiederhergestellt.`,
    });
  } catch (fehler) {
    zeigeMeldung({
      art: 'fehler',
      rolle: 'alert',
      text: 'Das Backup konnte nicht eingespielt werden.',
      zusatz: fehler instanceof SpeicherFehler ? fehler.message : String(fehler.message ?? fehler),
    });
  }
}

/** Vorschau der Datei als Liste aus Bezeichnung und Wert. */
function vorschauListe(vorschau) {
  const zeilen = [
    ['Datei', vorschau.dateiname],
    ['Erstellt am', formatDatum(vorschau.erstelltAm) ?? 'unbekannt'],
    ['Teile', `${vorschau.teileStueck}`],
    ['Aussortiert', `${vorschau.aussortiertStueck}`],
    ['Kosten', `${vorschau.kostenAnzahl} Einträge · ${formatEuro(vorschau.kostenSumme)}`],
    ['Marken', `${vorschau.markenAnzahl}`],
  ];

  if (vorschau.name) zeilen.push(['Name des Kindes', vorschau.name]);

  return el(
    'dl',
    { class: 'vorschau' },
    zeilen.flatMap(([bezeichnung, wert]) => [
      el('dt', { class: 'vorschau__bezeichnung', text: bezeichnung }),
      el('dd', { class: 'vorschau__wert', text: wert }),
    ]),
  );
}
