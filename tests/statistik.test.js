import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  gesamtImSchrank,
  haeufigsteArten,
  teileZuStatistik,
  zaehleJeGroesse,
  zaehleJeJahreszeit,
  zaehleJeKategorie,
} from '../js/filters.js';

function kleidung(name, art, kategorie, anzahl, groesse, jahreszeiten = ['herbst'], weiteres = {}) {
  return {
    id: name, typ: 'kleidung', name, art, kategorie, anzahl, groesse, jahreszeiten,
    aussortiert: false, ...weiteres,
  };
}

function spielzeug(name, art, anzahl, weiteres = {}) {
  return {
    id: name, typ: 'spielzeug', name, art, kategorie: 'spielzeug', anzahl,
    aussortiert: false, ...weiteres,
  };
}

const konf = (von, bis = von) => ({ system: 'konfektion', von, bis });

function inventar() {
  return [
    kleidung('Pulli A', 'Pullover', 'oberteile', 2, konf(110)),
    kleidung('Pulli B', 'Pullover', 'oberteile', 1, konf(104)),
    kleidung('Shirt', 'T-Shirt', 'oberteile', 3, konf(98, 104)),
    kleidung('Hose A', 'Hose', 'unterteile', 1, konf(110), ['winter']),
    kleidung('Hose B', 'Hose', 'unterteile', 1, konf(116), ['sommer', 'herbst']),
    kleidung('Socken', 'Socken', 'unterteile', 10, { system: 'schuh', von: 23, bis: 26 }),
    kleidung('Stiefel', 'Gummistiefel', 'schuhe', 1, { system: 'schuh', von: 28, bis: 28 }),
    kleidung('Muetze', 'Muetze', 'muetzen', 1, { system: 'kopf', von: 52, bis: 52 }, ['winter']),
    spielzeug('Lego', 'Lego', 2),
    spielzeug('Puzzle A', 'Puzzle', 1),
    spielzeug('Puzzle B', 'Puzzle', 1),
    // Aussortiertes zaehlt nirgends mit.
    kleidung('Weg', 'Pullover', 'oberteile', 9, konf(110), ['herbst'], { aussortiert: true }),
  ];
}

/* --- Gesamtzahl ----------------------------------------------------------- */

test('die Gesamtzahl zählt Kleidung und Spielzeug nach Stück', () => {
  // Kleidung 2+1+3+1+1+10+1+1 = 20, Spielzeug 2+1+1 = 4
  assert.equal(gesamtImSchrank(inventar()), 24);
});

test('Aussortiertes zählt nicht mit', () => {
  const ohne = inventar().filter((t) => !t.aussortiert);
  assert.equal(gesamtImSchrank(inventar()), gesamtImSchrank(ohne));
});

test('ohne Teile ist die Gesamtzahl 0', () => {
  assert.equal(gesamtImSchrank([]), 0);
});

/* --- Nach Kategorie ------------------------------------------------------- */

test('alle sechs Kategorien erscheinen, auch mit 0', () => {
  const zahlen = zaehleJeKategorie(inventar());
  assert.equal(zahlen.oberteile, 6, '2 + 1 + 3');
  assert.equal(zahlen.unterteile, 12, '1 + 1 + 10');
  assert.equal(zahlen.schuhe, 1);
  assert.equal(zahlen.muetzen, 1);
  assert.equal(zahlen.spielzeug, 4);
  assert.equal(zahlen.sets_sonstiges, 0);
});

/* --- Nach Art ------------------------------------------------------------- */

test('die häufigsten Arten zählen nur Kleidung', () => {
  const arten = haeufigsteArten(inventar());
  assert.ok(!arten.some((a) => ['Lego', 'Puzzle'].includes(a.wert)), 'kein Spielzeug');
  assert.deepEqual(arten[0], { wert: 'Socken', anzahl: 10 });
});

test('bei Gleichstand entscheidet das Alphabet', () => {
  const arten = haeufigsteArten(inventar());
  const gleich = arten.filter((a) => a.anzahl === 3).map((a) => a.wert);
  assert.deepEqual(gleich, ['Pullover', 'T-Shirt'],
    'beide haben 3 Stueck, die aussortierten 9 fehlen');
});

