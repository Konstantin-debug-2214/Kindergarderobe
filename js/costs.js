/**
 * costs.js – Kostenberechnung, reine Logik ohne DOM.
 *
 * Alle Beträge sind ganze Zahlen in Cent (8,00 € = 800). Dadurch gibt es
 * keine Fließkomma-Fehler; erst formatEuro macht daraus einen Text.
 */

const EURO_FORMAT = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Summe aller Ausgaben eines Jahres, in Cent.
 * Gerechnet wird nur aus ausgaben – auch Ausgaben zu aussortierten Teilen
 * zählen weiter mit (siehe Zählregeln in CLAUDE.md).
 * @param {Array<{datum: string, betrag: number}>} ausgaben
 * @param {number} jahr
 * @returns {number} Betrag in Cent
 */
export function jahressumme(ausgaben = [], jahr) {
  return ausgaben
    .filter((ausgabe) => jahrVon(ausgabe.datum) === jahr)
    .reduce((summe, ausgabe) => summe + ganzeZahl(ausgabe.betrag), 0);
}

/**
 * Summe aller Ausgaben, in Cent.
 * @param {Array<{betrag: number}>} ausgaben
 */
export function gesamtsumme(ausgaben = []) {
  return ausgaben.reduce((summe, ausgabe) => summe + ganzeZahl(ausgabe.betrag), 0);
}

/**
 * Formatiert einen Betrag in Cent als deutschen Eurobetrag: 800 -> "8,00 €".
 * @param {number} betragInCent
 */
export function formatEuro(betragInCent) {
  return EURO_FORMAT.format(ganzeZahl(betragInCent) / 100);
}

/** "8", "8,5", "8.50", "1234,56" – Komma oder Punkt, höchstens zwei Stellen. */
const BETRAG_EINFACH = /^(\d+)(?:[.,](\d{1,2}))?$/;

/** "1.234" oder "1.234,56" – Punkte als Tausendertrenner, Komma vor den Cent. */
const BETRAG_TAUSENDER = /^(\d{1,3}(?:\.\d{3})+)(?:,(\d{1,2}))?$/;

/**
 * Wandelt eine Eingabe wie "8,50", "8.5" oder "1.234,56" in Cent um.
 * Gerechnet wird mit ganzen Zahlen, ohne Gleitkomma. Exoten wie "1e3" oder
 * "0x10" gelten nicht als Betrag.
 * @returns {number|null} Cent, oder null wenn die Eingabe kein Betrag ist
 */
export function euroTextInCent(text) {
  const sauber = String(text ?? '').replace(/\s/g, '');
  const treffer = sauber.match(BETRAG_EINFACH) ?? sauber.match(BETRAG_TAUSENDER);
  if (!treffer) return null;

  const euro = Number(treffer[1].replace(/\./g, ''));
  const cent = Number((treffer[2] ?? '').padEnd(2, '0'));
  return euro * 100 + cent;
}

/**
 * Datum als "JJJJ-MM-TT" in Ortszeit. Nicht toISOString(): Das rechnet in UTC
 * und lieferte kurz nach Mitternacht den Vortag – am 1.1. sogar das Vorjahr.
 * @param {Date} [datum]
 */
export function datumAlsText(datum = new Date()) {
  const monat = String(datum.getMonth() + 1).padStart(2, '0');
  const tag = String(datum.getDate()).padStart(2, '0');
  return `${datum.getFullYear()}-${monat}-${tag}`;
}

/** Das Jahr aus einem ISO-Datum ("2026-08-14" oder voller Zeitstempel). */
export function jahrVon(datum) {
  const anfang = String(datum ?? '').slice(0, 4);
  // Ohne die Ziffernprüfung würde Number('') zu 0 statt zu null führen.
  return /^\d{4}$/.test(anfang) ? Number(anfang) : null;
}

/** Schützt vor kaputten Werten aus einem Backup. */
function ganzeZahl(wert) {
  return Number.isFinite(wert) ? Math.round(wert) : 0;
}

/* --- Preistexte für Listen und Detail ------------------------------------- */

/**
 * Kurzer Preistext eines Teils: "8,00 €", "Sammelkauf" oder "kein Preis".
 * @param {Object} teil
 */
