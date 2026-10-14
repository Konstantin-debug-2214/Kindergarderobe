import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  anzahlFilter,
  einheit,
  einheitDativ,
  enthalteneGroessen,
  filterAktiv,
  groesseEnthaelt,
  imSchrank,
  leererFilter,
  passtZurSuche,
  sortiereNachName,
  stueck,
  suche,
  teileDerKategorie,
  teilPasstZuFilter,
  vorhandeneFilterwerte,
  wendeFilterAn,
  zaehleJeJahreszeit,
  zaehleJeKategorie,
} from '../js/filters.js';

/** Kleines Testinventar – deckt alle Fälle ab, die geprüft werden. */
function inventar() {
  return [
    {
      id: '1', typ: 'kleidung', name: 'Regenjacke gelb', kategorie: 'oberteile',
      art: 'Regenjacke', anzahl: 1, aussortiert: false,
      groesse: { system: 'konfektion', von: 110, bis: 110 },
      jahreszeiten: ['herbst', 'fruehling'], passform: 'passt_gut',
      merkmal: 'blanko', marke: null, notiz: 'von Oma',
    },
    {
      id: '2', typ: 'kleidung', name: 'Kapuzenpulli grau', kategorie: 'oberteile',
      art: 'Pullover', anzahl: 2, aussortiert: false,
      groesse: { system: 'konfektion', von: 98, bis: 104 },
      jahreszeiten: ['herbst', 'winter'], passform: 'bald_zu_klein',
      merkmal: 'marke', marke: 'Paw Patrol', notiz: '',
    },
    {
      id: '3', typ: 'kleidung', name: 'Socken bunt', kategorie: 'unterteile',
      art: 'Socken', anzahl: 10, aussortiert: false,
      groesse: { system: 'schuh', von: 23, bis: 26 },
      jahreszeiten: ['fruehling', 'sommer', 'herbst', 'winter'], passform: 'passt_gut',
      merkmal: 'blanko', marke: null, notiz: '',
    },
    {
      id: '4', typ: 'kleidung', name: 'Gummistiefel blau', kategorie: 'schuhe',
      art: 'Gummistiefel', anzahl: 1, aussortiert: false,
      groesse: { system: 'schuh', von: 28, bis: 28 },
      jahreszeiten: ['herbst'], passform: 'passt_gut',
      merkmal: 'aufdruck', marke: null, notiz: '',
    },
    {
      id: '5', typ: 'spielzeug', name: 'Lego Feuerwehr', kategorie: 'spielzeug',
      art: 'Lego', anzahl: 1, aussortiert: false, alterAb: 4,
      tags: ['Kunststoff'], merkmal: null, marke: null, notiz: 'Geschenk',
    },
    {
      id: '6', typ: 'spielzeug', name: 'Steckpuzzle Tiere', kategorie: 'spielzeug',
      art: 'Puzzle', anzahl: 1, aussortiert: false, alterAb: 2,
      tags: ['Holz', '24 Teile'], merkmal: null, marke: null, notiz: '',
    },
    {
      // Aussortiert – zählt nirgends mit.
      id: '7', typ: 'kleidung', name: 'Matschhose rot', kategorie: 'unterteile',
      art: 'Matschhose', anzahl: 5, aussortiert: true, aussortiertGrund: 'verschenkt',
      groesse: { system: 'konfektion', von: 104, bis: 104 },
      jahreszeiten: ['herbst'], passform: 'zu_klein',
      merkmal: 'blanko', marke: null, notiz: '',
    },
  ];
}

/* --- Zählen --------------------------------------------------------------- */

test('Aussortiertes fällt aus dem Schrank heraus', () => {
  assert.equal(imSchrank(inventar()).length, 6);
  assert.equal(imSchrank([]).length, 0);
});

test('gezählt wird nach Stück, nicht nach Einträgen', () => {
  assert.equal(stueck(imSchrank(inventar())), 1 + 2 + 10 + 1 + 1 + 1);
  assert.equal(stueck([]), 0);
});

test('die Stückzahl je Kategorie lässt Aussortiertes weg', () => {
  const zahlen = zaehleJeKategorie(inventar());
  assert.equal(zahlen.oberteile, 3, '1 + 2');
  assert.equal(zahlen.unterteile, 10, 'die aussortierte Matschhose zählt nicht mit');
  assert.equal(zahlen.schuhe, 1);
  assert.equal(zahlen.spielzeug, 2);
  assert.equal(zahlen.sets_sonstiges, 0);
  assert.equal(zahlen.muetzen, 0);
});

