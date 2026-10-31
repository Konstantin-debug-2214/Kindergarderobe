/**
 * backup.js – Backup exportieren, prüfen, einspielen und erinnern.
 *
 * Die Prüffunktionen sind rein (ohne DOM) und damit testbar. Nur das
 * Teilen bzw. Herunterladen braucht den Browser.
 */

import { SCHEMA_VERSION, jahreszeit, pruefeTeil } from './model.js';
import { gesamtsumme } from './costs.js';

export const BACKUP_KENNUNG = 'kindergarderobe';

/* --- Erinnerung ----------------------------------------------------------- */

/**
 * Ist ein Backup fällig? Laut CLAUDE.md gilt das, sobald seit dem letzten
 * Backup etwas geändert wurde. Es gibt kein Zeitintervall.
 * @param {{aenderungenSeitBackup?: number}} einstellungen
 */
export function backupFaellig(einstellungen) {
  return (einstellungen?.aenderungenSeitBackup ?? 0) > 0;
}

/**
 * Soll der Backup-Hinweis auf der Übersicht erscheinen?
 *
 * Der Ausblenden-Knopf merkt sich den Zählerstand. Der Hinweis kommt zurück,
 * sobald seitdem wieder etwas geändert wurde – auch nach einem Neuladen.
 * Ein gemerkter Stand über dem aktuellen Zähler ist veraltet (etwa nach einem
 * eingespielten Backup) und wird nicht beachtet.
 *
 * @param {{aenderungenSeitBackup?: number}} einstellungen
 * @param {number|null} ausgeblendetBei Zählerstand beim Ausblenden
 */
export function bannerSichtbar(einstellungen, ausgeblendetBei) {
  if (!backupFaellig(einstellungen)) return false;
  if (!Number.isInteger(ausgeblendetBei)) return true;
  return einstellungen.aenderungenSeitBackup > ausgeblendetBei;
}

/**
 * Alter des letzten Backups in ganzen Tagen, oder null wenn es keines gibt.
 * @param {string|null} letztesBackupAm ISO-Zeitstempel
 * @param {Date} [heute]
 */
export function backupAlterInTagen(letztesBackupAm, heute = new Date()) {
  if (!letztesBackupAm) return null;
  const damals = new Date(letztesBackupAm);
  if (Number.isNaN(damals.getTime())) return null;
  const msProTag = 24 * 60 * 60 * 1000;
  // Auf ganze Tage gerundet, von Mitternacht zu Mitternacht gerechnet.
  const vonTag = Date.UTC(damals.getFullYear(), damals.getMonth(), damals.getDate());
  const bisTag = Date.UTC(heute.getFullYear(), heute.getMonth(), heute.getDate());
  return Math.max(0, Math.round((bisTag - vonTag) / msProTag));
}

/* --- Export --------------------------------------------------------------- */

/** Dateiname nach dem Muster kindergarderobe-backup-JJJJ-MM-TT.json */
export function backupDateiname(datum = new Date()) {
  const jahr = datum.getFullYear();
  const monat = String(datum.getMonth() + 1).padStart(2, '0');
  const tag = String(datum.getDate()).padStart(2, '0');
  return `kindergarderobe-backup-${jahr}-${monat}-${tag}.json`;
}

/**
 * Baut den Inhalt einer Backup-Datei. Rein, ohne DOM.
 * @param {Object} zustand der gespeicherte Zustand
 * @returns {{dateiname: string, text: string, inhalt: Object}}
 */
export function erstelleBackup(zustand, datum = new Date()) {
  const inhalt = {
    app: BACKUP_KENNUNG,
    version: SCHEMA_VERSION,
    erstelltAm: datum.toISOString(),
    daten: {
      teile: zustand.teile ?? [],
      ausgaben: zustand.ausgaben ?? [],
      marken: zustand.marken ?? [],
      sollMengen: zustand.sollMengen ?? [],
      einstellungen: { name: zustand.einstellungen?.name ?? '' },
    },
  };

  return {
    dateiname: backupDateiname(datum),
    text: JSON.stringify(inhalt, null, 2),
    inhalt,
  };
}

/**
 * Exportiert ein Backup: erst über das Teilen-Menü, sonst als Download.
 * Nach Erfolg wird das Backup im Speicher notiert; bei Abbruch ändert sich
 * nichts.
 * @param {Object} speicherModul Instanz aus storage.js
 * @returns {Promise<{status: 'geteilt'|'heruntergeladen'|'abgebrochen', dateiname: string}>}
 */
export async function exportiereBackup(speicherModul) {
  const jetzt = new Date();
  const { dateiname, text } = erstelleBackup(speicherModul.zustand(), jetzt);

  const status = await teileOderLade(dateiname, text);

  if (status !== 'abgebrochen') {
    speicherModul.backupNotieren(jetzt.toISOString());
  }

  return { status, dateiname };
}

