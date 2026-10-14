import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  artNachKategoriewechsel,
  artPasst,
  entwurfAusTeil,
  entwurfGeaendert,
  entwurfMitTyp,
  gaengigeGroessen,
  groesseNachWechsel,
  groessePasst,
  groesseText,
  leererEntwurf,
  preisEinzeln,
  sammelkaeufe,
  teilAusEntwurf,
} from '../js/formular.js';
import { GROESSENSYSTEME, pruefeTeil } from '../js/model.js';
import { euroTextInCent } from '../js/costs.js';

/* --- Größen-Schnellauswahl ------------------------------------------------ */

test('die Schnellauswahl liefert je Größensystem passende Werte', () => {
  assert.ok(gaengigeGroessen('konfektion').includes(110));
  assert.ok(gaengigeGroessen('schuh').includes(28));
  assert.ok(gaengigeGroessen('kopf').includes(52));
  assert.deepEqual(gaengigeGroessen('handschuh'), [0, 1, 2, 3, 4, 5, 6]);
});

test('alle Werte der Schnellauswahl liegen im erlaubten Bereich', () => {
  for (const system of Object.keys(GROESSENSYSTEME)) {
    const grenzen = GROESSENSYSTEME[system];
    for (const wert of gaengigeGroessen(system)) {
      assert.ok(wert >= grenzen.von && wert <= grenzen.bis,
        `${system}: ${wert} liegt außerhalb von ${grenzen.von}–${grenzen.bis}`);
    }
  }
});

test('die Schnellauswahl ist aufsteigend und ohne Doppelte', () => {
  for (const system of Object.keys(GROESSENSYSTEME)) {
    const werte = gaengigeGroessen(system);
    assert.deepEqual(werte, [...werte].sort((a, b) => a - b), `${system} nicht sortiert`);
    assert.equal(new Set(werte).size, werte.length, `${system} enthält Doppelte`);
  }
});

test('ein unbekanntes System liefert eine leere Auswahl', () => {
  assert.deepEqual(gaengigeGroessen('gibt-es-nicht'), []);
});

/* --- Größe als Text ------------------------------------------------------- */

test('Größen werden lesbar geschrieben', () => {
  assert.equal(groesseText({ system: 'konfektion', von: 110, bis: 110 }), '110');
  assert.equal(groesseText({ system: 'konfektion', von: 98, bis: 104 }), '98/104');
  assert.equal(groesseText({ system: 'schuh', von: 23, bis: 26 }), '23–26');
  assert.equal(groesseText({ system: 'schuh', von: 28, bis: 28 }), '28');
  assert.equal(groesseText({ system: 'kopf', von: 52, bis: 52 }), '52 cm');
  assert.equal(groesseText(null), '');
  assert.equal(groesseText({ system: 'konfektion' }), '');
});

/* --- Art beim Kategoriewechsel -------------------------------------------- */

test('eine Art gehört nur zu ihrer Kategorie', () => {
  assert.equal(artPasst('oberteile', 'Pullover'), true);
  assert.equal(artPasst('unterteile', 'Pullover'), false);
  assert.equal(artPasst('oberteile', ''), false);
});

test('eine eigene Art gilt immer als passend', () => {
  assert.equal(artPasst('oberteile', 'Poncho', true), true);
  assert.equal(artPasst('oberteile', 'Poncho', false), false);
});

test('beim Kategoriewechsel wird eine unpassende Art zurückgesetzt', () => {
  assert.equal(artNachKategoriewechsel('unterteile', 'Pullover'), '');
  assert.equal(artNachKategoriewechsel('schuhe', 'Jeans'), '');
});

test('eine Art, die es in beiden Kategorien gibt, bleibt stehen', () => {
  // "Sonstiges" steht in Sets & Sonstiges.
  assert.equal(artNachKategoriewechsel('sets_sonstiges', 'Sonstiges'), 'Sonstiges');
});

test('eine eigene Art überlebt den Kategoriewechsel', () => {
  assert.equal(artNachKategoriewechsel('schuhe', 'Poncho', true), 'Poncho');
});

