/**
 * felder.js – Eingabefelder und Karten mit Überschrift.
 * Jedes Feld hat ein echtes <label>, das mit dem Feld verbunden ist.
 */

import { el } from './dom.js';
import { icon } from './icons.js';

let laufendeNummer = 0;

/** Eindeutige id für die Verbindung von label und Feld. */
function feldId(praefix) {
  laufendeNummer += 1;
  return `${praefix}-${laufendeNummer}`;
}

/**
 * Karte mit Überschrift.
 * @param {{titel: string, inhalt: Array<Node>, klasse?: string}} optionen
 */
export function karte({ titel, inhalt, klasse }) {
  return el('section', { class: ['karte', klasse].filter(Boolean).join(' ') }, [
    titel ? el('h2', { class: 'karte__titel', text: titel }) : null,
    ...inhalt,
  ]);
}

/**
 * Textfeld mit Beschriftung darüber.
 * @param {{
 *   label: string, wert?: string, platzhalter?: string,
 *   beiEingabe?: (wert: string, feld: HTMLInputElement) => void,
 *   beiAenderung?: (wert: string, feld: HTMLInputElement) => void,
 *   beschreibung?: string
 * }} optionen
 */
export function textfeld({
  label,
  wert = '',
  platzhalter = '',
  beiEingabe,
  beiAenderung,
  beschreibung,
}) {
  const id = feldId('feld');
  const eingabe = el('input', {
    id,
    type: 'text',
    class: 'feld__eingabe',
    value: wert,
    placeholder: platzhalter,
    autocomplete: 'off',
  });

  if (beiEingabe) {
    eingabe.addEventListener('input', () => beiEingabe(eingabe.value, eingabe));
  }
  if (beiAenderung) {
    // "change" löst beim Verlassen des Feldes oder mit der Eingabetaste aus.
    eingabe.addEventListener('change', () => beiAenderung(eingabe.value.trim(), eingabe));
  }

  return el('div', { class: 'feld' }, [
    el('label', { class: 'feld__label', for: id, text: label }),
    eingabe,
    beschreibung ? el('p', { class: 'feld__beschreibung', text: beschreibung }) : null,
  ]);
}

/**
 * Kasten, der einen Wert nur anzeigt – z. B. die Vorschau der Begrüßung.
 * @param {{label: string, wert: string}} optionen
 * @returns {{element: HTMLElement, setzeWert: (wert: string) => void}}
 */
export function anzeigeKasten({ label, wert }) {
  const text = el('p', { class: 'anzeige__wert', text: wert });
  const element = el('div', { class: 'anzeige' }, [
    el('p', { class: 'anzeige__label', text: label }),
    text,
  ]);

  return {
    element,
    setzeWert(neu) { text.textContent = neu; },
  };
}

/**
 * Großer Knopf mit Titel und erklärender zweiter Zeile (wie im Design).
 * @param {{
 *   titel: string, hinweis?: string, iconName?: string,
 *   variante?: 'primaer'|'leise', beiKlick: () => void
 * }} optionen
 */
export function grosserKnopf({ titel, hinweis, iconName, variante = 'leise', beiKlick }) {
  const knopf = el(
    'button',
    {
      type: 'button',
      class: ['knopf-gross', variante === 'primaer' ? 'knopf-gross--primaer' : null]
        .filter(Boolean).join(' '),
    },
    [
      iconName ? icon(iconName, 22) : null,
      el('span', { class: 'knopf-gross__texte' }, [
        el('span', { class: 'knopf-gross__titel', text: titel }),
        hinweis ? el('span', { class: 'knopf-gross__hinweis', text: hinweis }) : null,
      ]),
    ],
  );

  knopf.addEventListener('click', beiKlick);
  return knopf;
}

/**
 * Zeile einer Liste zum Antippen – z. B. "Kosten … 78,50 €" auf dem Smartphone.
 * @param {{text: string, wert?: string, href: string, iconName?: string}} optionen
 */
export function listenZeile({ text, wert, href, iconName }) {
  return el('a', { class: 'listenzeile', href }, [
    iconName ? icon(iconName, 22) : null,
    el('span', { class: 'listenzeile__text', text }),
    wert ? el('span', { class: 'listenzeile__wert', text: wert }) : null,
  ]);
}
