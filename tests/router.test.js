import { test } from 'node:test';
import assert from 'node:assert/strict';

import { abfrageAusHash, findeRoute, pfadAusHash } from '../js/router.js';

test('der Pfad entsteht aus dem Hash', () => {
  assert.equal(pfadAusHash(''), '/');
  assert.equal(pfadAusHash('#'), '/');
  assert.equal(pfadAusHash('#/'), '/');
  assert.equal(pfadAusHash('#/kategorie/schuhe/'), '/kategorie/schuhe');
});

test('ein Abfrageteil gehoert nicht zum Pfad', () => {
  assert.equal(pfadAusHash('#/neu?kategorie=schuhe'), '/neu');
  assert.equal(findeRoute(pfadAusHash('#/neu?kategorie=schuhe')).screen, 'neu');
});

test('die Werte hinter dem Fragezeichen werden gelesen', () => {
  assert.deepEqual(abfrageAusHash('#/neu?kategorie=schuhe'), { kategorie: 'schuhe' });
  assert.deepEqual(abfrageAusHash('#/neu?kategorie=sets_sonstiges&x=1'),
    { kategorie: 'sets_sonstiges', x: '1' });
  assert.deepEqual(abfrageAusHash('#/neu'), {});
  assert.deepEqual(abfrageAusHash(''), {});
});

test('alle Routen werden gefunden', () => {
  const faelle = [
    ['#/', 'uebersicht'],
    ['#/kategorie/oberteile', 'kategorie'],
    ['#/jahreszeit/herbst', 'jahreszeit'],
    ['#/teil/abc', 'teil'],
    ['#/teil/abc/bearbeiten', 'teilBearbeiten'],
    ['#/neu', 'neu'],
    ['#/kosten', 'kosten'],
    ['#/statistik', 'statistik'],
    ['#/saisonwechsel', 'saisonwechsel'],
    ['#/aussortiert', 'aussortiert'],
    ['#/einstellungen', 'einstellungen'],
  ];
  for (const [hash, screen] of faelle) {
    assert.equal(findeRoute(pfadAusHash(hash))?.screen, screen, hash);
  }
});

test('unbekannte Adressen finden keine Route', () => {
  assert.equal(findeRoute(pfadAusHash('#/quatsch')), null);
  assert.equal(findeRoute(pfadAusHash('#/kategorie')), null);
  assert.equal(findeRoute(pfadAusHash('#/kategorie/a/b')), null);
});

test('Werte aus dem Pfad kommen als Parameter', () => {
  assert.deepEqual(findeRoute(pfadAusHash('#/teil/abc-123/bearbeiten')).parameter,
    { teilId: 'abc-123' });
  assert.deepEqual(findeRoute(pfadAusHash('#/kategorie/sets_sonstiges')).parameter,
    { kategorieId: 'sets_sonstiges' });
});
