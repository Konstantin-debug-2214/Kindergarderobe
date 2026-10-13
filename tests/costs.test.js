import { test } from 'node:test';
import assert from 'node:assert/strict';

import { euroTextInCent, formatEuro, gesamtsumme, jahressumme, jahrVon } from '../js/costs.js';

const AUSGABEN = [
  { id: '1', bezeichnung: 'Flohmarkt Kita', datum: '2026-09-12', betrag: 2500, anzahlTeile: 6 },
  { id: '2', bezeichnung: 'Strickjacke senf', datum: '2026-08-28', betrag: 1500, anzahlTeile: 1 },
  { id: '3', bezeichnung: 'Basar Gemeindehaus', datum: '2026-08-15', betrag: 1850, anzahlTeile: 4 },
  { id: '4', bezeichnung: 'Sweatshirt grün', datum: '2026-07-02', betrag: 1200, anzahlTeile: 1 },
  { id: '5', bezeichnung: 'Ringelshirt blau', datum: '2026-06-20', betrag: 800, anzahlTeile: 1 },
  { id: '6', bezeichnung: 'Aus dem Vorjahr', datum: '2025-11-30', betrag: 9900, anzahlTeile: 1 },
];

test('die Jahressumme zählt nur Ausgaben des Jahres', () => {
  assert.equal(jahressumme(AUSGABEN, 2026), 7850);
  assert.equal(jahressumme(AUSGABEN, 2025), 9900);
  assert.equal(jahressumme(AUSGABEN, 2024), 0);
});

test('die Jahressumme kommt ohne Ausgaben auf 0', () => {
  assert.equal(jahressumme([], 2026), 0);
  assert.equal(jahressumme(undefined, 2026), 0);
});

test('die Jahressumme versteht auch volle Zeitstempel', () => {
  const mitZeit = [{ datum: '2026-03-01T10:15:00.000Z', betrag: 500 }];
  assert.equal(jahressumme(mitZeit, 2026), 500);
});

test('kaputte Beträge aus einem Backup kippen die Summe nicht', () => {
  const kaputt = [
    { datum: '2026-01-01', betrag: 1000 },
    { datum: '2026-01-02', betrag: null },
    { datum: '2026-01-03', betrag: 'viel' },
  ];
  assert.equal(jahressumme(kaputt, 2026), 1000);
});

test('die Gesamtsumme zählt alle Ausgaben', () => {
  assert.equal(gesamtsumme(AUSGABEN), 17750);
  assert.equal(gesamtsumme([]), 0);
});

test('Beträge erscheinen im deutschen Format', () => {
  // Zwischen Zahl und Euro-Zeichen steht ein schmales geschütztes Leerzeichen.
  assert.equal(formatEuro(800).replace(/ | /g, ' '), '8,00 €');
  assert.equal(formatEuro(7850).replace(/ | /g, ' '), '78,50 €');
  assert.equal(formatEuro(0).replace(/ | /g, ' '), '0,00 €');
  assert.equal(formatEuro(100000).replace(/ | /g, ' '), '1.000,00 €');
});

test('Rechnen in Cent vermeidet Fließkomma-Fehler', () => {
  // 0.1 + 0.2 ergibt als Fließkommazahl 0.30000000000000004.
  const ausgaben = [{ datum: '2026-01-01', betrag: 10 }, { datum: '2026-01-02', betrag: 20 }];
  assert.equal(jahressumme(ausgaben, 2026), 30);
  assert.equal(formatEuro(jahressumme(ausgaben, 2026)).replace(/ | /g, ' '), '0,30 €');
});

test('Eingaben wie 8,50 werden zu Cent', () => {
  assert.equal(euroTextInCent('8,50'), 850);
  assert.equal(euroTextInCent('8.50'), 850);
  assert.equal(euroTextInCent('8'), 800);
  assert.equal(euroTextInCent('0'), 0);
  assert.equal(euroTextInCent(' 25,00 '), 2500);
  assert.equal(euroTextInCent('18,55'), 1855);
});

test('ungültige Beträge ergeben null', () => {
  assert.equal(euroTextInCent(''), null);
  assert.equal(euroTextInCent('abc'), null);
  assert.equal(euroTextInCent('-5'), null);
  assert.equal(euroTextInCent(null), null);
});

test('das Jahr wird aus dem Datum gelesen', () => {
  assert.equal(jahrVon('2026-08-14'), 2026);
  assert.equal(jahrVon('2026-08-14T10:00:00.000Z'), 2026);
  assert.equal(jahrVon(''), null);
  assert.equal(jahrVon(null), null);
});
