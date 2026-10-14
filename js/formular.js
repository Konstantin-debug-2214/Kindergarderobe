/**
 * formular.js – reine Logik für das Formular "Teil hinzufügen / bearbeiten".
 *
 * Kein DOM-Zugriff, damit sich Größen-Schnellauswahl, Zurücksetzen der Art und
 * die Umwandlung zwischen Entwurf und gespeichertem Teil isoliert prüfen lassen.
 */

import {
  GROESSENSYSTEME,
  KATEGORIE_SPIELZEUG,
  PREIS_ART,
  TYP,
  artenVon,
  groessenSystemFuer,
  groessenWerte,
  neuesKleidungsteil,
  neuesSpielzeug,
} from './model.js';

/**
 * Gängige Größen für die Schnellauswahl im Formular.
 * Alles andere liegt hinter "Andere …" – dort steht der volle Wertebereich
 * samt Doppelgrößen und Spannen zur Verfügung.
 */
const GAENGIGE_GROESSEN = {
  // Kita-Alter; der volle Bereich geht von 50 bis 164.
  konfektion: [86, 92, 98, 104, 110, 116, 122, 128, 134],
  // Voller Bereich 17 bis 40.
  schuh: [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34],
  // Kopfumfang in cm, voller Bereich 35 bis 58.
  kopf: [48, 49, 50, 51, 52, 53, 54, 55],
  // Hier ist der volle Bereich kurz genug.
  handschuh: [0, 1, 2, 3, 4, 5, 6],
};

/**
 * Schnellauswahl der Größen eines Größensystems.
 * @param {string} system
 * @returns {Array<number>}
 */
export function gaengigeGroessen(system) {
  return GAENGIGE_GROESSEN[system] ?? groessenWerte(system);
}

/**
 * Größe als Text: Einzelgröße "110", Doppelgröße "98/104",
 * Spanne bei Schuhen "23–26", Kopfumfang mit Einheit "52 cm".
 * @param {{system: string, von: number, bis: number}|null} groesse
 */
export function groesseText(groesse) {
  if (!groesse || typeof groesse !== 'object') return '';
  const { system, von, bis } = groesse;
  if (typeof von !== 'number' || typeof bis !== 'number') return '';

  const einheit = GROESSENSYSTEME[system]?.einheit;
  const nachsatz = einheit ? ` ${einheit}` : '';

  if (von === bis) return `${von}${nachsatz}`;
  // Doppelgrößen in der Konfektion schreibt man mit Schrägstrich.
  const trenner = system === 'konfektion' ? '/' : '–';
  return `${von}${trenner}${bis}${nachsatz}`;
}

/**
 * Passt die Art noch zur Kategorie? Eigene Arten (nicht aus der Liste) gelten
 * nur dann weiter, wenn die Kategorie gleich bleibt.
 * @param {string} kategorieId
 * @param {string} art
 * @param {boolean} eigeneArt wurde die Art über "Andere …" eingegeben?
 */
export function artPasst(kategorieId, art, eigeneArt = false) {
  if (!art) return false;
  if (eigeneArt) return true;
  return artenVon(kategorieId).includes(art);
}

/**
 * Art beim Wechsel der Kategorie: eine nicht mehr passende Art wird
 * zurückgesetzt, eine passende bleibt stehen.
 * @returns {string} die Art, die danach gilt
 */
export function artNachKategoriewechsel(neueKategorie, art, eigeneArt = false) {
  return artPasst(neueKategorie, art, eigeneArt) ? art : '';
}

/**
 * Passt die Größe noch zum Größensystem von Kategorie und Art?
 * Beispiel: Aus "Hose" (Konfektion) wird "Socken" (Schuhgröße).
 */
export function groessePasst(kategorieId, art, groesse) {
  if (!groesse) return false;
  const erwartet = groessenSystemFuer(kategorieId, art);
  return Boolean(erwartet) && groesse.system === erwartet;
}

/** Größe nach einem Wechsel von Kategorie oder Art. */
export function groesseNachWechsel(kategorieId, art, groesse) {
  return groessePasst(kategorieId, art, groesse) ? groesse : null;
}

