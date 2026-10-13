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