async function teileOderLade(dateiname, text) {
  const datei = new File([text], dateiname, { type: 'application/json' });

  if (navigator.canShare?.({ files: [datei] })) {
    try {
      await navigator.share({ files: [datei], title: 'Kindergarderobe – Backup' });
      return 'geteilt';
    } catch (fehler) {
      if (fehler?.name === 'AbortError') return 'abgebrochen';
      // Teilen hat nicht geklappt: auf den Download zurückfallen.
    }
  }

  lade(dateiname, text);
  return 'heruntergeladen';
}

/**
 * Lädt die Rohdaten beschädigter Daten als Textdatei herunter – damit nichts
 * verloren geht und sich die Daten notfalls von Hand retten lassen.
 * Bewusst .txt: Die Datei ist kein Backup und lässt sich nicht einspielen.
 * @param {string} text
 * @returns {string} Dateiname
 */
export function ladeRohdatenHerunter(text, datum = new Date()) {
  const dateiname = backupDateiname(datum)
    .replace('-backup-', '-rohdaten-')
    .replace(/\.json$/, '.txt');
  lade(dateiname, text, 'text/plain');
  return dateiname;
}

function lade(dateiname, text, typ = 'application/json') {
  const blob = new Blob([text], { type: typ });
  const adresse = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = adresse;
  link.download = dateiname;
  document.body.append(link);
  link.click();
  link.remove();
  // Erst nach einem Moment freigeben: Manche Browser brechen den Download
  // sonst ab, weil die Adresse schon ungültig ist, bevor er beginnt.
  setTimeout(() => URL.revokeObjectURL(adresse), 60_000);
}

/* --- Import prüfen -------------------------------------------------------- */

/**
 * Prüft den Inhalt einer Backup-Datei, ohne etwas zu verändern.
 * @param {{dateiname: string, text: string}} datei
 * @returns {{ok: true, vorschau: Object, daten: Object}|{ok: false, fehler: string, einzelheiten?: Array<string>}}
 */
export function pruefeImport({ dateiname, text }) {
  let inhalt;
  try {
    inhalt = JSON.parse(text);
  } catch {
    return { ok: false, fehler: 'Die Datei ist keine gültige JSON-Datei.' };
  }

  if (!inhalt || typeof inhalt !== 'object' || Array.isArray(inhalt)) {
    return { ok: false, fehler: 'Die Datei hat nicht den erwarteten Aufbau.' };
  }

  if (inhalt.app !== BACKUP_KENNUNG) {
    return { ok: false, fehler: 'Diese Datei ist kein Backup der Kindergarderobe.' };
  }

  if (!Number.isInteger(inhalt.version)) {
    return { ok: false, fehler: 'Im Backup fehlt die Versionsangabe.' };
  }

  if (inhalt.version > SCHEMA_VERSION) {
    return {
      ok: false,
      fehler: 'Das Backup stammt aus einer neueren Version der App und kann nicht '
        + 'eingespielt werden.',
    };
  }

  const daten = inhalt.daten;
  if (!daten || typeof daten !== 'object' || !Array.isArray(daten.teile)) {
    return { ok: false, fehler: 'Im Backup fehlen die Daten.' };
  }

  if (daten.ausgaben !== undefined && !Array.isArray(daten.ausgaben)) {
    return { ok: false, fehler: 'Die Kosten im Backup haben nicht den erwarteten Aufbau.' };
  }

  // Auch Marken, Soll-Mengen, Name und die einzelnen Ausgaben prüfen: Eine
  // fremde oder bearbeitete Datei darf die App nach dem Einspielen nicht
  // stolpern lassen.
  const aufbau = pruefeUebrigenAufbau(daten);
  if (aufbau.length > 0) {
    return {
      ok: false,
      fehler: 'Das Backup hat nicht den erwarteten Aufbau.',
      einzelheiten: aufbau.slice(0, 5),
    };
  }

  const einzelheiten = [];
  daten.teile.forEach((teil, nummer) => {
    const fehler = pruefeTeil(teil);
    if (fehler.length > 0) {
      const name = typeof teil?.name === 'string' && teil.name ? teil.name : `Teil ${nummer + 1}`;
      einzelheiten.push(`${name}: ${fehler.join(' ')}`);
    }
  });

  if (einzelheiten.length > 0) {
    return {
      ok: false,
      fehler: einzelheiten.length === 1
        ? 'Ein Teil im Backup ist fehlerhaft.'
        : `${einzelheiten.length} Teile im Backup sind fehlerhaft.`,
      einzelheiten: einzelheiten.slice(0, 5),
    };
  }

  const ausgaben = daten.ausgaben ?? [];
  const marken = daten.marken ?? [];

  return {
    ok: true,
    daten,
    vorschau: {
      dateiname,
      erstelltAm: inhalt.erstelltAm ?? null,
      teileStueck: stueckzahl(daten.teile.filter((t) => !t.aussortiert)),
      aussortiertStueck: stueckzahl(daten.teile.filter((t) => t.aussortiert)),
      kostenAnzahl: ausgaben.length,
      kostenSumme: gesamtsumme(ausgaben),
      markenAnzahl: marken.length,
      name: daten.einstellungen?.name ?? '',
    },
  };
}