export function preisText(teil) {
  if (teil?.preis?.art === 'einzeln') return formatEuro(teil.preis.betrag);
  if (teil?.preis?.art === 'sammelkauf') return 'Sammelkauf';
  return 'kein Preis';
}

/**
 * Erklärung zum Sammelkauf: "Flohmarkt Kita · 25,00 € für 6 Teile".
 * @param {Object} teil
 * @param {Array<Object>} ausgaben
 * @returns {string|null} null, wenn es nichts zu erklären gibt
 */
export function preisHinweis(teil, ausgaben = []) {
  if (teil?.preis?.art !== 'sammelkauf') return null;
  const ausgabe = ausgaben.find((a) => a.id === teil.preis.ausgabeId);
  if (!ausgabe) return null;
  return `${ausgabe.bezeichnung} · ${formatEuro(ausgabe.betrag)} für ${anzahlTeileText(ausgabe.anzahlTeile)}`;
}

/* --- Zahlen für die Kosten-Ansicht ---------------------------------------- */

/**
 * Summe, Anzahl Teile und Durchschnitt eines Jahres.
 * Gezählt werden die `anzahlTeile` der Ausgaben, nicht die Teile im Schrank:
 * Kosten aussortierter oder gelöschter Teile bleiben erhalten (CLAUDE.md).
 * @param {Array<Object>} ausgaben
 * @param {number} jahr
 * @returns {{summe: number, teile: number, durchschnitt: number}} Beträge in Cent
 */
export function jahresZahlen(ausgaben = [], jahr) {
  const desJahres = ausgaben.filter((ausgabe) => jahrVon(ausgabe.datum) === jahr);
  const summe = desJahres.reduce((wert, ausgabe) => wert + ganzeZahl(ausgabe.betrag), 0);
  const teile = desJahres.reduce((wert, ausgabe) => wert + teilezahl(ausgabe), 0);

  return {
    summe,
    teile,
    // Kaufmännisch auf Cent gerundet; ohne Teile gibt es keinen Durchschnitt.
    durchschnitt: teile > 0 ? Math.round(summe / teile) : 0,
  };
}

/**
 * Preis je Teil eines Sammelkaufs, kaufmännisch auf Cent gerundet.
 * @param {{betrag: number, anzahlTeile?: number}} ausgabe
 * @returns {number} Betrag in Cent
 */
export function proTeil(ausgabe) {
  const teile = teilezahl(ausgabe);
  if (teile <= 0) return 0;
  return Math.round(ganzeZahl(ausgabe?.betrag) / teile);
}

/**
 * Alle Jahre mit Ausgaben, neuestes zuerst.
 * @param {Array<Object>} ausgaben
 * @returns {Array<number>}
 */
export function jahreMitAusgaben(ausgaben = []) {
  const jahre = new Set();
  for (const ausgabe of ausgaben) {
    const jahr = jahrVon(ausgabe.datum);
    if (jahr !== null) jahre.add(jahr);
  }
  return [...jahre].sort((a, b) => b - a);
}

/** Ein Eintrag ohne Angabe zählt als ein Teil. */
function teilezahl(ausgabe) {
  const wert = Number(ausgabe?.anzahlTeile);
  return Number.isFinite(wert) && wert > 0 ? Math.round(wert) : 1;
}

/** Ein Sammelkauf umfasst mehr als ein Teil. */
export function istSammelkauf(ausgabe) {
  return teilezahl(ausgabe) > 1;
}

/** "1 Teil", "6 Teile". */
export function anzahlTeileText(anzahl) {
  return anzahl === 1 ? '1 Teil' : `${anzahl} Teile`;
}

/**
 * Kleinste erlaubte Anzahl Teile beim Bearbeiten einer Ausgabe: Ein
 * Sammelkauf bleibt ein Sammelkauf (mindestens 2), und keine Ausgabe kann
 * weniger Teile haben, als ihr zugeordnet sind.
 * @param {Object} ausgabe
 * @param {number} anzahlZugeordnet Teile, deren Preis an der Ausgabe hängt
 */
export function mindestTeile(ausgabe, anzahlZugeordnet = 0) {
  return Math.max(istSammelkauf(ausgabe) ? 2 : 1, anzahlZugeordnet);
}