test('alle sechs Kategorien kommen vor, auch ohne Teile', () => {
  const zahlen = zaehleJeKategorie([]);
  assert.deepEqual(Object.keys(zahlen).sort(), [
    'muetzen', 'oberteile', 'schuhe', 'sets_sonstiges', 'spielzeug', 'unterteile',
  ]);
  assert.ok(Object.values(zahlen).every((wert) => wert === 0));
});

test('Jahreszeiten zählen nur Kleidung, ein Teil in mehreren', () => {
  const zahlen = zaehleJeJahreszeit(inventar());
  // Regenjacke 1 + Socken 10
  assert.equal(zahlen.fruehling, 11);
  // nur Socken 10
  assert.equal(zahlen.sommer, 10);
  // Regenjacke 1 + Pulli 2 + Socken 10 + Gummistiefel 1 (Matschhose ist aussortiert)
  assert.equal(zahlen.herbst, 14);
  // Pulli 2 + Socken 10
  assert.equal(zahlen.winter, 12);
});

test('Spielzeug taucht in keiner Jahreszeit auf', () => {
  const nurSpielzeug = inventar().filter((t) => t.typ === 'spielzeug');
  const zahlen = zaehleJeJahreszeit(nurSpielzeug);
  assert.ok(Object.values(zahlen).every((wert) => wert === 0));
});

test('Schuhe werden in Paar gezählt', () => {
  assert.equal(einheit('schuhe'), 'Paar');
  assert.equal(einheit('schuhe', 1), 'Paar');
  assert.equal(einheit('oberteile'), 'Teile');
  assert.equal(einheit('oberteile', 1), 'Teil');
});

test('im Dativ heißt es "von n Teilen" bzw. "von n Paar"', () => {
  assert.equal(einheitDativ('oberteile'), 'Teilen');
  assert.equal(einheitDativ('spielzeug'), 'Teilen');
  assert.equal(einheitDativ('schuhe'), 'Paar');
});

/* --- Größen --------------------------------------------------------------- */

test('eine Doppelgröße passt auf jede enthaltene Größe', () => {
  const doppel = { system: 'konfektion', von: 98, bis: 104 };
  assert.equal(groesseEnthaelt(doppel, 98), true);
  assert.equal(groesseEnthaelt(doppel, 104), true);
  assert.equal(groesseEnthaelt(doppel, 110), false);
  assert.equal(groesseEnthaelt(doppel, 92), false);
});

test('eine Spanne passt auf jede Größe dazwischen', () => {
  const spanne = { system: 'schuh', von: 23, bis: 26 };
  for (const wert of [23, 24, 25, 26]) {
    assert.equal(groesseEnthaelt(spanne, wert), true, `${wert} muss passen`);
  }
  assert.equal(groesseEnthaelt(spanne, 22), false);
  assert.equal(groesseEnthaelt(spanne, 27), false);
});

test('ohne Größe passt nichts', () => {
  assert.equal(groesseEnthaelt(null, 98), false);
  assert.equal(groesseEnthaelt({ system: 'konfektion', von: 98, bis: 98 }, null), false);
});

test('enthaltene Größen folgen den Schritten des Systems', () => {
  assert.deepEqual(enthalteneGroessen({ system: 'konfektion', von: 98, bis: 104 }), [98, 104]);
  assert.deepEqual(enthalteneGroessen({ system: 'konfektion', von: 110, bis: 110 }), [110]);
  assert.deepEqual(enthalteneGroessen({ system: 'schuh', von: 23, bis: 26 }), [23, 24, 25, 26]);
  assert.deepEqual(enthalteneGroessen(null), []);
});

/* --- Suche ---------------------------------------------------------------- */

test('die Suche findet in Name, Art, Marke, Notiz und freien Merkmalen', () => {
  const [jacke, pulli, , , lego, puzzle] = inventar();
  assert.equal(passtZurSuche(jacke, 'regen'), true, 'Name');
  assert.equal(passtZurSuche(jacke, 'Regenjacke'), true, 'Art');
  assert.equal(passtZurSuche(jacke, 'oma'), true, 'Notiz');
  assert.equal(passtZurSuche(pulli, 'paw'), true, 'Marke');
  assert.equal(passtZurSuche(puzzle, 'holz'), true, 'freies Merkmal');
  assert.equal(passtZurSuche(lego, 'puzzle'), false);
});

