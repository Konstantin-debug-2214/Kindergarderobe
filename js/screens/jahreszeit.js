/**
 * jahreszeit.js – Screen "Nach Jahreszeit" (#/jahreszeit/:jahreszeitId).
 */

import { platzhalterScreen } from './platzhalter.js';

export function jahreszeitScreen({ jahreszeitId }) {
  return platzhalterScreen({
    titel: 'Nach Jahreszeit',
    unterzeile: 'Teile einer Jahreszeit',
    zurueckZu: '#/',
    beschreibung:
      'Hier stehen später die vier Jahreszeiten-Knöpfe, der Filter nach Kategorie '
      + 'und die Karten mit Kategorie und Größe.',
    werte: [{ name: 'Jahreszeit', wert: jahreszeitId }],
  });
}
