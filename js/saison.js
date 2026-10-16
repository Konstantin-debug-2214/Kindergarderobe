/**
 * saison.js – Soll-Mengen und Saisonwechsel-Check, reine Logik ohne DOM.
 *
 * Es geht nur um Kleidung: Spielzeug hat keine Jahreszeit und kein Soll.
 * Gezählt wird nach Stück, Aussortiertes bleibt außen vor.
 * Als "passend" gilt allein die Passform „Passt gut"; „Bald zu klein" zählt
 * zwar zu „ist da", aber nicht als passend, „Zu klein" nirgends.
 */

import { JAHRESZEITEN, KATEGORIEN, TYP, kleidungsKategorien } from './model.js';
import { imSchrank } from './filters.js';

/** Monat (1–12), in dem eine Jahreszeit beginnt. */
const BEGINN_MONAT = {
  fruehling: 3,
  sommer: 6,
  herbst: 9,
  winter: 12,
};

const MONATSNAMEN = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

const MS_PRO_TAG = 24 * 60 * 60 * 1000;

/* --- Jahreszeiten im Kalender --------------------------------------------- */

/** Die Jahreszeit, in der ein Datum liegt. */
export function laufendeJahreszeit(heute = new Date()) {
  const monat = heute.getMonth() + 1;
  return JAHRESZEITEN.find((j) => j.monate.includes(monat)).id;
}

/** Die Jahreszeit nach der laufenden – beim Öffnen vorausgewählt. */
export function kommendeJahreszeit(heute = new Date()) {
  const jetzt = laufendeJahreszeit(heute);
  const stelle = JAHRESZEITEN.findIndex((j) => j.id === jetzt);
  return JAHRESZEITEN[(stelle + 1) % JAHRESZEITEN.length].id;
}

/**
 * Der nächste Beginn einer Jahreszeit ab einem Datum.
 * @returns {Date} immer auf Mitternacht gesetzt
 */
export function naechsterBeginn(jahreszeitId, heute = new Date()) {
  const monat = BEGINN_MONAT[jahreszeitId];
  if (!monat) return null;

  const heuteOhneZeit = new Date(heute.getFullYear(), heute.getMonth(), heute.getDate());
  const diesesJahr = new Date(heute.getFullYear(), monat - 1, 1);

  return diesesJahr > heuteOhneZeit
    ? diesesJahr
    : new Date(heute.getFullYear() + 1, monat - 1, 1);
}

/** Ganze Tage von heute bis zu einem Datum. */
export function tageBis(datum, heute = new Date()) {
  const vonTag = Date.UTC(heute.getFullYear(), heute.getMonth(), heute.getDate());
  const bisTag = Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate());
  return Math.round((bisTag - vonTag) / MS_PRO_TAG);
}

/** "in 7 Wochen" bzw. unter zwei Wochen "in 9 Tagen". */
function abstandText(tage) {
  if (tage <= 0) return 'heute';
  if (tage === 1) return 'morgen';
  if (tage < 14) return `in ${tage} Tagen`;
  const wochen = Math.round(tage / 7);
  return wochen === 1 ? 'in 1 Woche' : `in ${wochen} Wochen`;
}

/** "noch 7 Wochen" bzw. unter zwei Wochen "noch 9 Tage". */
function restText(tage) {
  if (tage <= 0) return 'endet heute';
  if (tage === 1) return 'noch 1 Tag';
  if (tage < 14) return `noch ${tage} Tage`;
  const wochen = Math.round(tage / 7);
  return wochen === 1 ? 'noch 1 Woche' : `noch ${wochen} Wochen`;
}

/**
 * Zeile unter dem Check: "Winter · ab 1. Dezember · in 7 Wochen" bzw. für die
 * laufende Jahreszeit "Herbst · läuft · noch 7 Wochen".
 * @returns {{laufend: boolean, text: string, tage: number}}
 */
