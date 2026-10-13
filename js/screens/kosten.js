/**
 * kosten.js – Screen "Kosten" (#/kosten).
 */

import { platzhalterScreen } from './platzhalter.js';

export function kostenScreen() {
  return platzhalterScreen({
    titel: 'Kosten',
    zurueckZu: '#/',
    beschreibung:
      'Hier stehen später die Summe des Jahres, Anzahl Teile und Durchschnitt, '
      + 'das Formular "Kosten hinzufügen" und die Einträge, neueste zuerst.',
  });
}
