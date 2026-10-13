/**
 * saisonwechsel.js – Screen "Soll-Mengen & Saisonwechsel" (#/saisonwechsel).
 */

import { platzhalterScreen } from './platzhalter.js';

export function saisonwechselScreen() {
  return platzhalterScreen({
    titel: 'Soll-Mengen & Saisonwechsel',
    unterzeile: 'Soll je Art und Jahreszeit',
    zurueckZu: '#/statistik',
    beschreibung:
      'Hier stehen später der Umschalter für die vier Jahreszeiten, die Tabelle '
      + '"Art · Passend · Soll · Stand" und der Saisonwechsel-Check.',
  });
}
