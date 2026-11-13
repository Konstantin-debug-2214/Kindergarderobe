/**
 * Zusammenfassen nach Art (Auftrag 13): Gruppen je Kategorie + Art, Größen
 * als Chips mit der besten Passform, Sonderfälle.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { groessenChips, gruppiereNachArt, zusammenfassen } from '../js/filters.js';
import { neuesKleidungsteil, neuesSpielzeug } from '../js/model.js';

function hose(name, von, bis = von, werte = {}) {
  return neuesKleidungsteil({
    name, kategorie: 'unterteile', art: 'Badehose',
    groesse: { system: 'konfektion', von, bis }, jahreszeiten: ['sommer'], ...werte,
  });
}

function teil(art, kategorie, werte = {}) {
  return neuesKleidungsteil({
    name: `${art} ${Math.random().toString(36).slice(2, 5)}`, kategorie, art,
    groesse: { system: 'konfektion', von: 110, bis: 110 }, jahreszeiten: ['sommer'], ...werte,
  });
}

/* --- Gruppieren ------------------------------------------------------------ */

test('Teile werden je Kategorie und Art gruppiert, Stückzahl nach anzahl', () => {
  const gruppen = gruppiereNachArt([
    hose('Badehose blau', 104),
    hose('Badehose rot', 110, 110, { anzahl: 2 }),
    teil('Shorts', 'unterteile'),
  ]);

  assert.deepEqual(gruppen.map((g) => [g.art, g.kategorie, g.stueck, g.teile.length]), [
    ['Badehose', 'unterteile', 3, 2],
    ['Shorts', 'unterteile', 1, 1],
  ]);
});

test('Gruppen stehen alphabetisch nach Art', () => {
  const gruppen = gruppiereNachArt([
    teil('Shorts', 'unterteile'), teil('Badehose', 'unterteile'), teil('Jeans', 'unterteile'),
  ]);
  assert.deepEqual(gruppen.map((g) => g.art), ['Badehose', 'Jeans', 'Shorts']);
});

test('dieselbe Art in zwei Kategorien ergibt zwei Gruppen', () => {
  const gruppen = gruppiereNachArt([
    teil('Sonstiges', 'sets_sonstiges'), teil('Sonstiges', 'oberteile', { art: 'Sonstiges' }),
  ]);
  assert.deepEqual(gruppen.map((g) => g.kategorie).sort(), ['oberteile', 'sets_sonstiges']);
});

/* --- Größen-Chips ---------------------------------------------------------- */

test('Größen erscheinen einmal je Größe, aufsteigend', () => {
  const chips = groessenChips([hose('a', 116), hose('b', 104), hose('c', 116), hose('d', 92)]);
  assert.deepEqual(chips.map((c) => c.text), ['92', '104', '116']);
});

test('eine Doppelgröße ist ein eigener Eintrag', () => {
  const chips = groessenChips([hose('a', 98, 104), hose('b', 98), hose('c', 104)]);
  assert.deepEqual(chips.map((c) => c.text), ['98', '98/104', '104']);
});

test('je Größe gilt die beste Passform der Teile dieser Größe', () => {
  const chips = groessenChips([
    hose('a', 104, 104, { passform: 'zu_klein' }),
    hose('b', 104, 104, { passform: 'bald_zu_klein' }),
    hose('c', 110, 110, { passform: 'zu_klein' }),
    hose('d', 116, 116, { passform: 'bald_zu_klein' }),
    hose('e', 116, 116, { passform: 'passt_gut' }),
  ]);
  assert.deepEqual(chips, [
    { text: '104', passform: 'bald_zu_klein' },
    { text: '110', passform: 'zu_klein' },
    { text: '116', passform: 'passt_gut' },
  ]);
});

test('Schuhgrößen-Spannen und Kopfumfang werden lesbar geschrieben', () => {
  const chips = groessenChips([
    neuesKleidungsteil({ name: 's', kategorie: 'unterteile', art: 'Socken',
      groesse: { system: 'schuh', von: 23, bis: 26 }, jahreszeiten: ['winter'] }),
    neuesKleidungsteil({ name: 'm', kategorie: 'muetzen', art: 'Mütze',
      groesse: { system: 'kopf', von: 52, bis: 52 }, jahreszeiten: ['winter'] }),
  ]);
  assert.deepEqual(chips.map((c) => c.text), ['23–26', '52 cm']);
});

test('Spielzeug zeigt "ab n J." statt Größen und keine Passform', () => {
  const chips = groessenChips([
    neuesSpielzeug({ name: 'Puzzle groß', art: 'Puzzle', alterAb: 6 }),
    neuesSpielzeug({ name: 'Puzzle klein', art: 'Puzzle', alterAb: 3 }),
    neuesSpielzeug({ name: 'Puzzle ohne Alter', art: 'Puzzle' }),
    neuesSpielzeug({ name: 'Puzzle drei', art: 'Puzzle', alterAb: 3 }),
  ]);
  assert.deepEqual(chips, [
    { text: 'ab 3 J.', passform: null },
    { text: 'ab 6 J.', passform: null },
  ]);
});

/* --- Was die Liste zeigt ---------------------------------------------------- */

test('mehrere Arten: Gruppen, eine Art mit nur einem Eintrag als Einzelkarte', () => {
  const einzelneShorts = teil('Shorts', 'unterteile');
  const ergebnis = zusammenfassen([hose('a', 104), hose('b', 110), einzelneShorts]);

  assert.equal(ergebnis.einzeln, false);
  assert.equal(ergebnis.eintraege.length, 2);
  assert.equal(ergebnis.eintraege[0].gruppe.art, 'Badehose');
  assert.equal(ergebnis.eintraege[1].teil, einzelneShorts);
});

test('gehören alle Ergebnisse zu einer Art, wird direkt einzeln gezeigt', () => {
  const ergebnis = zusammenfassen([hose('Badehose rot', 110), hose('Badehose blau', 104)]);
  assert.equal(ergebnis.einzeln, true);
  assert.deepEqual(ergebnis.eintraege.map((e) => e.teil.name), ['Badehose blau', 'Badehose rot']);
});

test('eine einzige Art mit einem Eintrag und eine leere Liste sind einzeln', () => {
  assert.equal(zusammenfassen([hose('a', 104)]).einzeln, true);
  assert.deepEqual(zusammenfassen([]), { einzeln: true, eintraege: [] });
});

test('Spielzeug wird ebenfalls nach Art gruppiert', () => {
  const ergebnis = zusammenfassen([
    neuesSpielzeug({ name: 'Puzzle A', art: 'Puzzle', alterAb: 3 }),
    neuesSpielzeug({ name: 'Puzzle B', art: 'Puzzle', alterAb: 4 }),
    neuesSpielzeug({ name: 'Lego', art: 'Lego', alterAb: 4 }),
  ]);
  assert.equal(ergebnis.einzeln, false);
  const puzzle = ergebnis.eintraege.find((e) => e.gruppe)?.gruppe;
  assert.equal(puzzle.art, 'Puzzle');
  assert.deepEqual(puzzle.werte.map((w) => w.text), ['ab 3 J.', 'ab 4 J.']);
});
