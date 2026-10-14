/**
 * formularteile.js – Bausteine für das Formular "Teil hinzufügen".
 *
 * Alle Bausteine melden Änderungen über Rückrufe. Sie halten keinen eigenen
 * Zustand; der liegt im Entwurf des Screens.
 */

import { el } from './dom.js';
import { icon } from './icons.js';

/**
 * Abschnitt mit Beschriftung, Inhalt und Platz für eine Fehlermeldung.
 * @param {{
 *   label: string, hinweis?: string, inhalt: Array<Node>,
 *   feld?: string, fehler?: string
 * }} optionen
 */
export function abschnitt({ label, hinweis, inhalt, feld, fehler }) {
  return el('div', { class: 'abschnitt', 'data-feld': feld }, [
    el('p', { class: 'abschnitt__label' }, [
      label,
      hinweis ? el('span', { class: 'abschnitt__hinweis', text: ` ${hinweis}` }) : null,
    ]),
    ...inhalt,
    fehler ? el('p', { class: 'feldfehler', role: 'alert', text: fehler }) : null,
  ]);
}

/**
 * Gruppe runder Knöpfe zur Auswahl. Einfach- oder Mehrfachauswahl.
 * Umgesetzt als echte Knöpfe mit aria-pressed, damit Vorlesehilfen den
 * Zustand kennen.
 *
 * @param {{
 *   optionen: Array<{id: string|number, name: string, iconName?: string}>,
 *   wert: string|number|Array<string|number>|null,
 *   mehrfach?: boolean,
 *   beiWahl: (id: string|number) => void,
 *   klasse?: string
 * }} optionen
 */
export function wahlknoepfe({ optionen, wert, mehrfach = false, beiWahl, klasse }) {
  const gewaehlt = mehrfach ? new Set(wert ?? []) : new Set(wert === null || wert === undefined ? [] : [wert]);

  return el(
    'div',
    { class: ['wahl', klasse].filter(Boolean).join(' '), role: mehrfach ? 'group' : 'radiogroup' },
    optionen.map((option) => {
      const aktiv = gewaehlt.has(option.id);
      const knopf = el(
        'button',
        {
          type: 'button',
          class: `wahl__knopf${aktiv ? ' wahl__knopf--aktiv' : ''}`,
          'aria-pressed': String(aktiv),
          'data-wert': String(option.id),
        },
        [
          option.iconName ? icon(option.iconName, 18) : null,
          el('span', { text: option.name }),
        ],
      );
      knopf.addEventListener('click', () => beiWahl(option.id));
      return knopf;
    }),
  );
}

/**
 * Umschalter mit zwei oder drei Feldern nebeneinander (z. B. Kleidung /
 * Spielzeug oder Einzelpreis / Sammelkauf).
 * @param {{
 *   optionen: Array<{id: string, name: string, iconName?: string}>,
 *   wert: string,
 *   beiWahl: (id: string) => void,
 *   gesperrt?: boolean,
 *   label?: string
 * }} optionen
 */
export function umschalter({ optionen, wert, beiWahl, gesperrt = false, label }) {
  return el(
    'div',
    {
      class: `umschalter${gesperrt ? ' umschalter--gesperrt' : ''}`,
      role: 'radiogroup',
      'aria-label': label,
    },
    optionen.map((option) => {
      const aktiv = option.id === wert;
      const knopf = el(
        'button',
        {
          type: 'button',
          class: `umschalter__feld${aktiv ? ' umschalter__feld--aktiv' : ''}`,
          'aria-pressed': String(aktiv),
          disabled: gesperrt && !aktiv,
        },
        [
          option.iconName ? icon(option.iconName, 18) : null,
          el('span', { text: option.name }),
        ],
      );
      if (!gesperrt) knopf.addEventListener('click', () => beiWahl(option.id));
      return knopf;
    }),
  );
}

/**
 * Zähler mit − und +, gestaltet wie "Anzahl Teile" in der Kosten-Ansicht.
 * @param {{wert: number, min?: number, max?: number, label: string, beiAenderung: (wert: number) => void}} optionen
 */
