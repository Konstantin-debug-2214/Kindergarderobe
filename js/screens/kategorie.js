/**
 * kategorie.js – Screen "Kategorie mit Filtern" (#/kategorie/:kategorieId).
 */

import { platzhalterScreen } from './platzhalter.js';

export function kategorieScreen({ kategorieId }) {
  return platzhalterScreen({
    titel: 'Kategorie',
    unterzeile: 'Teile einer Kategorie mit Filtern',
    zurueckZu: '#/',
    beschreibung:
      'Hier stehen später die Filterspalte (Jahreszeit, Größe, Art, Merkmal, Passform), '
      + 'die Suche und die Karten der Teile.',
    werte: [{ name: 'Kategorie', wert: kategorieId }],
  });
}
