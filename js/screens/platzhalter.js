/**
 * platzhalter.js – gemeinsamer Aufbau für die Platzhalter-Screens.
 *
 * Dieses Modul verschwindet, sobald alle Screens ihren echten Inhalt haben.
 * Bis dahin zeigt jeder Screen Titel, Kopfzeile und – falls vorhanden – die
 * Werte aus der Adresse, damit der Router prüfbar ist.
 */

import { el } from '../ui/dom.js';
import { kopfzeile } from '../ui/kopfzeile.js';

/**
 * @param {{
 *   titel: string,
 *   unterzeile?: string,
 *   zurueckZu?: string,
 *   zurueckArt?: 'zurueck'|'schliessen',
 *   zurueckKlasse?: string,
 *   aktionen?: Array<Node>,
 *   beschreibung: string,
 *   werte?: Array<{ name: string, wert: string }>,
 *   weiteres?: Array<Node>
 * }} optionen
 * @returns {HTMLElement}
 */
export function platzhalterScreen({
  titel,
  unterzeile,
  zurueckZu,
  zurueckArt,
  zurueckKlasse,
  aktionen = [],
  beschreibung,
  werte = [],
  weiteres = [],
}) {
  const karteInhalt = [
    el('p', { class: 'platzhalter__marke', text: 'Platzhalter' }),
    el('p', { class: 'platzhalter__hinweis', text: beschreibung }),
  ];

  if (werte.length > 0) {
    karteInhalt.push(
      el(
        'div',
        { class: 'platzhalter__werte' },
        werte.map((eintrag) =>
          el('span', { class: 'platzhalter__wert', text: `${eintrag.name}: ${eintrag.wert}` }),
        ),
      ),
    );
  }

  return el('div', { class: 'inhalt' }, [
    kopfzeile({ titel, unterzeile, zurueckZu, zurueckArt, zurueckKlasse, aktionen }),
    el('section', { class: 'karte platzhalter' }, karteInhalt),
    ...weiteres,
  ]);
}

/**
 * Eine Liste von Testlinks. Sie machen Routen erreichbar, für die es noch
 * keine echten Kacheln oder Listen gibt, und fallen in späteren Aufträgen weg.
 * @param {string} titel
 * @param {Array<Node>} links
 */
export function testlinks(titel, links) {
  return el('section', { class: 'testlinks' }, [
    el('h2', { class: 'testlinks__titel', text: titel }),
    el('div', { class: 'testlinks__liste' }, links),
  ]);
}