/* --- Entwurf: der Zustand, mit dem das Formular arbeitet ------------------ */

/**
 * Leerer Entwurf für ein neues Teil.
 * @param {'kleidung'|'spielzeug'} typ
 */
export function leererEntwurf(typ = TYP.KLEIDUNG) {
  return typ === TYP.SPIELZEUG
    ? { ...neuesSpielzeug(), eigeneArt: false }
    : { ...neuesKleidungsteil(), eigeneArt: false };
}

/**
 * Entwurf aus einem gespeicherten Teil.
 * Eine Art, die nicht in der Liste der Kategorie steht, gilt als eigene Art.
 */
export function entwurfAusTeil(teil) {
  return {
    ...teil,
    eigeneArt: Boolean(teil.art) && !artenVon(teil.kategorie).includes(teil.art),
  };
}

/**
 * Wechselt den Entwurf zwischen Kleidung und Spielzeug und übernimmt dabei,
 * was in beiden Formularen vorkommt.
 */
export function entwurfMitTyp(entwurf, typ) {
  if (entwurf.typ === typ) return entwurf;

  const gemeinsam = {
    id: entwurf.id,
    name: entwurf.name,
    anzahl: entwurf.anzahl,
    farbe: entwurf.farbe,
    merkmal: entwurf.merkmal,
    marke: entwurf.marke,
    preis: entwurf.preis,
    notiz: entwurf.notiz,
    hinzugefuegtAm: entwurf.hinzugefuegtAm,
    aussortiert: entwurf.aussortiert,
  };

  return typ === TYP.SPIELZEUG
    ? { ...neuesSpielzeug(gemeinsam), eigeneArt: false, art: '' }
    : { ...neuesKleidungsteil(gemeinsam), eigeneArt: false, art: '' };
}

/**
 * Macht aus dem Entwurf das Teil, das gespeichert wird: ohne Formular-Felder
 * und ohne leere Angaben.
 */
export function teilAusEntwurf(entwurf) {
  const { eigeneArt, ...teil } = entwurf;

  teil.name = String(teil.name ?? '').trim();
  teil.art = String(teil.art ?? '').trim();
  teil.notiz = String(teil.notiz ?? '').trim();

  if (teil.typ === TYP.SPIELZEUG) {
    teil.kategorie = KATEGORIE_SPIELZEUG;
    delete teil.groesse;
    delete teil.jahreszeiten;
    delete teil.passform;
    teil.tags = (teil.tags ?? []).map((t) => String(t).trim()).filter(Boolean);
  } else {
    delete teil.alterAb;
    delete teil.tags;
  }

  // Ein Merkmal ohne "Marke" trägt keine Marke.
  if (teil.merkmal !== 'marke') teil.marke = null;

  return teil;
}

/**
 * Gibt es ungespeicherte Änderungen? Vergleicht den Entwurf mit dem Stand,
 * mit dem das Formular geöffnet wurde.
 */
export function entwurfGeaendert(entwurf, ausgangswert) {
  const sauber = (wert) => {
    const { geaendertAm, eigeneArt, ...rest } = wert;
    return JSON.stringify(rest);
  };
  return sauber(entwurf) !== sauber(ausgangswert);
}

/* --- Preis ---------------------------------------------------------------- */

/** Nur Ausgaben mit mehr als einem Teil sind Sammelkäufe. */
export function sammelkaeufe(ausgaben = []) {
  return ausgaben
    .filter((ausgabe) => (ausgabe.anzahlTeile ?? 1) > 1)
    .slice()
    .sort((a, b) => String(b.datum).localeCompare(String(a.datum)));
}

/** Preis für den Entwurf: null, Einzelpreis in Cent oder Sammelkauf. */
export function preisEinzeln(betragInCent, ausgabeId = null) {
  const preis = { art: PREIS_ART.EINZELN, betrag: betragInCent };
  if (ausgabeId) preis.ausgabeId = ausgabeId;
  return preis;
}

export function preisSammelkauf(ausgabeId) {
  return { art: PREIS_ART.SAMMELKAUF, ausgabeId };
}
