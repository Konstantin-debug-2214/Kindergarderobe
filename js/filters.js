/**
 * filters.js – Zählen, Suchen, Filtern und Sortieren.
 *
 * Reine Funktionen ohne DOM-Zugriff. Gezählt wird immer nach Stück (Feld
 * `anzahl`), nie nach Einträgen; aussortierte Teile zählen nirgends mit
 * (siehe Zählregeln in CLAUDE.md).
 */

import {
  GROESSENSYSTEME,
  JAHRESZEITEN,
  KATEGORIEN,
  KATEGORIE_SPIELZEUG,
  TYP,
} from './model.js';

/* --- Grundlagen ----------------------------------------------------------- */

/** Nur die Teile im Schrank – ohne Aussortiertes. */
export function imSchrank(teile = []) {
  return teile.filter((teil) => !teil.aussortiert);
}

/** Summe der Stückzahlen. */
export function stueck(teile = []) {
  return teile.reduce((summe, teil) => summe + (Number(teil.anzahl) || 0), 0);
}

/** Einheit einer Kategorie: Schuhe werden in Paar gezählt. */
export function einheit(kategorieId, anzahl = 2) {
  if (kategorieId === 'schuhe') return 'Paar';
  return anzahl === 1 ? 'Teil' : 'Teile';
}

/** Dieselbe Einheit im Dativ: "8 von 24 Teilen", "2 von 3 Paar". */
export function einheitDativ(kategorieId) {
  return kategorieId === 'schuhe' ? 'Paar' : 'Teilen';
}

/* --- Zählen --------------------------------------------------------------- */

/**
 * Stückzahl je Kategorie, ohne Aussortiertes.
 * @returns {Object<string, number>} alle sechs Kategorien, auch mit 0
 */
export function zaehleJeKategorie(teile = []) {
  const zahlen = Object.fromEntries(KATEGORIEN.map((k) => [k.id, 0]));
  for (const teil of imSchrank(teile)) {
    if (zahlen[teil.kategorie] === undefined) continue;
    zahlen[teil.kategorie] += Number(teil.anzahl) || 0;
  }
  return zahlen;
}

/**
 * Stückzahl je Jahreszeit, ohne Aussortiertes und nur Kleidung.
 * Ein Teil zählt in jeder seiner Jahreszeiten mit.
 * @returns {Object<string, number>}
 */
export function zaehleJeJahreszeit(teile = []) {
  const zahlen = Object.fromEntries(JAHRESZEITEN.map((j) => [j.id, 0]));
  for (const teil of imSchrank(teile)) {
    if (teil.typ !== TYP.KLEIDUNG) continue;
    for (const id of teil.jahreszeiten ?? []) {
      if (zahlen[id] === undefined) continue;
      zahlen[id] += Number(teil.anzahl) || 0;
    }
  }
  return zahlen;
}

/* --- Größen --------------------------------------------------------------- */

/**
 * Passt eine Größe zu einem gesuchten Wert? Doppelgrößen und Spannen
 * (z. B. 98/104 oder 23–26) passen auf jede enthaltene Größe.
 */
export function groesseEnthaelt(groesse, wert) {
  if (!groesse || typeof wert !== 'number') return false;
  return groesse.von <= wert && wert <= groesse.bis;
}

/**
 * Alle Einzelgrößen, die in einer Größe stecken – entlang der Schritte des
 * Größensystems. 98/104 ergibt [98, 104], 23–26 ergibt [23, 24, 25, 26].
 */
export function enthalteneGroessen(groesse) {
  if (!groesse) return [];
  const schritt = GROESSENSYSTEME[groesse.system]?.schritt ?? 1;
  const werte = [];
  for (let wert = groesse.von; wert <= groesse.bis; wert += schritt) werte.push(wert);
  // Der obere Rand gehört dazu, auch wenn er nicht auf dem Raster liegt.
  if (werte.at(-1) !== groesse.bis) werte.push(groesse.bis);
  return werte;
}

/* --- Suche ---------------------------------------------------------------- */

/** Gesucht wird in Name, Art, Marke, Notiz und freien Merkmalen. */
export function passtZurSuche(teil, begriff) {
  const gesucht = String(begriff ?? '').trim().toLowerCase();
  if (gesucht === '') return true;

  const felder = [
    teil.name,
    teil.art,
    teil.marke,
    teil.notiz,
    ...(teil.tags ?? []),
  ];

  return felder.some((feld) => String(feld ?? '').toLowerCase().includes(gesucht));
}

