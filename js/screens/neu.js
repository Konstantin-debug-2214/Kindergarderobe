/**
 * neu.js – Screen "Teil hinzufügen" (#/neu).
 */

import { platzhalterScreen } from './platzhalter.js';

export function neuScreen() {
  return platzhalterScreen({
    titel: 'Neues Teil',
    zurueckZu: '#/',
    zurueckArt: 'schliessen',
    beschreibung:
      'Hier stehen später der Umschalter Kleidung / Spielzeug, die Live-Vorschau '
      + 'der Karte und alle Felder des Formulars.',
  });
}