/* --- Größe beim Wechsel von Kategorie oder Art ---------------------------- */

test('die Größe bleibt, solange das Größensystem gleich ist', () => {
  const groesse = { system: 'konfektion', von: 110, bis: 110 };
  assert.equal(groessePasst('oberteile', 'Pullover', groesse), true);
  assert.equal(groesseNachWechsel('unterteile', 'Hose', groesse), groesse);
});

test('die Größe fällt weg, wenn das System wechselt', () => {
  const konfektion = { system: 'konfektion', von: 110, bis: 110 };
  // Socken werden in Schuhgröße geführt.
  assert.equal(groessePasst('unterteile', 'Socken', konfektion), false);
  assert.equal(groesseNachWechsel('unterteile', 'Socken', konfektion), null);
  // Von Mütze (Kopfumfang) auf Handschuhe (Handschuhgröße).
  const kopf = { system: 'kopf', von: 52, bis: 52 };
  assert.equal(groesseNachWechsel('muetzen', 'Handschuhe', kopf), null);
  assert.equal(groesseNachWechsel('muetzen', 'Beanie', kopf), kopf);
});

/* --- Entwurf -------------------------------------------------------------- */

test('ein leerer Entwurf startet mit Anzahl 1 und ohne Aussortierung', () => {
  const entwurf = leererEntwurf();
  assert.equal(entwurf.typ, 'kleidung');
  assert.equal(entwurf.anzahl, 1);
  assert.equal(entwurf.aussortiert, false);
  assert.equal(entwurf.eigeneArt, false);
});

test('eine Art außerhalb der Liste wird beim Bearbeiten als eigene erkannt', () => {
  assert.equal(entwurfAusTeil({ kategorie: 'oberteile', art: 'Poncho' }).eigeneArt, true);
  assert.equal(entwurfAusTeil({ kategorie: 'oberteile', art: 'Pullover' }).eigeneArt, false);
  assert.equal(entwurfAusTeil({ kategorie: 'oberteile', art: '' }).eigeneArt, false);
});

test('beim Umschalten auf Spielzeug bleiben die gemeinsamen Felder', () => {
  const kleidung = {
    ...leererEntwurf(),
    name: 'Etwas',
    anzahl: 3,
    notiz: 'Geschenk von Oma',
    merkmal: 'marke',
    marke: 'Paw Patrol',
    preis: preisEinzeln(1500),
    groesse: { system: 'konfektion', von: 110, bis: 110 },
    jahreszeiten: ['herbst'],
  };

  const spielzeug = entwurfMitTyp(kleidung, 'spielzeug');

  assert.equal(spielzeug.typ, 'spielzeug');
  assert.equal(spielzeug.kategorie, 'spielzeug');
  assert.equal(spielzeug.name, 'Etwas');
  assert.equal(spielzeug.anzahl, 3);
  assert.equal(spielzeug.notiz, 'Geschenk von Oma');
  assert.equal(spielzeug.marke, 'Paw Patrol');
  assert.deepEqual(spielzeug.preis, preisEinzeln(1500));
  assert.equal(spielzeug.art, '', 'die Art passt nicht mehr');
});

test('beim Umschalten auf Kleidung kommen Größe und Jahreszeiten zurück', () => {
  const spielzeug = { ...leererEntwurf('spielzeug'), name: 'Etwas', alterAb: 3, tags: ['Holz'] };
  const kleidung = entwurfMitTyp(spielzeug, 'kleidung');

  assert.equal(kleidung.typ, 'kleidung');
  assert.equal(kleidung.name, 'Etwas');
  assert.equal(kleidung.passform, 'passt_gut');
  assert.deepEqual(kleidung.jahreszeiten, []);
  assert.equal(kleidung.alterAb, undefined);
});

test('derselbe Typ lässt den Entwurf unverändert', () => {
  const entwurf = leererEntwurf();
  assert.equal(entwurfMitTyp(entwurf, 'kleidung'), entwurf);
});

/* --- Entwurf zu Teil ------------------------------------------------------ */

