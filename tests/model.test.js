import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  aktuelleJahreszeit,
  groessenSystemFuer,
  groessenWerte,
  kleidungsKategorien,
  neuesKleidungsteil,
  neuesSpielzeug,
  pruefeTeil,
} from '../js/model.js';

/* --- Konstanten und Hilfsfunktionen -------------------------------------- */

test('Konfektionsgrößen laufen von 50 bis 164 in 6er-Schritten', () => {
  const werte = groessenWerte('konfektion');
  assert.equal(werte[0], 50);
  assert.equal(werte.at(-1), 164);
  assert.equal(werte[1] - werte[0], 6);
});

test('Socken nutzen die Schuhgröße, Handschuhe die Handschuhgröße', () => {
  assert.equal(groessenSystemFuer('unterteile', 'Socken'), 'schuh');
  assert.equal(groessenSystemFuer('unterteile', 'Hose'), 'konfektion');
  assert.equal(groessenSystemFuer('muetzen', 'Handschuhe'), 'handschuh');
  assert.equal(groessenSystemFuer('muetzen', 'Fäustlinge'), 'handschuh');
  assert.equal(groessenSystemFuer('muetzen', 'Mütze'), 'kopf');
});

test('es gibt fünf Kleidungs-Kategorien ohne Spielzeug', () => {
  const ids = kleidungsKategorien().map((k) => k.id);
  assert.equal(ids.length, 5);
  assert.ok(!ids.includes('spielzeug'));
});

test('aktuelle Jahreszeit folgt den Monaten aus CLAUDE.md', () => {
  assert.equal(aktuelleJahreszeit(new Date(2026, 2, 15)), 'fruehling'); // März
  assert.equal(aktuelleJahreszeit(new Date(2026, 6, 1)), 'sommer');     // Juli
  assert.equal(aktuelleJahreszeit(new Date(2026, 9, 13)), 'herbst');    // Oktober
  assert.equal(aktuelleJahreszeit(new Date(2026, 11, 24)), 'winter');   // Dezember
  assert.equal(aktuelleJahreszeit(new Date(2026, 0, 2)), 'winter');     // Januar
});

/* --- Fabriken ------------------------------------------------------------- */

test('neues Kleidungsteil hat die Standardwerte aus dem Datenmodell', () => {
  const teil = neuesKleidungsteil();
  assert.equal(teil.anzahl, 1);
  assert.equal(teil.aussortiert, false);
  assert.equal(teil.typ, 'kleidung');
  assert.ok(teil.id.length > 0);
  assert.ok(teil.hinzugefuegtAm);
  assert.ok(teil.geaendertAm);
});

test('neues Spielzeug gehört zur Kategorie Spielzeug', () => {
  const teil = neuesSpielzeug();
  assert.equal(teil.typ, 'spielzeug');
  assert.equal(teil.kategorie, 'spielzeug');
  assert.equal(teil.anzahl, 1);
});

/* --- Validierung ---------------------------------------------------------- */

function gueltigesKleidungsteil(werte = {}) {
  return neuesKleidungsteil({
    name: 'Regenjacke gelb',
    kategorie: 'oberteile',
    art: 'Regenjacke',
    groesse: { system: 'konfektion', von: 98, bis: 104 },
    jahreszeiten: ['herbst'],
    passform: 'passt_gut',
    ...werte,
  });
}

function gueltigesSpielzeug(werte = {}) {
  return neuesSpielzeug({ name: 'Steckpuzzle Tiere', art: 'Puzzle', ...werte });
}

test('ein vollständiges Kleidungsteil ist fehlerfrei', () => {
  assert.deepEqual(pruefeTeil(gueltigesKleidungsteil()), []);
});

test('ein vollständiges Spielzeug ist fehlerfrei', () => {
  assert.deepEqual(pruefeTeil(gueltigesSpielzeug()), []);
});

