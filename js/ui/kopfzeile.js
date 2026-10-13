/**
 * kopfzeile.js – Kopfzeile eines Screens:
 * runder Zurück-Knopf (bzw. Schließen-Knopf), Titel, Unterzeile, Aktionen.
 */

import { el } from './dom.js';
import { iconKnopf } from './knoepfe.js';

/**
 * @param {{
 *   titel: string,
 *   unterzeile?: string,
 *   zurueckZu?: string,          Ziel-Route des Zurück-Knopfs (z. B. '#/')
 *   zurueckArt?: 'zurueck'|'schliessen',
 *   zurueckLabel?: string,
 *   zurueckKlasse?: string,      zusaetzliche Klasse, z. B. 'nur-tablet'
 *   aktionen?: Array<Node>
 * }} optionen
 */
export function kopfzeile({
  titel,
  unterzeile,
  zurueckZu,
  zurueckArt = 'zurueck',
  zurueckLabel,
  zurueckKlasse,
  aktionen = [],
}) {
  const kinder = [];

  if (zurueckZu) {
    const knopf = iconKnopf({
      label: zurueckLabel || (zurueckArt === 'schliessen' ? 'Schließen' : 'Zurück'),
      iconName: zurueckArt,
      href: zurueckZu,
    });
    if (zurueckKlasse) knopf.classList.add(zurueckKlasse);
    kinder.push(knopf);
  }

  kinder.push(
    el('div', { class: 'kopfzeile__titelblock' }, [
      el('h1', { class: 'kopfzeile__titel', text: titel }),
      unterzeile ? el('p', { class: 'kopfzeile__unterzeile', text: unterzeile }) : null,
    ]),
  );

  if (aktionen.length > 0) {
    kinder.push(el('div', { class: 'kopfzeile__aktionen' }, aktionen));
  }

  return el('header', { class: 'kopfzeile' }, kinder);
}
