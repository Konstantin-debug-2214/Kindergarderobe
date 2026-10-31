/**
 * kopfzeile.js – Kopfzeile eines Screens:
 * runder Zurück-Knopf (bzw. Schließen-Knopf), Titel, Unterzeile, Aktionen.
 */

import { el } from './dom.js';
import { iconKnopf, zurueckKnopf } from './knoepfe.js';

/**
 * @param {{
 *   titel: string,
 *   unterzeile?: string,
 *   zurueckZu?: string,          Elternseite, falls es keine vorherige Seite gibt (z. B. '#/')
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
    // "Zurück" geht zur vorherigen Seite (zurueckZu ist dann die Elternseite
    // für den Einstieg ohne Vorgänger); "Schließen" bleibt ein fester Link.
    const knopf = zurueckArt === 'zurueck'
      ? zurueckKnopf({ elternZiel: zurueckZu, label: zurueckLabel || 'Zurück' })
      : iconKnopf({ label: zurueckLabel || 'Schließen', iconName: zurueckArt, href: zurueckZu });
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
