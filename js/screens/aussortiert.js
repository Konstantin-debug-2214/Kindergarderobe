/**
 * aussortiert.js – Screen "Aussortiert" (#/aussortiert).
 */

import { platzhalterScreen } from './platzhalter.js';

export function aussortiertScreen() {
  return platzhalterScreen({
    titel: 'Aussortiert',
    unterzeile: 'Papierkorb – zählt nicht mit',
    zurueckZu: '#/',
    zurueckKlasse: 'nur-tablet',
    beschreibung:
      'Hier steht später die Liste der aussortierten Teile mit Datum und Grund, '
      + 'je Teil "Zurückholen" und der Knopf "Aussortiert leeren".',
  });
}