test('aus dem Entwurf wird ein gültiges Kleidungsteil', () => {
  const teil = teilAusEntwurf({
    ...leererEntwurf(),
    name: '  Regenjacke gelb  ',
    kategorie: 'oberteile',
    art: 'Regenjacke',
    groesse: { system: 'konfektion', von: 110, bis: 110 },
    jahreszeiten: ['herbst'],
  });

  assert.equal(teil.name, 'Regenjacke gelb', 'Leerzeichen werden entfernt');
  assert.equal(teil.eigeneArt, undefined, 'Formular-Felder landen nicht im Teil');
  assert.deepEqual(pruefeTeil(teil), []);
});

test('Spielzeug verliert Größe, Jahreszeiten und Passform', () => {
  const teil = teilAusEntwurf({
    ...leererEntwurf('spielzeug'),
    name: 'Steckpuzzle',
    art: 'Puzzle',
    groesse: { system: 'konfektion', von: 110, bis: 110 },
    jahreszeiten: ['sommer'],
    passform: 'passt_gut',
    tags: [' Holz ', '', '24 Teile'],
  });

  assert.equal(teil.groesse, undefined);
  assert.equal(teil.jahreszeiten, undefined);
  assert.equal(teil.passform, undefined);
  assert.deepEqual(teil.tags, ['Holz', '24 Teile'], 'leere Tags fallen weg');
  assert.deepEqual(pruefeTeil(teil), []);
});

test('ohne Merkmal Marke wird die Marke verworfen', () => {
  const teil = teilAusEntwurf({
    ...leererEntwurf(),
    name: 'Pulli',
    art: 'Pullover',
    groesse: { system: 'konfektion', von: 110, bis: 110 },
    jahreszeiten: ['winter'],
    merkmal: 'blanko',
    marke: 'Paw Patrol',
  });

  assert.equal(teil.marke, null);
  assert.deepEqual(pruefeTeil(teil), []);
});

/* --- Ungespeicherte Änderungen -------------------------------------------- */

test('ohne Eingabe gilt der Entwurf als unverändert', () => {
  const entwurf = leererEntwurf();
  assert.equal(entwurfGeaendert({ ...entwurf }, entwurf), false);
});

test('eine Eingabe macht den Entwurf geändert', () => {
  const entwurf = leererEntwurf();
  assert.equal(entwurfGeaendert({ ...entwurf, name: 'Pulli' }, entwurf), true);
  assert.equal(entwurfGeaendert({ ...entwurf, anzahl: 2 }, entwurf), true);
});

test('ein neuer Zeitstempel allein ist keine Änderung', () => {
  const entwurf = leererEntwurf();
  assert.equal(
    entwurfGeaendert({ ...entwurf, geaendertAm: '2099-01-01T00:00:00.000Z' }, entwurf),
    false,
  );
});

/* --- Preis ---------------------------------------------------------------- */

test('Eingaben mit Komma werden zu Cent – auch über das Formular', () => {
  assert.equal(euroTextInCent('12,50'), 1250);
  assert.deepEqual(preisEinzeln(euroTextInCent('12,50')), { art: 'einzeln', betrag: 1250 });
});

test('nur Ausgaben mit mehreren Teilen gelten als Sammelkauf', () => {
  const ausgaben = [
    { id: '1', bezeichnung: 'Einzelteil', datum: '2026-09-01', betrag: 800, anzahlTeile: 1 },
    { id: '2', bezeichnung: 'Flohmarkt', datum: '2026-09-12', betrag: 2500, anzahlTeile: 6 },
    { id: '3', bezeichnung: 'Basar', datum: '2026-08-15', betrag: 1850, anzahlTeile: 4 },
    { id: '4', bezeichnung: 'Ohne Angabe', datum: '2026-07-01', betrag: 500 },
  ];

  const gefunden = sammelkaeufe(ausgaben);

  assert.deepEqual(gefunden.map((a) => a.id), ['2', '3'], 'neueste zuerst');
});

test('ohne Ausgaben gibt es keine Sammelkäufe', () => {
  assert.deepEqual(sammelkaeufe([]), []);
  assert.deepEqual(sammelkaeufe(), []);
});
