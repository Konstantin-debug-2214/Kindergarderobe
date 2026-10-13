/**
 * teilBearbeiten.js – Screen "Teil bearbeiten" (#/teil/:teilId/bearbeiten).
 */

import { platzhalterScreen } from './platzhalter.js';

export function teilBearbeitenScreen({ teilId }) {
  return platzhalterScreen({
    titel: 'Teil bearbeiten',
    zurueckZu: `#/teil/${encodeURIComponent(teilId)}`,
    zurueckArt: 'schliessen',
    beschreibung:
      'Hier steht später dasselbe Formular wie bei "Teil hinzufügen", '
      + 'gefüllt mit den Werten des Teils.',
    werte: [{ name: 'Teil', wert: teilId }],
  });
}