test('Groß- und Kleinschreibung spielt keine Rolle', () => {
  const [jacke] = inventar();
  assert.equal(passtZurSuche(jacke, 'REGENJACKE'), true);
  assert.equal(passtZurSuche(jacke, 'rEgEn'), true);
});

test('ein leerer Suchbegriff passt immer', () => {
  const [jacke] = inventar();
  assert.equal(passtZurSuche(jacke, ''), true);
  assert.equal(passtZurSuche(jacke, '   '), true);
  assert.equal(passtZurSuche(jacke, undefined), true);
});

test('die Suche übergeht Aussortiertes und sortiert nach Name', () => {
  assert.deepEqual(suche(inventar(), 'hose').map((t) => t.name), [],
    'die aussortierte Matschhose wird nicht gefunden');

  const treffer = suche(inventar(), 'e').map((t) => t.name);
  assert.deepEqual(treffer, [...treffer].sort((a, b) => a.localeCompare(b, 'de')));
});

test('ohne Begriff kommen alle Teile im Schrank', () => {
  assert.equal(suche(inventar(), '').length, 6);
});

test('alphabetisch sortiert wird nach deutschen Regeln', () => {
  const namen = sortiereNachName([{ name: 'Öljacke' }, { name: 'Anorak' }, { name: 'Pulli' }])
    .map((t) => t.name);
  assert.deepEqual(namen, ['Anorak', 'Öljacke', 'Pulli']);
});

/* --- Filter --------------------------------------------------------------- */

test('ohne Filter bleiben alle Teile sichtbar', () => {
  const teile = imSchrank(inventar());
  assert.equal(wendeFilterAn(teile, leererFilter()).length, teile.length);
  assert.equal(filterAktiv(leererFilter()), false);
  assert.equal(anzahlFilter(leererFilter()), 0);
});

test('innerhalb einer Gruppe gilt ODER', () => {
  const teile = imSchrank(inventar());
  const gefunden = wendeFilterAn(teile, { ...leererFilter(), passformen: ['passt_gut', 'bald_zu_klein'] });
  assert.deepEqual(gefunden.map((t) => t.id).sort(), ['1', '2', '3', '4']);
});

test('zwischen Gruppen gilt UND', () => {
  const teile = imSchrank(inventar());
  const gefunden = wendeFilterAn(teile, {
    ...leererFilter(),
    jahreszeiten: ['herbst'],
    passformen: ['bald_zu_klein'],
  });
  assert.deepEqual(gefunden.map((t) => t.id), ['2']);
});

test('der Jahreszeiten-Filter greift auch bei mehreren Jahreszeiten', () => {
  const teile = imSchrank(inventar());
  assert.deepEqual(
    wendeFilterAn(teile, { ...leererFilter(), jahreszeiten: ['sommer'] }).map((t) => t.id),
    ['3'],
  );
  assert.deepEqual(
    wendeFilterAn(teile, { ...leererFilter(), jahreszeiten: ['winter'] }).map((t) => t.id).sort(),
    ['2', '3'],
  );
});

test('der Größenfilter beachtet Doppelgrößen und Spannen', () => {
  const teile = imSchrank(inventar());
  // Der Pulli ist 98/104 und muss bei 98 wie bei 104 auftauchen.
  assert.deepEqual(wendeFilterAn(teile, { ...leererFilter(), groessen: [98] }).map((t) => t.id), ['2']);
  assert.deepEqual(wendeFilterAn(teile, { ...leererFilter(), groessen: [104] }).map((t) => t.id), ['2']);
  // Socken 23–26.
  assert.deepEqual(wendeFilterAn(teile, { ...leererFilter(), groessen: [25] }).map((t) => t.id), ['3']);
  assert.deepEqual(wendeFilterAn(teile, { ...leererFilter(), groessen: [110] }).map((t) => t.id), ['1']);
});