test('es kommen höchstens sieben Arten', () => {
  const viele = Array.from({ length: 12 }, (unbenutzt, i) => kleidung(
    `Teil ${i}`, `Art ${String(i).padStart(2, '0')}`, 'oberteile', 12 - i, konf(110),
  ));
  const arten = haeufigsteArten(viele);
  assert.equal(arten.length, 7);
  assert.equal(arten[0].wert, 'Art 00', 'die haeufigste zuerst');
});

test('Spielzeug lässt sich getrennt zählen', () => {
  const arten = haeufigsteArten(inventar(), { typ: 'spielzeug' });
  assert.deepEqual(arten, [{ wert: 'Lego', anzahl: 2 }, { wert: 'Puzzle', anzahl: 2 }],
    'bei Gleichstand alphabetisch');
});

test('ohne passende Teile bleibt die Liste leer', () => {
  assert.deepEqual(haeufigsteArten([], { typ: 'spielzeug' }), []);
  assert.deepEqual(
    haeufigsteArten(inventar().filter((t) => t.typ === 'kleidung'), { typ: 'spielzeug' }),
    [],
  );
});

/* --- Nach Jahreszeit ------------------------------------------------------ */

test('die Jahreszeiten zählen nur Kleidung, ein Teil mehrfach', () => {
  const zahlen = zaehleJeJahreszeit(inventar());
  // Herbst: Pulli A 2 + Pulli B 1 + Shirt 3 + Hose B 1 + Socken 10 + Stiefel 1
  assert.equal(zahlen.herbst, 18);
  assert.equal(zahlen.sommer, 1, 'nur Hose B');
  assert.equal(zahlen.winter, 2, 'Hose A und Muetze');
});

/* --- Nach Größe ----------------------------------------------------------- */

test('das Größen-Diagramm zeigt nur Konfektionsgrößen', () => {
  const werte = zaehleJeGroesse(inventar()).map((g) => g.wert);
  assert.ok(!werte.includes(23), 'Schuhgroessen fehlen');
  assert.ok(!werte.includes(52), 'Kopfumfang fehlt');
});

test('Doppelgrößen zählen bei jeder enthaltenen Größe', () => {
  const alsObjekt = Object.fromEntries(zaehleJeGroesse(inventar()).map((g) => [g.wert, g.anzahl]));
  assert.equal(alsObjekt[98], 3, 'nur das Shirt 98/104');
  assert.equal(alsObjekt[104], 4, 'Pulli B 1 + Shirt 3');
  assert.equal(alsObjekt[110], 3, 'Pulli A 2 + Hose A 1');
  assert.equal(alsObjekt[116], 1);
});

test('die Größen kommen aufsteigend und nur, wenn sie vorkommen', () => {
  assert.deepEqual(zaehleJeGroesse(inventar()).map((g) => g.wert), [98, 104, 110, 116]);
  assert.deepEqual(zaehleJeGroesse([]), []);
});

/* --- Antippen führt zu den Teilen ----------------------------------------- */

test('eine Art führt zu ihren Teilen', () => {
  assert.deepEqual(
    teileZuStatistik(inventar(), { art: 'Pullover' }).map((t) => t.name),
    ['Pulli A', 'Pulli B'],
    'alphabetisch, ohne das aussortierte',
  );
});

test('eine Spielzeug-Art führt zu ihren Teilen', () => {
  assert.deepEqual(
    teileZuStatistik(inventar(), { art: 'Puzzle' }).map((t) => t.name),
    ['Puzzle A', 'Puzzle B'],
  );
});

test('eine Größe trifft auch Doppelgrößen', () => {
  assert.deepEqual(
    teileZuStatistik(inventar(), { groesse: 104 }).map((t) => t.name),
    ['Pulli B', 'Shirt'],
    'Shirt ist 98/104',
  );
  assert.deepEqual(
    teileZuStatistik(inventar(), { groesse: 110 }).map((t) => t.name),
    ['Hose A', 'Pulli A'],
  );
});

test('Art und Größe lassen sich zusammen anwenden', () => {
  assert.deepEqual(
    teileZuStatistik(inventar(), { art: 'Pullover', groesse: 110 }).map((t) => t.name),
    ['Pulli A'],
  );
});

test('ohne Filter kommen alle Teile im Schrank', () => {
  assert.equal(teileZuStatistik(inventar(), {}).length, 11);
});