export function zaehler({ wert, min = 1, max = 999, label, beiAenderung }) {
  const anzeige = el('span', { class: 'zaehler__wert', 'aria-live': 'polite', text: String(wert) });

  function knopf(zeichen, schritt, knopfLabel) {
    const k = el('button', {
      type: 'button',
      class: 'zaehler__knopf',
      'aria-label': knopfLabel,
      disabled: schritt < 0 ? wert <= min : wert >= max,
    }, [icon(zeichen, 20)]);
    k.addEventListener('click', () => beiAenderung(Math.min(max, Math.max(min, wert + schritt))));
    return k;
  }

  return el('div', { class: 'zaehler', role: 'group', 'aria-label': label }, [
    knopf('minus', -1, `${label} verringern`),
    anzeige,
    knopf('plus', +1, `${label} erhöhen`),
  ]);
}

/**
 * Farbtupfer zur Auswahl. Die Farbe beschreibt nur das Teil und färbt
 * nichts in der Oberfläche (siehe Farbregel in CLAUDE.md).
 * @param {{farben: Array<string>, wert: string|null, beiWahl: (farbe: string|null) => void}} optionen
 */
export function farbwahl({ farben, wert, beiWahl }) {
  return el(
    'div',
    { class: 'farbwahl', role: 'radiogroup', 'aria-label': 'Farbe' },
    farben.map((farbe) => {
      const aktiv = farbe === wert;
      const knopf = el('button', {
        type: 'button',
        class: `farbwahl__tupfer farbwahl__tupfer--${farbeSchluessel(farbe)}${aktiv ? ' farbwahl__tupfer--aktiv' : ''}`,
        'aria-pressed': String(aktiv),
        'aria-label': farbe,
        title: farbe,
      });
      // Nochmal antippen hebt die Auswahl auf – die Farbe ist freiwillig.
      knopf.addEventListener('click', () => beiWahl(aktiv ? null : farbe));
      return knopf;
    }),
  );
}

/** Aus "grün" wird "gruen", damit es als CSS-Klasse taugt. */
export function farbeSchluessel(farbe) {
  return String(farbe)
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
}

/**
 * Mehrzeiliges Textfeld.
 * @param {{label: string, wert: string, platzhalter?: string, beiEingabe: (wert: string) => void}} optionen
 */
export function textbereich({ label, wert, platzhalter, beiEingabe, hinweis }) {
  const id = `notiz-${Math.random().toString(36).slice(2, 8)}`;
  const feld = el('textarea', {
    id,
    class: 'textbereich',
    rows: '3',
    placeholder: platzhalter,
  });
  feld.value = wert ?? '';
  feld.addEventListener('input', () => beiEingabe(feld.value));

  return el('div', { class: 'abschnitt' }, [
    el('label', { class: 'abschnitt__label', for: id }, [
      label,
      hinweis ? el('span', { class: 'abschnitt__hinweis', text: ` ${hinweis}` }) : null,
    ]),
    feld,
  ]);
}

/**
 * Betragsfeld mit Euro-Zeichen am Ende, wie im Design.
 * @param {{wert: string, beiEingabe: (wert: string) => void, label: string}} optionen
 */
export function euroFeld({ wert, beiEingabe, label, id = `betrag-${Math.random().toString(36).slice(2, 8)}` }) {
  const feld = el('input', {
    id,
    class: 'eurofeld__eingabe',
    type: 'text',
    inputmode: 'decimal',
    placeholder: '0,00',
    'aria-label': label,
  });
  feld.value = wert ?? '';
  feld.addEventListener('input', () => beiEingabe(feld.value));

  return el('div', { class: 'eurofeld' }, [feld, el('span', { class: 'eurofeld__zeichen', text: '€' })]);
}

/**
 * Chips mit Entfernen-Knopf – für die freien Merkmale beim Spielzeug.
 * @param {{werte: Array<string>, beiEntfernen: (wert: string) => void}} optionen
 */
export function chips({ werte, beiEntfernen }) {
  return el(
    'div',
    { class: 'chips' },
    werte.map((wert) => {
      const entfernen = el('button', {
        type: 'button',
        class: 'chip__entfernen',
        'aria-label': `${wert} entfernen`,
      }, [icon('schliessen', 16)]);
      entfernen.addEventListener('click', () => beiEntfernen(wert));
      return el('span', { class: 'chip' }, [el('span', { text: wert }), entfernen]);
    }),
  );
}
