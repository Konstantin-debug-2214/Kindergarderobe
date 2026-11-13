/**
 * ergebnisliste.js – Kartenliste, die Teile nach Art zusammenfasst.
 *
 * Gilt in der Trefferansicht der Übersicht, der Kategorie-Ansicht und
 * „Nach Jahreszeit“ (Auftrag 13). Über der Liste steht der Umschalter
 * „Zusammengefasst / Einzeln“ – nur, wenn es überhaupt mehr als eine Art
 * gibt; sonst wird ohnehin einzeln gezeigt.
 */

import { el } from './dom.js';
import { umschalter } from './formularteile.js';
import { gruppenKarte } from './kacheln.js';
import { sortiereNachName, zusammenfassen } from '../filters.js';

export const ANSICHT = { ZUSAMMENGEFASST: 'zusammengefasst', EINZELN: 'einzeln' };

/**
 * Welche Ansicht gilt? Ein Wert aus der Adresse hat Vorrang, sonst die
 * gemerkte Wahl.
 * @param {string|undefined|null} ausAdresse z. B. parameter.ansicht
 * @param {'zusammengefasst'|'einzeln'} gemerkt
 */
export function geltendeAnsicht(ausAdresse, gemerkt) {
  if (ausAdresse === ANSICHT.EINZELN || ausAdresse === ANSICHT.ZUSAMMENGEFASST) return ausAdresse;
  return gemerkt === ANSICHT.EINZELN ? ANSICHT.EINZELN : ANSICHT.ZUSAMMENGEFASST;
}

/**
 * @param {{
 *   teile: Array<Object>,
 *   ansicht: 'zusammengefasst'|'einzeln',
 *   beiAnsicht: (ansicht: string) => void,
 *   karte: (teil: Object) => Node,
 *   gruppenZiel: (gruppe: Object) => string,
 *   zeigeKategorie?: boolean,
 *   rasterKlasse?: string
 * }} optionen teile sind bereits gefiltert; karte baut die Einzelkarte der
 *   jeweiligen Ansicht; gruppenZiel liefert die Adresse für den Tipp auf eine
 *   Gruppe.
 */
export function ergebnisliste({
  teile,
  ansicht,
  beiAnsicht,
  karte,
  gruppenZiel,
  zeigeKategorie = false,
  rasterKlasse = 'kartenraster',
}) {
  const zusammen = zusammenfassen(teile);
  const einzeln = ansicht === ANSICHT.EINZELN || zusammen.einzeln;

  const karten = einzeln
    ? sortiereNachName(teile).map(karte)
    : zusammen.eintraege.map((eintrag) => (eintrag.gruppe
      ? gruppenKarte(eintrag.gruppe, { href: gruppenZiel(eintrag.gruppe), zeigeKategorie })
      : karte(eintrag.teil)));

  return el('div', { class: 'ergebnisliste' }, [
    zusammen.einzeln
      ? null
      : el('div', { class: 'ergebnisliste__steuerung' }, [
        umschalter({
          label: 'Ansicht',
          optionen: [
            { id: ANSICHT.ZUSAMMENGEFASST, name: 'Zusammengefasst' },
            { id: ANSICHT.EINZELN, name: 'Einzeln' },
          ],
          wert: einzeln ? ANSICHT.EINZELN : ANSICHT.ZUSAMMENGEFASST,
          beiWahl: beiAnsicht,
        }),
      ]),
    el('div', { class: rasterKlasse }, karten),
  ]);
}