test('Merkmal und Marke sind eigene Gruppen und wirken zusammen', () => {
  const teile = imSchrank(inventar());
  assert.deepEqual(
    wendeFilterAn(teile, { ...leererFilter(), merkmale: ['blanko'] }).map((t) => t.id).sort(),
    ['1', '3'],
  );
  assert.deepEqual(
    wendeFilterAn(teile, { ...leererFilter(), marken: ['Paw Patrol'] }).map((t) => t.id),
    ['2'],
  );
  assert.deepEqual(
    wendeFilterAn(teile, { ...leererFilter(), merkmale: ['marke'], marken: ['Paw Patrol'] })
      .map((t) => t.id),
    ['2'],
  );
  assert.deepEqual(
    wendeFilterAn(teile, { ...leererFilter(), merkmale: ['blanko'], marken: ['Paw Patrol'] }),
    [],
    'Blanko und eine Marke schließen sich aus',
  );
});

test('der Art-Filter wirkt', () => {
  const teile = imSchrank(inventar());
  assert.deepEqual(
    wendeFilterAn(teile, { ...leererFilter(), arten: ['Socken', 'Pullover'] }).map((t) => t.id).sort(),
    ['2', '3'],
  );
});

test('der Alter-ab-Filter wirkt beim Spielzeug', () => {
  const teile = imSchrank(inventar());
  assert.deepEqual(wendeFilterAn(teile, { ...leererFilter(), alterAb: [4] }).map((t) => t.id), ['5']);
  assert.deepEqual(
    wendeFilterAn(teile, { ...leererFilter(), alterAb: [2, 4] }).map((t) => t.id).sort(),
    ['5', '6'],
  );
});

test('die Anzahl gesetzter Filter wird über alle Gruppen gezählt', () => {
  const filter = { ...leererFilter(), jahreszeiten: ['herbst'], groessen: [98, 104] };
  assert.equal(anzahlFilter(filter), 3);
  assert.equal(filterAktiv(filter), true);
});

test('ein einzelnes Teil lässt sich direkt prüfen', () => {
  const [jacke] = inventar();
  assert.equal(teilPasstZuFilter(jacke, { ...leererFilter(), jahreszeiten: ['herbst'] }), true);
  assert.equal(teilPasstZuFilter(jacke, { ...leererFilter(), jahreszeiten: ['winter'] }), false);
  assert.equal(teilPasstZuFilter(jacke), true, 'ohne Filter passt alles');
});

/* --- Vorhandene Filterwerte ----------------------------------------------- */

test('die Filterspalte zeigt nur vorkommende Werte', () => {
  const oberteile = teileDerKategorie(inventar(), 'oberteile');
  const werte = vorhandeneFilterwerte(oberteile);

  assert.deepEqual(werte.groessen, [98, 104, 110], 'die Doppelgröße liefert beide Werte');
  assert.deepEqual(werte.arten, ['Pullover', 'Regenjacke']);
  assert.deepEqual(werte.marken, ['Paw Patrol']);
  assert.deepEqual(werte.jahreszeiten, ['fruehling', 'herbst', 'winter'],
    'in der Reihenfolge der Jahreszeiten, nicht alphabetisch');
});

test('beim Spielzeug kommen die Alter-ab-Werte sortiert', () => {
  const spielzeug = teileDerKategorie(inventar(), 'spielzeug');
  const werte = vorhandeneFilterwerte(spielzeug);

  assert.deepEqual(werte.alterAb, [2, 4]);
  assert.deepEqual(werte.arten, ['Lego', 'Puzzle']);
  assert.deepEqual(werte.groessen, [], 'Spielzeug hat keine Größen');
});

test('ohne Teile gibt es keine Filterwerte', () => {
  const werte = vorhandeneFilterwerte([]);
  assert.deepEqual(werte.groessen, []);
  assert.deepEqual(werte.arten, []);
  assert.deepEqual(werte.marken, []);
  assert.deepEqual(werte.alterAb, []);
  assert.deepEqual(werte.jahreszeiten, []);
});

/* --- Teile einer Kategorie ------------------------------------------------ */

test('die Kategorie-Liste lässt Aussortiertes weg und sortiert', () => {
  assert.deepEqual(
    teileDerKategorie(inventar(), 'unterteile').map((t) => t.name),
    ['Socken bunt'],
  );
  assert.deepEqual(
    teileDerKategorie(inventar(), 'oberteile').map((t) => t.name),
    ['Kapuzenpulli grau', 'Regenjacke gelb'],
  );
  assert.deepEqual(teileDerKategorie(inventar(), 'muetzen'), []);
});
