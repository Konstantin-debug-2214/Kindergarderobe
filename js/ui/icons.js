/**
 * icons.js – Strich-Icons als Inline-SVG.
 * Keine Icon-Fonts, keine Emojis. Alle Icons liegen auf 24 x 24.
 * Icons sind rein dekorativ (aria-hidden); die Bedeutung steht im aria-label
 * des umgebenden Knopfes oder im sichtbaren Text.
 */

const NS = 'http://www.w3.org/2000/svg';

/** Pfade je Icon. Jeder Eintrag ist eine Liste von "d"-Werten. */
const PFADE = {
  suche: ['M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0', 'M16.2 16.2 21 21'],
  euro: ['M18 7.5a6.5 6.5 0 1 0 0 9', 'M4 10.5h9', 'M4 13.5h9'],
  statistik: ['M3.5 20h17', 'M6.5 20v-5.5', 'M12 20V7', 'M17.5 20v-8.5'],
  aussortiert: [
    'M3.5 4.5h17v4h-17z',
    'M5.5 8.5v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-10',
    'M10 12.5h4',
  ],
  einstellungen: [
    'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    'M12 3v2.4', 'M12 18.6V21', 'M3 12h2.4', 'M18.6 12H21',
    'M5.6 5.6l1.7 1.7', 'M16.7 16.7l1.7 1.7',
    'M18.4 5.6l-1.7 1.7', 'M7.3 16.7l-1.7 1.7',
  ],
  start: ['M3.5 11 12 4l8.5 7', 'M5.6 9.8V20h12.8V9.8', 'M10 20v-5h4v5'],
  plus: ['M12 5v14', 'M5 12h14'],
  zurueck: ['M14.5 5 7.5 12l7 7'],
  schliessen: ['M6.5 6.5l11 11', 'M17.5 6.5l-11 11'],
  liste: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  warnung: ['M12 4.5 2.8 20h18.4z', 'M12 10v4.4', 'M12 17.2v.2'],
  'pfeil-rechts': ['M9.5 5l7 7-7 7'],
  haken: ['M5 12.4 9.9 17.3 19 7.2'],
  // Teilen bzw. Exportieren: Pfeil aus der Ablage heraus
  export: [
    'M12 3.2v10.3', 'M8.4 6.8 12 3.2l3.6 3.6',
    'M4.6 14.2v4.3a1.5 1.5 0 0 0 1.5 1.5h11.8a1.5 1.5 0 0 0 1.5-1.5v-4.3',
  ],
  // Einspielen: Pfeil in die Ablage hinein
  import: [
    'M12 13.5V3.2', 'M8.4 9.9 12 13.5l3.6-3.6',
    'M4.6 14.2v4.3a1.5 1.5 0 0 0 1.5 1.5h11.8a1.5 1.5 0 0 0 1.5-1.5v-4.3',
  ],
  minus: ['M5 12h14'],
  filter: ['M4 6.5h16', 'M7 12h10', 'M10 17.5h4'],
  papierkorb: [
    'M4.5 6.8h15', 'M9.5 6.8V4.6h5v2.2',
    'M6.6 6.8l.8 12.1a1.4 1.4 0 0 0 1.4 1.3h6.4a1.4 1.4 0 0 0 1.4-1.3l.8-12.1',
    'M10.4 10.4v6', 'M13.6 10.4v6',
  ],
  // Pfeil im Kreis zurück – für "Zurückholen"
  zurueckholen: ['M4.6 5.4v4.8h4.8', 'M4.9 10.2a7.6 7.6 0 1 1 1 7.5'],
  stift: ['M4.5 19.5h4L19 9a2.1 2.1 0 0 0-3-3L5.5 16.5z', 'M14.5 7.5l2 2'],

  // --- Jahreszeiten ---
  fruehling: [
    'M12 20.5v-6.8',
    'M12 13.7c0-2.7 2.1-4.8 4.8-4.8 0 2.7-2.1 4.8-4.8 4.8z',
    'M12 16.2c0-2.1-1.7-3.8-3.8-3.8 0 2.1 1.7 3.8 3.8 3.8z',
  ],
  sommer: [
    'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    'M12 3v2.4', 'M12 18.6V21', 'M3 12h2.4', 'M18.6 12H21',
    'M5.6 5.6l1.7 1.7', 'M16.7 16.7l1.7 1.7',
    'M18.4 5.6l-1.7 1.7', 'M7.3 16.7l-1.7 1.7',
  ],
  herbst: [
    'M19.2 4.8C10.6 4.8 5.8 8.8 5.8 14.4a4.6 4.6 0 0 0 4.6 4.6c5.6 0 8.8-5.6 8.8-14.2z',
    'M7.5 19.5 13.5 11',
  ],
  winter: ['M12 3v18', 'M4.2 7.5l15.6 9', 'M19.8 7.5l-15.6 9'],

  // --- Kategorien (für Vorschau und Karten) ---
  oberteile: ['M8.6 4 5 6.3l1.7 3.3 1.9-1V20h6.8V8.6l1.9 1L19 6.3 15.4 4a3.4 3.4 0 0 1-6.8 0z'],
  unterteile: ['M7.4 4h9.2l.7 16h-3.6l-1.3-9.4h-.6L10.5 20H6.9z', 'M7.4 8.2h9.2'],
  sets_sonstiges: [
    'M8.6 4 6 5.9v3l2 .5V20h8V9.4l2-.5v-3L15.4 4a3.4 3.4 0 0 1-6.8 0z',
    'M9.8 20v-3.4h4.4V20',
  ],
  schuhe: [
    'M8.2 4v9.3c0 .9-.4 1.7-1.1 2.2L5.2 17v3h12.9a1.4 1.4 0 0 0 1.4-1.4v-1.1c0-.9-.5-1.7-1.3-2.1l-3.4-1.7a2.3 2.3 0 0 1-1.3-2.1V4z',
  ],
  muetzen: ['M4.2 17.6h15.6', 'M6.6 17.6a5.4 5.4 0 0 1 10.8 0', 'M12 9.6V7.4', 'M12 6.4v-.2'],
  spielzeug: [
    'M16.4 14.2a4.4 4.4 0 1 1-8.8 0 4.4 4.4 0 0 1 8.8 0',
    'M8.6 8.4a2.2 2.2 0 1 1-4.4 0 2.2 2.2 0 0 1 4.4 0',
    'M19.8 8.4a2.2 2.2 0 1 1-4.4 0 2.2 2.2 0 0 1 4.4 0',
    'M10.6 13.6v.2', 'M13.4 13.6v.2', 'M10.8 16.2c.7.6 1.7.6 2.4 0',
  ],
};

/**
 * Erzeugt ein Icon als SVG-Element.
 * @param {string} name Schlüssel aus PFADE
 * @param {number} [groesse] Kantenlänge in px
 * @returns {SVGElement}
 */
export function icon(name, groesse = 22) {
  const pfade = PFADE[name];
  if (!pfade) throw new Error(`Unbekanntes Icon: ${name}`);

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(groesse));
  svg.setAttribute('height', String(groesse));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  for (const d of pfade) {
    const pfad = document.createElementNS(NS, 'path');
    pfad.setAttribute('d', d);
    svg.append(pfad);
  }

  return svg;
}
