/**
 * banner.js – Hinweis-, Erfolgs- und Fehlermeldungen.
 *
 * Farben laut CLAUDE.md: Hinweis sandfarben, Erfolg grün. Für Fehler nutzen
 * wir dieselbe Hinweisfläche mit Warnsymbol – ein eigener Rotton ist im
 * Design nicht festgelegt.
 */

import { el } from './dom.js';
import { icon } from './icons.js';
import { iconKnopf } from './knoepfe.js';

const ICON_JE_ART = {
  hinweis: 'warnung',
  fehler: 'warnung',
  erfolg: 'haken',
};

/**
 * @param {{
 *   art?: 'hinweis'|'erfolg'|'fehler',
 *   text: string,
 *   zusatz?: string,
 *   aktionen?: Array<Node>,
 *   beiSchliessen?: () => void,
 *   rolle?: 'status'|'alert'
 * }} optionen
 */
export function banner({
  art = 'hinweis',
  text,
  zusatz,
  aktionen = [],
  beiSchliessen,
  rolle = 'status',
}) {
  const kinder = [
    icon(ICON_JE_ART[art] ?? 'warnung', 22),
    el('div', { class: 'banner__texte' }, [
      el('p', { class: 'banner__text', text }),
      zusatz ? el('p', { class: 'banner__zusatz', text: zusatz }) : null,
    ]),
  ];

  if (aktionen.length > 0) {
    kinder.push(el('div', { class: 'banner__aktionen' }, aktionen));
  }

  if (beiSchliessen) {
    const schliessen = iconKnopf({ label: 'Hinweis ausblenden', iconName: 'schliessen' });
    schliessen.classList.add('banner__schliessen');
    schliessen.addEventListener('click', beiSchliessen);
    kinder.push(schliessen);
  }

  return el(
    'div',
    { class: `banner banner--${art}`, role: rolle, 'aria-live': rolle === 'alert' ? 'assertive' : 'polite' },
    kinder,
  );
}