const DATUM_MUSTER = /^\d{4}-\d{2}-\d{2}/;

const istText = (wert) => typeof wert === 'string' && wert.trim() !== '';

/** Doppelte Werte einer Liste, z. B. Ids. */
function doppelte(werte) {
  const gesehen = new Set();
  return [...new Set(werte.filter((wert) => gesehen.has(wert) || !gesehen.add(wert)))];
}

/**
 * Prüft alles außer den Teilen selbst (die prüft pruefeTeil).
 * @returns {Array<string>} Beschreibungen der Fehler, leer wenn alles passt
 */
function pruefeUebrigenAufbau(daten) {
  const fehler = [];

  const ausgaben = daten.ausgaben ?? [];
  ausgaben.forEach((ausgabe, nummer) => {
    const name = `Kosten-Eintrag ${nummer + 1}`;
    if (!ausgabe || typeof ausgabe !== 'object') {
      fehler.push(`${name}: kein gültiger Eintrag.`);
      return;
    }
    if (!istText(ausgabe.id)) fehler.push(`${name}: die Kennung fehlt.`);
    if (typeof ausgabe.bezeichnung !== 'string') fehler.push(`${name}: die Bezeichnung fehlt.`);
    if (!DATUM_MUSTER.test(String(ausgabe.datum ?? ''))) fehler.push(`${name}: das Datum fehlt.`);
    if (!Number.isInteger(ausgabe.betrag) || ausgabe.betrag < 0) {
      fehler.push(`${name}: der Betrag ist keine ganze Zahl in Cent.`);
    }
    if (!Number.isInteger(ausgabe.anzahlTeile) || ausgabe.anzahlTeile < 1) {
      fehler.push(`${name}: die Anzahl der Teile muss eine ganze Zahl ab 1 sein.`);
    }
  });
  for (const id of doppelte(ausgaben.map((a) => a?.id).filter(istText))) {
    fehler.push(`Die Kennung ${id} steht bei mehreren Kosten-Einträgen.`);
  }

  for (const id of doppelte(daten.teile.map((teil) => teil?.id).filter(istText))) {
    fehler.push(`Die Kennung ${id} steht bei mehreren Teilen.`);
  }

  if (daten.marken !== undefined
    && (!Array.isArray(daten.marken) || !daten.marken.every(istText))) {
    fehler.push('Die Marken müssen eine Liste von Namen sein.');
  }

  if (daten.sollMengen !== undefined) {
    if (!Array.isArray(daten.sollMengen)) {
      fehler.push('Die Soll-Mengen müssen eine Liste sein.');
    } else {
      daten.sollMengen.forEach((eintrag, nummer) => {
        const gueltig = eintrag && typeof eintrag === 'object'
          && istText(eintrag.art)
          && Boolean(jahreszeit(eintrag.jahreszeit))
          && Number.isInteger(eintrag.soll) && eintrag.soll >= 0;
        if (!gueltig) {
          fehler.push(`Soll-Menge ${nummer + 1}: Art, Jahreszeit und Soll (ganze Zahl) werden gebraucht.`);
        }
      });
    }
  }

  const einstellungen = daten.einstellungen;
  if (einstellungen !== undefined) {
    if (!einstellungen || typeof einstellungen !== 'object' || Array.isArray(einstellungen)) {
      fehler.push('Die Einstellungen haben nicht den erwarteten Aufbau.');
    } else if (einstellungen.name !== undefined && typeof einstellungen.name !== 'string') {
      fehler.push('Der Name des Kindes muss ein Text sein.');
    }
  }

  return fehler;
}

/** Immer nach Stück zählen (Feld anzahl), nie nach Einträgen. */
function stueckzahl(teile) {
  return teile.reduce((summe, teil) => summe + (Number(teil.anzahl) || 0), 0);
}

/**
 * Spielt ein geprüftes Backup ein und ersetzt alle aktuellen Daten.
 * Nur nach ausdrücklicher Bestätigung aufrufen.
 * @param {Object} speicherModul Instanz aus storage.js
 * @param {Object} ergebnis Rückgabe von pruefeImport mit ok: true
 */
export function spieleImportEin(speicherModul, ergebnis) {
  if (!ergebnis?.ok) throw new Error('Nur ein geprüftes Backup kann eingespielt werden.');
  speicherModul.allesErsetzen(ergebnis.daten, {
    letztesBackupAm: ergebnis.vorschau.erstelltAm ?? new Date().toISOString(),
  });
}