export function saisonHinweis(jahreszeitId, heute = new Date()) {
  const name = JAHRESZEITEN.find((j) => j.id === jahreszeitId)?.name ?? '';

  if (jahreszeitId === laufendeJahreszeit(heute)) {
    // Die laufende Jahreszeit endet, wenn die nächste beginnt.
    const naechste = kommendeJahreszeit(heute);
    const tage = tageBis(naechsterBeginn(naechste, heute), heute);
    return { laufend: true, tage, text: `${name} · läuft · ${restText(tage)}` };
  }

  const beginn = naechsterBeginn(jahreszeitId, heute);
  const tage = tageBis(beginn, heute);
  const datum = `ab 1. ${MONATSNAMEN[beginn.getMonth()]}`;
  return { laufend: false, tage, text: `${name} · ${datum} · ${abstandText(tage)}` };
}

/* --- Zählen je Art --------------------------------------------------------- */

/** Kleidung der Jahreszeit im Schrank. */
function kleidungDerJahreszeit(teile, jahreszeitId) {
  return imSchrank(teile).filter((teil) => teil.typ === TYP.KLEIDUNG
    && (teil.jahreszeiten ?? []).includes(jahreszeitId));
}

function stueckzahl(teile) {
  return teile.reduce((summe, teil) => summe + (Number(teil.anzahl) || 0), 0);
}

/**
 * Reihenfolge der Arten wie in model.js: erst nach Kategorie, dann nach der
 * Artenliste. Eigene Arten stehen dahinter.
 */
function artReihenfolge() {
  const reihenfolge = new Map();
  let nummer = 0;
  for (const kategorie of kleidungsKategorien()) {
    for (const art of kategorie.arten) {
      if (!reihenfolge.has(art)) reihenfolge.set(art, nummer);
      nummer += 1;
    }
  }
  return reihenfolge;
}

/** Alle Kleidungs-Arten aus model.js, nach Kategorie gruppiert. */
export function artenNachKategorie() {
  return kleidungsKategorien().map((kategorie) => ({
    kategorie: kategorie.name,
    arten: kategorie.arten,
  }));
}

/**
 * Die Zeilen der Soll-Mengen-Tabelle für eine Jahreszeit.
 *
 * Gezeigt wird jede Art, die ein Soll hat oder passende bzw. bald zu kleine
 * Teile in dieser Jahreszeit.
 *
 * @param {Array<Object>} teile
 * @param {Array<{art: string, jahreszeit: string, soll: number}>} sollMengen
 * @param {string} jahreszeitId
 * @returns {Array<{art: string, passend: number, baldZuKlein: number, soll: number|null,
 *   fehlt: number, stand: 'kein_soll'|'fehlt'|'vollstaendig'}>}
 */
export function sollZeilen(teile = [], sollMengen = [], jahreszeitId) {
  const derJahreszeit = kleidungDerJahreszeit(teile, jahreszeitId);

  const passendJeArt = new Map();
  const baldJeArt = new Map();

  for (const teil of derJahreszeit) {
    if (!teil.art) continue;
    const ziel = teil.passform === 'passt_gut' ? passendJeArt
      : (teil.passform === 'bald_zu_klein' ? baldJeArt : null);
    // "Zu klein" zählt nirgends mit.
    if (!ziel) continue;
    ziel.set(teil.art, (ziel.get(teil.art) ?? 0) + (Number(teil.anzahl) || 0));
  }

  const sollJeArt = new Map(
    sollMengen
      .filter((eintrag) => eintrag.jahreszeit === jahreszeitId && Number(eintrag.soll) > 0)
      .map((eintrag) => [eintrag.art, Math.round(Number(eintrag.soll))]),
  );

  const arten = new Set([...sollJeArt.keys(), ...passendJeArt.keys(), ...baldJeArt.keys()]);
  const reihenfolge = artReihenfolge();

  return [...arten]
    .map((art) => {
      const passend = passendJeArt.get(art) ?? 0;
      const soll = sollJeArt.get(art) ?? null;
      const fehlt = soll === null ? 0 : Math.max(0, soll - passend);

      return {
        art,
        passend,
        baldZuKlein: baldJeArt.get(art) ?? 0,
        soll,
        fehlt,
        stand: soll === null ? 'kein_soll' : (fehlt > 0 ? 'fehlt' : 'vollstaendig'),
      };
    })
    .sort((a, b) => {
      const links = reihenfolge.get(a.art);
      const rechts = reihenfolge.get(b.art);
      // Eigene Arten stehen hinter den bekannten, untereinander alphabetisch.
      if (links === undefined && rechts === undefined) return a.art.localeCompare(b.art, 'de');
      if (links === undefined) return 1;
      if (rechts === undefined) return -1;
      return links - rechts;
    });
}

