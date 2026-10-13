/**
 * einstellungen.js – Screen "Einstellungen & Backup" (#/einstellungen).
 *
 * Auf dem Smartphone ist dieser Screen zugleich der Eintrag "Mehr" aus der
 * unteren Leiste und führt von hier zu Kosten sowie Soll-Mengen & Saisonwechsel.
 */

import { knopf } from '../ui/knoepfe.js';
import { platzhalterScreen, testlinks } from './platzhalter.js';

export function einstellungenScreen() {
  return platzhalterScreen({
    titel: 'Einstellungen',
    zurueckZu: '#/',
    zurueckKlasse: 'nur-tablet',
    beschreibung:
      'Hier stehen später der Name des Kindes mit Live-Vorschau der Begrüßung, '
      + 'die Backup-Erinnerung, der Backup-Status sowie Export und Import.',
    weiteres: [
      testlinks('Weitere Bereiche', [
        knopf({ text: 'Kosten', href: '#/kosten', iconName: 'euro' }),
        knopf({ text: 'Soll-Mengen & Saisonwechsel', href: '#/saisonwechsel', iconName: 'liste' }),
      ]),
    ],
  });
}
