/**
 * diagramme.js – Balken für die Statistik, selbst gebaut aus HTML und CSS.
 * Keine Bibliothek.
 *
 * Jede Zeile bzw. Säule ist ein echter Link, damit ein Tipp zu den Teilen
 * führt und die Tastatur ebenso funktioniert.
 */

import { el } from './dom.js';
import { icon } from './icons.js';

/**
 * Waagerechte Balken: Beschriftung links, Balken in der Mitte, Zahl rechts.
 * Die Länge richtet sich nach dem größten Wert der Karte.
 *
 * @param {{
 *   eintraege: Array<{name: string, anzahl: number, ziel?: string, iconName?: string}>,
 *   leerText?: string
 * }} optionen
 */
export function balkenListe({ eintraege, leerText = 'Noch nichts einzutragen.' }) {
  if (eintraege.length === 0) {
    return el('p', { class: 'diagramm__leer', text: leerText });
  }

  const groesster = Math.max(...eintraege.map((e) => e.anzahl), 1);

  return el(
    'div',
    { class: 'balken' },
    eintraege.map((eintrag) => {
      const anteil = Math.round((eintrag.anzahl / groesster) * 100);

      const inhalt = [
        el('span', { class: 'balken__label' }, [
          eintrag.iconName ? icon(eintrag.iconName, 18) : null,
          el('span', { text: eintrag.name }),
        ]),
        el('span', { class: 'balken__spur' }, [
          // Ein Balken mit 0 bleibt als dünner Strich sichtbar.
          el('span', { class: 'balken__wert', style: `width: ${Math.max(anteil, 2)}%` }),
        ]),
        el('span', { class: 'balken__zahl', text: String(eintrag.anzahl) }),
      ];

      const beschriftung = `${eintrag.name}: ${eintrag.anzahl} Stück`;

      return eintrag.ziel
        ? el('a', { class: 'balken__zeile', href: eintrag.ziel, 'aria-label': beschriftung }, inhalt)
        : el('div', { class: 'balken__zeile', 'aria-label': beschriftung }, inhalt);
    }),
  );
}

/**
 * Senkrechte Säulen mit der Zahl darüber und der Beschriftung darunter.
 * @param {{
 *   eintraege: Array<{name: string, anzahl: number, ziel?: string}>,
 *   leerText?: string
 * }} optionen
 */
export function saeulenDiagramm({ eintraege, leerText = 'Noch nichts einzutragen.' }) {
  if (eintraege.length === 0) {
    return el('p', { class: 'diagramm__leer', text: leerText });
  }

  const groesster = Math.max(...eintraege.map((e) => e.anzahl), 1);

  return el(
    'div',
    { class: 'saeulen' },
    eintraege.map((eintrag) => {
      const anteil = Math.round((eintrag.anzahl / groesster) * 100);
      const beschriftung = `Größe ${eintrag.name}: ${eintrag.anzahl} Stück`;

      const inhalt = [
        el('span', { class: 'saeulen__zahl', text: String(eintrag.anzahl) }),
        el('span', { class: 'saeulen__spur' }, [
          el('span', { class: 'saeulen__wert', style: `height: ${Math.max(anteil, 3)}%` }),
        ]),
        el('span', { class: 'saeulen__label', text: eintrag.name }),
      ];

      return eintrag.ziel
        ? el('a', { class: 'saeulen__saeule', href: eintrag.ziel, 'aria-label': beschriftung }, inhalt)
        : el('div', { class: 'saeulen__saeule', 'aria-label': beschriftung }, inhalt);
    }),
  );
}

/**
 * Karte eines Diagramms mit Titel, Zusatz und optionalem Hinweis darunter.
 * @param {{titel: string, zusatz?: string, inhalt: Node, hinweis?: string}} optionen
 */
export function diagrammKarte({ titel, zusatz, inhalt, hinweis }) {
  return el('section', { class: 'karte diagramm' }, [
    el('h2', { class: 'diagramm__titel' }, [
      titel,
      zusatz ? el('span', { class: 'diagramm__zusatz', text: ` ${zusatz}` }) : null,
    ]),
    inhalt,
    hinweis ? el('p', { class: 'diagramm__hinweis', text: hinweis }) : null,
  ]);
}
