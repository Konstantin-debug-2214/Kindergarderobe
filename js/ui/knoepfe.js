/**
 * knoepfe.js – Knöpfe und Icon-Knöpfe.
 * Navigation läuft über echte <a href="#/..."> Links, damit sie sich wie
 * Links verhalten (neuer Tab, Vor/Zurück). Aktionen nutzen echte <button>.
 */

import { el } from './dom.js';
import { icon } from './icons.js';
import { ersetzeRoute, zurueck } from '../router.js';

/**
 * Knopf mit Text, optional mit Icon davor.
 * @param {{ text: string, href?: string, iconName?: string, variante?: 'primaer'|'leise' }} optionen
 */
export function knopf({ text, href, iconName, variante = 'leise' }) {
  const klassen = ['knopf', variante === 'primaer' ? 'knopf--primaer' : null]
    .filter(Boolean)
    .join(' ');

  const kinder = [iconName ? icon(iconName, 20) : null, el('span', { text })];

  return href
    ? el('a', { class: klassen, href }, kinder)
    : el('button', { class: klassen, type: 'button' }, kinder);
}

/**
 * Runder Knopf, der nur ein Icon zeigt. Braucht immer ein Label.
 * @param {{ label: string, iconName: string, href?: string, variante?: 'primaer'|'leise' }} optionen
 */
export function iconKnopf({ label, iconName, href, variante = 'leise' }) {
  const klassen = ['icon-knopf', variante === 'primaer' ? 'icon-knopf--primaer' : null]
    .filter(Boolean)
    .join(' ');

  const attribute = { class: klassen, 'aria-label': label, title: label };

  return href
    ? el('a', { ...attribute, href }, icon(iconName))
    : el('button', { ...attribute, type: 'button' }, icon(iconName));
}

/**
 * Runder Zurück-Knopf. Er verhält sich wie die Zurück-Geste: zur vorherigen
 * Seite. Gibt es in der App keine (Einstieg über Startbildschirm oder Link),
 * führt er zur logischen Elternseite – nie aus der App heraus.
 * @param {{ elternZiel: string, label?: string }} optionen
 */
export function zurueckKnopf({ elternZiel, label = 'Zurück' }) {
  const knopfEl = iconKnopf({ label, iconName: 'zurueck' });
  knopfEl.addEventListener('click', () => zurueck(elternZiel));
  return knopfEl;
}

/**
 * Lässt einen Link die aktuelle Seite ersetzen statt einen Verlaufseintrag
 * anzuhängen – etwa beim Blättern, damit „Zurück“ zur Liste führt und nicht
 * Teil für Teil rückwärts. Ohne href (deaktiviert) passiert nichts.
 * @param {HTMLAnchorElement} link
 */
export function ersetztBeimKlick(link) {
  link.addEventListener('click', (ereignis) => {
    const ziel = link.getAttribute('href');
    if (!ziel) return;
    ereignis.preventDefault();
    ersetzeRoute(ziel);
  });
  return link;
}

/**
 * Suchfeld. Meldet jede Eingabe sofort, damit die Treffer mitlaufen.
 * @param {{
 *   label: string, platzhalter?: string, klasse?: string, wert?: string,
 *   beiEingabe?: (wert: string) => void
 * }} optionen
 */
export function suchfeld({ platzhalter, label, klasse, wert = '', beiEingabe }) {
  const feldId = `suche-${Math.random().toString(36).slice(2, 8)}`;

  const eingabe = el('input', {
    id: feldId,
    type: 'search',
    placeholder: platzhalter,
    autocomplete: 'off',
  });
  eingabe.value = wert;

  if (beiEingabe) {
    eingabe.addEventListener('input', () => beiEingabe(eingabe.value));
    // Das "×" eines Suchfeldes löst in manchen Browsern nur "search" aus.
    eingabe.addEventListener('search', () => beiEingabe(eingabe.value));
  }

  return el('div', { class: ['suchfeld', klasse].filter(Boolean).join(' ') }, [
    icon('suche', 20),
    el('label', { class: 'nur-vorlesehilfe', for: feldId, text: label }),
    eingabe,
  ]);
}