/** Text zum Stand einer Zeile. */
export function standText(zeile) {
  if (zeile.stand === 'kein_soll') return 'kein Soll';
  if (zeile.stand === 'vollstaendig') return 'vollständig';
  return zeile.fehlt === 1 ? 'noch 1 fehlt' : `noch ${zeile.fehlt} fehlen`;
}

/* --- Check ----------------------------------------------------------------- */

/**
 * Die drei Summen des Saisonwechsel-Checks – nur über Arten mit Soll.
 * "ist da" = Passt gut + Bald zu klein, "passt" = Passt gut,
 * "fehlt" = Summe der Fehlenden.
 * @returns {{istDa: number, passt: number, fehlt: number}}
 */
export function checkSummen(zeilen = []) {
  const mitSoll = zeilen.filter((zeile) => zeile.soll !== null);

  return {
    istDa: mitSoll.reduce((summe, zeile) => summe + zeile.passend + zeile.baldZuKlein, 0),
    passt: mitSoll.reduce((summe, zeile) => summe + zeile.passend, 0),
    fehlt: mitSoll.reduce((summe, zeile) => summe + zeile.fehlt, 0),
  };
}

/** Was fehlt: Art und Anzahl, in der Reihenfolge der Tabelle. */
export function besorgen(zeilen = []) {
  return zeilen
    .filter((zeile) => zeile.fehlt > 0)
    .map((zeile) => ({ art: zeile.art, fehlt: zeile.fehlt }));
}

/**
 * Teile der Jahreszeit mit Passform „Bald zu klein" – unabhängig vom Soll.
 * @returns {Array<Object>} alphabetisch nach Name
 */
export function baldZuKleinTeile(teile = [], jahreszeitId) {
  return kleidungDerJahreszeit(teile, jahreszeitId)
    .filter((teil) => teil.passform === 'bald_zu_klein')
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'de'));
}

/**
 * Summe der Fehlenden einer Jahreszeit – für das Etikett in der Statistik.
 */
export function fehlendeGesamt(teile = [], sollMengen = [], jahreszeitId) {
  return checkSummen(sollZeilen(teile, sollMengen, jahreszeitId)).fehlt;
}

/** Arten, die in dieser Jahreszeit noch keine Zeile haben – für "+ Art". */
export function artenOhneZeile(zeilen = [], eigeneArten = []) {
  const vorhanden = new Set(zeilen.map((zeile) => zeile.art));

  const gruppen = artenNachKategorie()
    .map((gruppe) => ({
      kategorie: gruppe.kategorie,
      arten: gruppe.arten.filter((art) => !vorhanden.has(art)),
    }))
    .filter((gruppe) => gruppe.arten.length > 0);

  // Eigene Arten aus dem Bestand, die in keiner Kategorie-Liste stehen.
  const bekannt = new Set(KATEGORIEN.flatMap((kategorie) => kategorie.arten));
  const eigene = [...new Set(eigeneArten)]
    .filter((art) => art && !bekannt.has(art) && !vorhanden.has(art))
    .sort((a, b) => a.localeCompare(b, 'de'));

  if (eigene.length > 0) gruppen.push({ kategorie: 'Eigene Arten', arten: eigene });

  return gruppen;
}
