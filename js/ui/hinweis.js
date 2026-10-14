/**
 * hinweis.js – kurze Bestätigung nach einer Aktion, z. B. "[Name] aussortiert".
 *
 * Liegt über dem Screen und verschwindet von selbst. Im Design kommt das nicht
 * vor; Gestaltung im Stil der Erfolgs-Banner.
 */

import { el } from './dom.js';
import { icon } from './icons.js';

const DAUER = 3200;
let offenerHinweis = null;
let uhr = null;

/**
 * Zeigt eine kurze Bestätigung.
 * @param {string} text
 * @param {{art?: 'erfolg'|'hinweis'}} [optionen]
 */
export function zeigeHinweis(text, { art = 'erfolg' } = {}) {
  schliesseHinweis();

  // role="status" meldet den Text Vorlesehilfen, ohne den Fokus zu stehlen.
  offenerHinweis = el('div', { class: `kurzhinweis kurzhinweis--${art}`, role: 'status' }, [
    icon(art === 'erfolg' ? 'haken' : 'warnung', 20),
    el('span', { text }),
  ]);

  document.body.append(offenerHinweis);
  uhr = setTimeout(schliesseHinweis, DAUER);
}

/** Nimmt eine sichtbare Bestätigung sofort weg. */
export function schliesseHinweis() {
  if (uhr) clearTimeout(uhr);
  uhr = null;
  offenerHinweis?.remove();
  offenerHinweis = null;
}
