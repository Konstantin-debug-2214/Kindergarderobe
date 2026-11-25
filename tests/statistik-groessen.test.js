/**
 * Auftrag 14: Die Trefferansicht zu einem Größen-Balken zählt wie das
 * Diagramm nur Konfektion – Kopfumfänge von 50 oder 56 cm gehören nicht dazu.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { neuesKleidungsteil } from '../js/model.js';
import { teileZuStatistik, zaehleJeGroesse } from '../js/filters.js';

const konf = (von, bis = von) => ({ system: 'konfektion', von, bis });

/* --- Statistik: Größen-Treffer --------------------------------------------- */

function kleidung(name, kategorie, art, anzahl, groesse) {
  return neuesKleidungsteil({
    name, kategorie, art, anzahl, groesse, jahreszeiten: ['winter'], passform: 'passt_gut',
  });
}

function statistikInventar() {
  return [
    kleidung('Body', 'oberteile', 'Body', 3, konf(56)),
    kleidung('Strampler', 'sets_sonstiges', 'Strampler', 2, konf(50, 56)),
    kleidung('Shirt', 'oberteile', 'T-Shirt', 4, konf(98, 104)),
    kleidung('Hose', 'unterteile', 'Hose', 1, konf(92, 110)),
    // Kopfumfänge, die zufällig einer Konfektionsgröße entsprechen.
    kleidung('Mütze 56', 'muetzen', 'Mütze', 3, { system: 'kopf', von: 56, bis: 56 }),
    kleidung('Mütze 50', 'muetzen', 'Mütze', 1, { system: 'kopf', von: 50, bis: 50 }),
    kleidung('Socken', 'unterteile', 'Socken', 5, { system: 'schuh', von: 23, bis: 26 }),
    { ...kleidung('Alt', 'oberteile', 'Body', 7, konf(56)), aussortiert: true },
  ];
}

const stueck = (teile) => teile.reduce((summe, t) => summe + t.anzahl, 0);

test('die Trefferansicht zu einem Größen-Balken zeigt nur Konfektion', () => {
  const treffer = teileZuStatistik(statistikInventar(), { groesse: 56 });
  assert.deepEqual(treffer.map((t) => t.name).sort(), ['Body', 'Strampler']);
});

test('für jede Größe im Diagramm entspricht die Trefferzahl dem Balken', () => {
  const teile = statistikInventar();
  const balken = zaehleJeGroesse(teile);
  assert.deepEqual(balken.map((b) => b.wert), [50, 56, 92, 98, 104, 110]);
  for (const { wert, anzahl } of balken) {
    assert.equal(stueck(teileZuStatistik(teile, { groesse: wert })), anzahl, `Größe ${wert}`);
  }
});

test('eine Größe ohne Balken findet keine Kopfumfänge oder Schuhgrößen', () => {
  const teile = statistikInventar();
  assert.deepEqual(teileZuStatistik(teile, { groesse: 25 }), []);
  assert.deepEqual(teileZuStatistik(teile, { groesse: 52 }), []);
});