/** Suche über alle Teile im Schrank. */
export function suche(teile = [], begriff) {
  return sortiereNachName(imSchrank(teile).filter((teil) => passtZurSuche(teil, begriff)));
}

/* --- Sortierung ----------------------------------------------------------- */

/** Alphabetisch nach Name, mit deutscher Sortierung (ä wie a). */
export function sortiereNachName(teile = []) {
  return [...teile].sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''), 'de'));
}

/* --- Filter --------------------------------------------------------------- */

/** Ein Filter ohne Auswahl – alle Teile sind sichtbar. */
export function leererFilter() {
  return {
    jahreszeiten: [],
    groessen: [],
    merkmale: [],
    marken: [],
    passformen: [],
    arten: [],
    alterAb: [],
  };
}

/** Ist in irgendeiner Gruppe etwas ausgewählt? */
export function filterAktiv(filter) {
  return anzahlFilter(filter) > 0;
}

/** Anzahl aller gesetzten Filterwerte – für den Knopf "Filter (n)". */
export function anzahlFilter(filter) {
  return Object.values(filter ?? {}).reduce((summe, werte) => summe + (werte?.length ?? 0), 0);
}

/**
 * Wendet die Filter an: innerhalb einer Gruppe ODER, zwischen Gruppen UND.
 * Eine Gruppe ohne Auswahl filtert nicht.
 */
export function wendeFilterAn(teile = [], filter = leererFilter()) {
  return teile.filter((teil) => teilPasstZuFilter(teil, filter));
}

export function teilPasstZuFilter(teil, filter = leererFilter()) {
  const { jahreszeiten, groessen, merkmale, marken, passformen, arten, alterAb } = {
    ...leererFilter(),
    ...filter,
  };

  if (jahreszeiten.length > 0) {
    const eigene = teil.jahreszeiten ?? [];
    if (!jahreszeiten.some((id) => eigene.includes(id))) return false;
  }

  if (groessen.length > 0) {
    if (!groessen.some((wert) => groesseEnthaelt(teil.groesse, wert))) return false;
  }

  if (merkmale.length > 0 && !merkmale.includes(teil.merkmal)) return false;

  if (marken.length > 0 && !marken.includes(teil.marke)) return false;

  if (passformen.length > 0 && !passformen.includes(teil.passform)) return false;

  if (arten.length > 0 && !arten.includes(teil.art)) return false;

  if (alterAb.length > 0 && !alterAb.includes(teil.alterAb ?? null)) return false;

  return true;
}

/**
 * Die Werte, die in den Teilen einer Kategorie tatsächlich vorkommen –
 * damit die Filterspalte nur zeigt, was es auch gibt.
 * @param {Array<Object>} teile Teile einer Kategorie (ohne Aussortiertes)
 * @returns {{groessen: Array<number>, arten: Array<string>, marken: Array<string>, alterAb: Array<number>, jahreszeiten: Array<string>}}
 */
export function vorhandeneFilterwerte(teile = []) {
  const groessen = new Set();
  const arten = new Set();
  const marken = new Set();
  const alterAb = new Set();
  const jahreszeiten = new Set();

  for (const teil of teile) {
    for (const wert of enthalteneGroessen(teil.groesse)) groessen.add(wert);
    if (teil.art) arten.add(teil.art);
    if (teil.merkmal === 'marke' && teil.marke) marken.add(teil.marke);
    if (Number.isInteger(teil.alterAb)) alterAb.add(teil.alterAb);
    for (const id of teil.jahreszeiten ?? []) jahreszeiten.add(id);
  }

  return {
    groessen: [...groessen].sort((a, b) => a - b),
    arten: [...arten].sort((a, b) => a.localeCompare(b, 'de')),
    marken: [...marken].sort((a, b) => a.localeCompare(b, 'de')),
    alterAb: [...alterAb].sort((a, b) => a - b),
    // In der Reihenfolge der Jahreszeiten, nicht alphabetisch.
    jahreszeiten: JAHRESZEITEN.map((j) => j.id).filter((id) => jahreszeiten.has(id)),
  };
}

/** Teile einer Kategorie, ohne Aussortiertes, alphabetisch. */
export function teileDerKategorie(teile = [], kategorieId) {
  return sortiereNachName(imSchrank(teile).filter((teil) => teil.kategorie === kategorieId));
}

/** Ist das die Spielzeug-Kategorie? Dort gelten andere Filter. */
export function istSpielzeugKategorie(kategorieId) {
  return kategorieId === KATEGORIE_SPIELZEUG;
}
