/**
 * statistik.js – Screen "Statistik" (#/statistik).
 */

import { knopf } from '../ui/knoepfe.js';
import { platzhalterScreen, testlinks } from './platzhalter.js';

export function statistikScreen() {
  return platzhalterScreen({
    titel: 'Statistik',
    zurueckZu: '#/',
    zurueckKlasse: 'nur-tablet',
    beschreibung:
      'Hier stehen später die Gesamtzahl im Schrank und die Balkendiagramme nach '
      + 'Kategorie, Art, Jahreszeit und Größe.',
    weiteres: [
      testlinks('Weiter zu', [
        knopf({
          text: 'Soll-Mengen & Saisonwechsel',
          href: '#/saisonwechsel',
          iconName: 'liste',
        }),
      ]),
    ],
  });
}
