import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatEuro,
  istSammelkauf,
  jahreMitAusgaben,
  jahresZahlen,
  proTeil,
} from '../js/costs.js';

/** Die Beispielwerte aus dem Design-Screenshot "Kosten". */
const DESIGN = [
  { id: '1', bezeichnung: 'Flohmarkt Kita', datum: '2026-09-12', betrag: 2500, anzahlTeile: 6 },
  { id: '2', bezeichnung: 'Strickjacke senf', datum: '2026-08-28', betrag: 1500, anzahlTeile: 1 },
  { id: '3', bezeichnung: 'Basar Gemeindehaus', datum: '2026-08-15', betrag: 1850, anzahlTeile: 4 },
  { id: '4', bezeichnung: 'Sweatshirt grün', datum: '2026-07-02', betrag: 1200, anzahlTeile: 1 },
  { id: '5', bezeichnung: 'Ringelshirt blau', datum: '2026-06-20', betrag: 800, anzahlTeile: 1 },
];

/** Ohne geschützte Leerzeichen vergleichen. */
const euro = (cent) => formatEuro(cent).replace(/\u00a0|\u202f/g, ' ');

test('die Zahlen stimmen mit dem Design überein', () => {
  const zahlen = jahresZahlen(DESIGN, 2026);
  assert.equal(euro(zahlen.summe), '78,50 €');
  assert.equal(zahlen.teile, 13);
  assert.equal(euro(zahlen.durchschnitt), '6,04 €');
});

test('der Preis je Teil stimmt mit dem Design überein', () => {
  assert.equal(euro(proTeil(DESIGN[0])), '4,17 €', '25,00 € für 6 Teile');
  assert.equal(euro(proTeil(DESIGN[2])), '4,63 €', '18,50 € für 4 Teile');
});

test('gerundet wird kaufmännisch', () => {
  // 18,50 € / 4 = 4,625 € – die Hälfte wird aufgerundet.
  assert.equal(proTeil({ betrag: 1850, anzahlTeile: 4 }), 463);
  assert.equal(proTeil({ betrag: 1000, anzahlTeile: 3 }), 333);
  assert.equal(proTeil({ betrag: 2000, anzahlTeile: 3 }), 667);
});

test('ein Eintrag ohne Teilezahl zählt als ein Teil', () => {
  assert.equal(proTeil({ betrag: 800 }), 800);
  assert.equal(jahresZahlen([{ datum: '2026-01-01', betrag: 800 }], 2026).teile, 1);
});

test('ohne Ausgaben gibt es keinen Durchschnitt', () => {
  assert.deepEqual(jahresZahlen([], 2026), { summe: 0, teile: 0, durchschnitt: 0 });
  assert.deepEqual(jahresZahlen(DESIGN, 2024), { summe: 0, teile: 0, durchschnitt: 0 });
});

test('die Zahlen trennen die Jahre', () => {
  const ausgaben = [...DESIGN,
    { id: '9', bezeichnung: 'Vorjahr', datum: '2025-11-30', betrag: 9900, anzahlTeile: 3 }];

  assert.equal(jahresZahlen(ausgaben, 2026).summe, 7850);
  assert.equal(jahresZahlen(ausgaben, 2025).summe, 9900);
  assert.equal(jahresZahlen(ausgaben, 2025).teile, 3);
  assert.equal(euro(jahresZahlen(ausgaben, 2025).durchschnitt), '33,00 €');
});

test('die Jahre kommen neuestes zuerst und ohne Doppelte', () => {
  const ausgaben = [
    { datum: '2026-09-12', betrag: 100 },
    { datum: '2024-01-01', betrag: 100 },
    { datum: '2026-01-02', betrag: 100 },
    { datum: '2025-05-05', betrag: 100 },
  ];
  assert.deepEqual(jahreMitAusgaben(ausgaben), [2026, 2025, 2024]);
});

test('Einträge ohne Datum liefern kein Jahr', () => {
  assert.deepEqual(jahreMitAusgaben([{ betrag: 100 }, { datum: '', betrag: 100 }]), []);
  assert.deepEqual(jahreMitAusgaben([]), []);
});

test('ein Sammelkauf umfasst mehr als ein Teil', () => {
  assert.equal(istSammelkauf({ anzahlTeile: 6 }), true);
  assert.equal(istSammelkauf({ anzahlTeile: 2 }), true);
  assert.equal(istSammelkauf({ anzahlTeile: 1 }), false);
  assert.equal(istSammelkauf({}), false);
});

test('Kosten aussortierter Teile bleiben in der Summe', () => {
  // Die Summe entsteht nur aus ausgaben – Teile spielen keine Rolle.
  const zahlen = jahresZahlen(DESIGN, 2026);
  assert.equal(zahlen.summe, 7850, 'unabhaengig davon, ob die Teile noch da sind');
});

test('kaputte Beträge aus einem Backup kippen die Zahlen nicht', () => {
  const kaputt = [
    { datum: '2026-01-01', betrag: 1000, anzahlTeile: 2 },
    { datum: '2026-01-02', betrag: null, anzahlTeile: 1 },
    { datum: '2026-01-03', betrag: 'viel', anzahlTeile: 0 },
  ];
  const zahlen = jahresZahlen(kaputt, 2026);
  assert.equal(zahlen.summe, 1000);
  assert.equal(zahlen.teile, 4, '2 + 1 + 1 (0 zaehlt als 1)');
});
