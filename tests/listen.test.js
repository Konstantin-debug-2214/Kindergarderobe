import { test } from 'node:test';
import assert from 'node:assert/strict';

import { aussortierteNachDatum, nachbarn, teileDerJahreszeit } from '../js/filters.js';
import { preisHinweis, preisText } from '../js/costs.js';

function teile() {
  return [
    { id: '1', typ: 'kleidung', name: 'Regenjacke gelb', kategorie: 'oberteile', anzahl: 1,
      aussortiert: false, jahreszeiten: ['herbst', 'fruehling'] },
    { id: '2', typ: 'kleidung', name: 'Jeans blau', kategorie: 'unterteile', anzahl: 1,
      aussortiert: false, jahreszeiten: ['herbst', 'winter'] },
    { id: '3', typ: 'kleidung', name: 'Badehose', kategorie: 'unterteile', anzahl: 1,
      aussortiert: false, jahreszeiten: ['sommer'] },
    { id: '4', typ: 'spielzeug', name: 'Lego', kategorie: 'spielzeug', anzahl: 1,
      aussortiert: false },
    { id: '5', typ: 'kleidung', name: 'Alte Jacke', kategorie: 'oberteile', anzahl: 2,
      aussortiert: true, aussortiertAm: '2026-09-01T10:00:00.000Z', aussortiertGrund: 'zu_klein',
      jahreszeiten: ['herbst'] },
    { id: '6', typ: 'kleidung', name: 'Neuer Papierkorb', kategorie: 'oberteile', anzahl: 1,
      aussortiert: true, aussortiertAm: '2026-10-05T10:00:00.000Z', aussortiertGrund: 'kaputt',
      jahreszeiten: ['winter'] },
  ];
}

test('die Jahreszeit zeigt nur Kleidung im Schrank', () => {
  const herbst = teileDerJahreszeit(teile(), 'herbst');
  assert.deepEqual(herbst.map((t) => t.name), ['Jeans blau', 'Regenjacke gelb'],
    'alphabetisch, ohne Aussortiertes');
  assert.ok(!herbst.some((t) => t.typ === 'spielzeug'), 'Spielzeug gehoert nicht dazu');
});

test('die Jahreszeit laesst sich zusaetzlich nach Kategorie filtern', () => {
  assert.deepEqual(
    teileDerJahreszeit(teile(), 'herbst', 'unterteile').map((t) => t.name),
    ['Jeans blau'],
  );
  assert.deepEqual(teileDerJahreszeit(teile(), 'herbst', 'schuhe'), []);
});

test('eine Jahreszeit ohne Teile ergibt eine leere Liste', () => {
  assert.deepEqual(teileDerJahreszeit([], 'winter'), []);
});

test('Aussortiertes kommt neueste Aussortierung zuerst', () => {
  assert.deepEqual(
    aussortierteNachDatum(teile()).map((t) => t.name),
    ['Neuer Papierkorb', 'Alte Jacke'],
  );
});

test('Teile ohne Aussortierdatum stehen hinten', () => {
  const liste = [
    { id: 'a', name: 'Ohne Datum', aussortiert: true },
    { id: 'b', name: 'Mit Datum', aussortiert: true, aussortiertAm: '2026-01-01T00:00:00.000Z' },
  ];
  assert.deepEqual(aussortierteNachDatum(liste).map((t) => t.name), ['Mit Datum', 'Ohne Datum']);
});

test('ohne Aussortiertes bleibt die Liste leer', () => {
  assert.deepEqual(aussortierteNachDatum([{ id: '1', aussortiert: false }]), []);
});

test('die Nachbarn im Detail stimmen', () => {
  const liste = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  assert.deepEqual(nachbarn(liste, 'a'),
    { stelle: 1, gesamt: 3, vorher: null, nachher: { id: 'b' } });
  assert.deepEqual(nachbarn(liste, 'b'),
    { stelle: 2, gesamt: 3, vorher: { id: 'a' }, nachher: { id: 'c' } });
  assert.deepEqual(nachbarn(liste, 'c'),
    { stelle: 3, gesamt: 3, vorher: { id: 'b' }, nachher: null });
});

test('ein unbekanntes Teil hat keine Nachbarn', () => {
  assert.deepEqual(nachbarn([{ id: 'a' }], 'x'),
    { stelle: 0, gesamt: 1, vorher: null, nachher: null });
  assert.deepEqual(nachbarn([], 'a'), { stelle: 0, gesamt: 0, vorher: null, nachher: null });
});

/* --- Preistexte ----------------------------------------------------------- */

const ausgaben = [
  { id: 'a1', bezeichnung: 'Flohmarkt Kita', datum: '2026-09-12', betrag: 2500, anzahlTeile: 6 },
];

test('der Preistext nennt Betrag, Sammelkauf oder kein Preis', () => {
  assert.equal(preisText({ preis: { art: 'einzeln', betrag: 800 } })
    .replace(/\u00a0|\u202f/g, ' '), '8,00 €');
  assert.equal(preisText({ preis: { art: 'sammelkauf', ausgabeId: 'a1' } }), 'Sammelkauf');
  assert.equal(preisText({ preis: null }), 'kein Preis');
  assert.equal(preisText({}), 'kein Preis');
  assert.equal(preisText(null), 'kein Preis');
});

test('der Sammelkauf wird erklaert', () => {
  const text = preisHinweis({ preis: { art: 'sammelkauf', ausgabeId: 'a1' } }, ausgaben);
  assert.equal(text.replace(/\u00a0|\u202f/g, ' '), 'Flohmarkt Kita · 25,00 € für 6 Teile');
});

test('ohne Sammelkauf gibt es keine Erklaerung', () => {
  assert.equal(preisHinweis({ preis: { art: 'einzeln', betrag: 800 } }, ausgaben), null);
  assert.equal(preisHinweis({ preis: null }, ausgaben), null);
  assert.equal(preisHinweis({ preis: { art: 'sammelkauf', ausgabeId: 'weg' } }, ausgaben), null,
    'eine geloeschte Ausgabe bricht nichts');
});
