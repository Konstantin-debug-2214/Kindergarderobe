/**
 * leiste.js – untere Leiste für das Smartphone.
 * Start · Statistik · + · Aussortiert · Mehr
 *
 * Die Leiste erscheint nur auf den Screens in LEISTE_SCREENS. Auf dem Tablet
 * blendet das CSS sie generell aus; dort führen die Kopf-Knöpfe zum Ziel.
 */

import { el, leeren } from './dom.js';
import { icon } from './icons.js';

/** Screens, auf denen die untere Leiste erscheint. */
export const LEISTE_SCREENS = new Set([
  'uebersicht',
  'statistik',
  'aussortiert',
  'einstellungen',
]);

/** Einträge der Leiste in Anzeigereihenfolge. */
const EINTRAEGE = [
  { screen: 'uebersicht', href: '#/', text: 'Start', iconName: 'start' },
  { screen: 'statistik', href: '#/statistik', text: 'Statistik', iconName: 'statistik' },
  { screen: 'neu', href: '#/neu', text: 'Teil hinzufügen', iconName: 'plus', gross: true },
  { screen: 'aussortiert', href: '#/aussortiert', text: 'Aussortiert', iconName: 'aussortiert' },
  { screen: 'einstellungen', href: '#/einstellungen', text: 'Mehr', iconName: 'einstellungen' },
];

/** Baut die Leiste einmalig in den übergebenen Knoten. */
export function baueLeiste(knoten) {
  leeren(knoten);

  for (const eintrag of EINTRAEGE) {
    if (eintrag.gross) {
      knoten.append(
        el(
          'a',
          {
            class: 'leiste__plus',
            href: eintrag.href,
            'aria-label': eintrag.text,
            title: eintrag.text,
            'data-screen': eintrag.screen,
          },
          icon('plus', 26),
        ),
      );
      continue;
    }

    knoten.append(
      el('a', { class: 'leiste__eintrag', href: eintrag.href, 'data-screen': eintrag.screen }, [
        icon(eintrag.iconName, 22),
        el('span', { text: eintrag.text }),
      ]),
    );
  }
}

/**
 * Zeigt oder verbirgt die Leiste und hebt den aktiven Eintrag hervor.
 * @param {HTMLElement} knoten
 * @param {string} screen Name des aktuellen Screens
 */
export function aktualisiereLeiste(knoten, screen) {
  const sichtbar = LEISTE_SCREENS.has(screen);
  knoten.hidden = !sichtbar;

  for (const eintrag of knoten.querySelectorAll('[data-screen]')) {
    if (sichtbar && eintrag.dataset.screen === screen) {
      eintrag.setAttribute('aria-current', 'page');
    } else {
      eintrag.removeAttribute('aria-current');
    }
  }
}