test('Kleidung braucht Größe, Jahreszeit und Passform', () => {
  const ohneGroesse = pruefeTeil(gueltigesKleidungsteil({ groesse: null }));
  assert.ok(ohneGroesse.some((f) => f.includes('Größe fehlt')));

  const ohneJahreszeit = pruefeTeil(gueltigesKleidungsteil({ jahreszeiten: [] }));
  assert.ok(ohneJahreszeit.some((f) => f.includes('Jahreszeit')));

  const ohnePassform = pruefeTeil(gueltigesKleidungsteil({ passform: null }));
  assert.ok(ohnePassform.some((f) => f.includes('Passform')));
});

test('Größensystem muss zur Kategorie passen', () => {
  const fehler = pruefeTeil(gueltigesKleidungsteil({
    kategorie: 'schuhe',
    art: 'Gummistiefel',
    groesse: { system: 'konfektion', von: 98, bis: 98 },
  }));
  assert.ok(fehler.some((f) => f.includes('Größensystem passt nicht')));
});

test('Größe außerhalb des Wertebereichs wird erkannt', () => {
  const fehler = pruefeTeil(gueltigesKleidungsteil({
    groesse: { system: 'konfektion', von: 20, bis: 20 },
  }));
  assert.ok(fehler.some((f) => f.includes('außerhalb')));
});

test('Socken dürfen die Schuhgröße verwenden', () => {
  const teil = gueltigesKleidungsteil({
    kategorie: 'unterteile',
    art: 'Socken',
    groesse: { system: 'schuh', von: 23, bis: 26 },
  });
  assert.deepEqual(pruefeTeil(teil), []);
});

test('Spielzeug hat keine Größe, Jahreszeiten oder Passform', () => {
  const fehler = pruefeTeil(gueltigesSpielzeug({
    groesse: { system: 'konfektion', von: 98, bis: 98 },
    jahreszeiten: ['sommer'],
    passform: 'passt_gut',
  }));
  assert.ok(fehler.some((f) => f.includes('keine Größe')));
  assert.ok(fehler.some((f) => f.includes('keine Jahreszeiten')));
  assert.ok(fehler.some((f) => f.includes('keine Passform')));
});

test('Marke nur bei Merkmal Marke', () => {
  const ohneMarke = pruefeTeil(gueltigesKleidungsteil({ merkmal: 'marke', marke: '' }));
  assert.ok(ohneMarke.some((f) => f.includes('muss eine Marke')));

  const falscheMarke = pruefeTeil(gueltigesKleidungsteil({
    merkmal: 'blanko',
    marke: 'Paw Patrol',
  }));
  assert.ok(falscheMarke.some((f) => f.includes('nur bei Merkmal')));

  assert.deepEqual(
    pruefeTeil(gueltigesKleidungsteil({ merkmal: 'marke', marke: 'Paw Patrol' })),
    [],
  );
});

test('Anzahl muss eine ganze Zahl ab 1 sein', () => {
  for (const anzahl of [0, -1, 1.5, '3', null]) {
    const fehler = pruefeTeil(gueltigesKleidungsteil({ anzahl }));
    assert.ok(fehler.some((f) => f.includes('Anzahl')), `Anzahl ${anzahl} muss auffallen`);
  }
  assert.deepEqual(pruefeTeil(gueltigesKleidungsteil({ anzahl: 10 })), []);
});

test('Name und Art sind Pflicht', () => {
  assert.ok(pruefeTeil(gueltigesKleidungsteil({ name: '   ' })).some((f) => f.includes('Name')));
  assert.ok(pruefeTeil(gueltigesKleidungsteil({ art: '' })).some((f) => f.includes('Art')));
});

test('Einzelpreis muss ein ganzzahliger Centbetrag sein', () => {
  assert.deepEqual(
    pruefeTeil(gueltigesKleidungsteil({ preis: { art: 'einzeln', betrag: 800 } })),
    [],
  );
  assert.ok(
    pruefeTeil(gueltigesKleidungsteil({ preis: { art: 'einzeln', betrag: 8.5 } }))
      .some((f) => f.includes('Cent')),
  );
  assert.ok(
    pruefeTeil(gueltigesKleidungsteil({ preis: { art: 'sammelkauf' } }))
      .some((f) => f.includes('Sammelkauf')),
  );
});

test('kein Objekt gibt eine verständliche Meldung', () => {
  assert.deepEqual(pruefeTeil(null), ['Teil fehlt oder ist kein Objekt.']);
});
