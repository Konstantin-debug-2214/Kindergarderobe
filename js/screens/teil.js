/**
 * teil.js – Screen "Detail" (#/teil/:teilId).
 */

import { knopf } from '../ui/knoepfe.js';
import { platzhalterScreen, testlinks } from './platzhalter.js';

export function teilScreen({ teilId }) {
  return platzhalterScreen({
    titel: 'Teil',
    unterzeile: 'Detailansicht eines Teils',
    zurueckZu: '#/',
    beschreibung:
      'Hier stehen später die Teile der Kategorie links und rechts die Details: '
      + 'Größe, Farbe, Preis, Jahreszeiten, Passform und Notiz, dazu die Knöpfe '
      + '"Bearbeiten" und "Aussortieren".',
    werte: [{ name: 'Teil', wert: teilId }],
    weiteres: [
      testlinks('Testlinks (vorläufig)', [
        knopf({ text: 'Bearbeiten', href: `#/teil/${encodeURIComponent(teilId)}/bearbeiten` }),
      ]),
    ],
  });
}
