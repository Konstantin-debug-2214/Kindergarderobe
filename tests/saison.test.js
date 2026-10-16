import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  artenOhneZeile,
  baldZuKleinTeile,
  besorgen,
  checkSummen,
  fehlendeGesamt,
  kommendeJahreszeit,
  laufendeJahreszeit,
  naechsterBeginn,
  saisonHinweis,
  sollZeilen,
  standText,
  tageBis,
} from '../js/saison.js';

function teil(name, art, kategorie, anzahl, passform, jahreszeiten, weiteres = {}) {
  return {
    id: name, typ: 'kleidung', name, art, kategorie, anzahl, passform, jahreszeiten,
    groesse: { system: 'konfektion', von: 110, bis: 110 }, aussortiert: false, ...weiteres,
  };
}

/**
 * Der Bestand aus dem Design-Screenshot: Winterjacke 1, Pullover 3,
 * Thermohose 1, Muetze 2 passend; dazu zwei bald zu kleine Teile.
 */
function designBestand() {
  return [
    teil('Winterjacke blau', 'Winterjacke', 'oberteile', 1, 'passt_gut', ['winter']),
    teil('Pulli A', 'Pullover', 'oberteile', 2, 'passt_gut', ['winter']),
    teil('Pulli B', 'Pullover', 'oberteile', 1, 'passt_gut', ['winter']),
    teil('Thermohose grau', 'Thermohose', 'sets_sonstiges', 1, 'passt_gut', ['winter']),
    teil('Muetze rot', 'Mütze', 'muetzen', 2, 'passt_gut', ['winter']),
    // Zwei Teile, die bald zu klein sind.
    teil('Winterstiefel braun', 'Winterstiefel', 'schuhe', 1, 'bald_zu_klein', ['winter'],
      { groesse: { system: 'schuh', von: 28, bis: 28 } }),
    teil('Fleecepulli rot', 'Pullover', 'oberteile', 1, 'bald_zu_klein', ['winter'],
      { groesse: { system: 'konfektion', von: 104, bis: 104 } }),
    // Zaehlt nicht mit: zu klein, aussortiert, andere Jahreszeit, Spielzeug.
    teil('Zu klein', 'Pullover', 'oberteile', 5, 'zu_klein', ['winter']),
    teil('Weg', 'Pullover', 'oberteile', 7, 'passt_gut', ['winter'], { aussortiert: true }),
    teil('Sommerteil', 'T-Shirt', 'oberteile', 4, 'passt_gut', ['sommer']),
    { id: 'lego', typ: 'spielzeug', name: 'Lego', art: 'Lego', kategorie: 'spielzeug',
      anzahl: 3, aussortiert: false },
  ];
}

const designSoll = [
  { id: '1', art: 'Winterjacke', jahreszeit: 'winter', soll: 1 },
  { id: '2', art: 'Pullover', jahreszeit: 'winter', soll: 5 },
  { id: '3', art: 'Thermohose', jahreszeit: 'winter', soll: 2 },
  { id: '4', art: 'Mütze', jahreszeit: 'winter', soll: 1 },
  { id: '5', art: 'Handschuhe', jahreszeit: 'winter', soll: 2 },
  { id: '6', art: 'Winterstiefel', jahreszeit: 'winter', soll: 1 },
];

/* --- Die Beispielwerte des Designs ---------------------------------------- */

test('die Werte stimmen mit dem Design überein', () => {
  const zeilen = sollZeilen(designBestand(), designSoll, 'winter');
  const alsText = Object.fromEntries(
    zeilen.map((z) => [z.art, `${z.passend}/${z.soll} ${standText(z)}`]),
  );

  assert.deepEqual(alsText, {
    Winterjacke: '1/1 vollständig',
    Pullover: '3/5 noch 2 fehlen',
    Thermohose: '1/2 noch 1 fehlt',
    Winterstiefel: '0/1 noch 1 fehlt',
    'Mütze': '2/1 vollständig',
    Handschuhe: '0/2 noch 2 fehlen',
  });
});

test('die drei Summen stimmen mit dem Design überein', () => {
  const zeilen = sollZeilen(designBestand(), designSoll, 'winter');
  assert.deepEqual(checkSummen(zeilen), { istDa: 9, passt: 7, fehlt: 6 });
});

test('"Besorgen" nennt Art und Anzahl', () => {
  const zeilen = sollZeilen(designBestand(), designSoll, 'winter');
  assert.deepEqual(besorgen(zeilen), [
    { art: 'Pullover', fehlt: 2 },
    { art: 'Thermohose', fehlt: 1 },
    { art: 'Winterstiefel', fehlt: 1 },
    { art: 'Handschuhe', fehlt: 2 },
  ], 'in der Reihenfolge der Tabelle');
});

test('"Wird bald zu klein" listet die Teile mit Größe', () => {
  const teile = baldZuKleinTeile(designBestand(), 'winter');
  assert.deepEqual(teile.map((t) => t.name), ['Fleecepulli rot', 'Winterstiefel braun']);
  assert.equal(teile[1].groesse.von, 28);
});

/* --- Was nicht mitzählt ---------------------------------------------------- */

test('"Bald zu klein" und "Zu klein" zählen nicht als passend', () => {
  const zeilen = sollZeilen(designBestand(), designSoll, 'winter');
  const pullover = zeilen.find((z) => z.art === 'Pullover');
  assert.equal(pullover.passend, 3, 'nur die beiden "Passt gut"-Eintraege');
  assert.equal(pullover.baldZuKlein, 1);
});

test('"Zu klein" zählt auch nicht zu "ist da"', () => {
  const zeilen = sollZeilen(designBestand(), designSoll, 'winter');
  // 7 passend + 2 bald zu klein; die 5 zu kleinen Pullover fehlen.
  assert.equal(checkSummen(zeilen).istDa, 9);
});

test('Aussortiertes, andere Jahreszeiten und Spielzeug bleiben außen vor', () => {
  const zeilen = sollZeilen(designBestand(), designSoll, 'winter');
  assert.ok(!zeilen.some((z) => z.art === 'T-Shirt'), 'das Sommerteil fehlt');
  assert.ok(!zeilen.some((z) => z.art === 'Lego'), 'Spielzeug fehlt');
  assert.equal(zeilen.find((z) => z.art === 'Pullover').passend, 3, 'ohne die 7 aussortierten');
});

/* --- Zeilen ohne Soll ------------------------------------------------------ */

test('eine Art mit Teilen, aber ohne Soll, steht mit "kein Soll" dabei', () => {
  const zeilen = sollZeilen(designBestand(), [], 'winter');
  assert.ok(zeilen.every((z) => z.stand === 'kein_soll'));
  assert.equal(standText(zeilen[0]), 'kein Soll');
  assert.deepEqual(checkSummen(zeilen), { istDa: 0, passt: 0, fehlt: 0 },
    'ohne Soll zaehlt nichts in den Check');
});

test('ein Soll ohne passende Teile erzeugt trotzdem eine Zeile', () => {
  const zeilen = sollZeilen([], [{ art: 'Handschuhe', jahreszeit: 'winter', soll: 2 }], 'winter');
  assert.deepEqual(zeilen, [{
    art: 'Handschuhe', passend: 0, baldZuKlein: 0, soll: 2, fehlt: 2, stand: 'fehlt',
  }]);
});

test('ein Soll von 0 gilt als kein Soll', () => {
  const zeilen = sollZeilen(designBestand(),
    [{ art: 'Pullover', jahreszeit: 'winter', soll: 0 }], 'winter');
  assert.equal(zeilen.find((z) => z.art === 'Pullover').soll, null);
});

test('ein Soll einer anderen Jahreszeit wirkt nicht', () => {
  const zeilen = sollZeilen(designBestand(),
    [{ art: 'Pullover', jahreszeit: 'sommer', soll: 9 }], 'winter');
  assert.equal(zeilen.find((z) => z.art === 'Pullover').soll, null);
});

test('ohne alles bleibt die Tabelle leer', () => {
  assert.deepEqual(sollZeilen([], [], 'winter'), []);
  assert.deepEqual(checkSummen([]), { istDa: 0, passt: 0, fehlt: 0 });
  assert.deepEqual(besorgen([]), []);
});

/* --- Reihenfolge ----------------------------------------------------------- */

test('die Arten folgen der Reihenfolge aus model.js', () => {
  const zeilen = sollZeilen(designBestand(), designSoll, 'winter');
  // Oberteile (Pullover vor Winterjacke) vor Sets & Sonstiges vor Schuhen
  // vor Muetzen (Muetze vor Handschuhe) – so steht es in model.js.
  assert.deepEqual(zeilen.map((z) => z.art), [
    'Pullover', 'Winterjacke', 'Thermohose', 'Winterstiefel', 'Mütze', 'Handschuhe',
  ]);
});

test('eigene Arten stehen hinten und alphabetisch', () => {
  const teile = [
    teil('Poncho', 'Poncho', 'oberteile', 1, 'passt_gut', ['winter']),
    teil('Anorak', 'Anorak', 'oberteile', 1, 'passt_gut', ['winter']),
    teil('Pulli', 'Pullover', 'oberteile', 1, 'passt_gut', ['winter']),
  ];
  assert.deepEqual(sollZeilen(teile, [], 'winter').map((z) => z.art),
    ['Pullover', 'Anorak', 'Poncho']);
});

/* --- Saisonbeginn ---------------------------------------------------------- */

test('die laufende und die kommende Jahreszeit stimmen', () => {
  const imOktober = new Date(2026, 9, 13);
  assert.equal(laufendeJahreszeit(imOktober), 'herbst');
  assert.equal(kommendeJahreszeit(imOktober), 'winter');

  const imDezember = new Date(2026, 11, 20);
  assert.equal(laufendeJahreszeit(imDezember), 'winter');
  assert.equal(kommendeJahreszeit(imDezember), 'fruehling', 'nach Winter kommt Fruehling');
});

test('der nächste Beginn liegt immer in der Zukunft', () => {
  const imOktober = new Date(2026, 9, 13);
  assert.deepEqual(naechsterBeginn('winter', imOktober), new Date(2026, 11, 1));
  // Der Fruehling 2026 ist vorbei, also der von 2027.
  assert.deepEqual(naechsterBeginn('fruehling', imOktober), new Date(2027, 2, 1));
});

test('der Hinweis stimmt mit dem Design überein', () => {
  // Vom 13.10.2026 bis zum 1.12.2026 sind es 49 Tage, also 7 Wochen.
  const imOktober = new Date(2026, 9, 13);
  assert.equal(tageBis(naechsterBeginn('winter', imOktober), imOktober), 49);
  assert.equal(saisonHinweis('winter', imOktober).text, 'Winter · ab 1. Dezember · in 7 Wochen');
});

test('unter zwei Wochen wird in Tagen gezählt', () => {
  const kurzVorWinter = new Date(2026, 10, 25);
  assert.equal(saisonHinweis('winter', kurzVorWinter).text, 'Winter · ab 1. Dezember · in 6 Tagen');
});

test('die laufende Jahreszeit zeigt die Restzeit', () => {
  const imOktober = new Date(2026, 9, 13);
  const hinweis = saisonHinweis('herbst', imOktober);
  assert.equal(hinweis.laufend, true);
  assert.equal(hinweis.text, 'Herbst · läuft · noch 7 Wochen');
});

/* --- Etikett in der Statistik ---------------------------------------------- */

test('die Fehlenden der Jahreszeit ergeben das Etikett', () => {
  assert.equal(fehlendeGesamt(designBestand(), designSoll, 'winter'), 6);
  assert.equal(fehlendeGesamt(designBestand(), designSoll, 'sommer'), 0);
  assert.equal(fehlendeGesamt([], [], 'winter'), 0);
});

/* --- "+ Art" --------------------------------------------------------------- */

test('"+ Art" bietet nur Arten ohne Zeile an', () => {
  const zeilen = sollZeilen(designBestand(), designSoll, 'winter');
  const gruppen = artenOhneZeile(zeilen);

  const alle = gruppen.flatMap((g) => g.arten);
  assert.ok(!alle.includes('Pullover'), 'Pullover hat schon eine Zeile');
  assert.ok(alle.includes('T-Shirt'), 'T-Shirt noch nicht');
  assert.ok(!alle.includes('Lego'), 'Spielzeug gehoert nicht dazu');
  assert.equal(gruppen[0].kategorie, 'Oberteile', 'nach Kategorie gruppiert');
});

test('"+ Art" nimmt eigene Arten aus dem Bestand mit auf', () => {
  const gruppen = artenOhneZeile([], ['Poncho', 'Pullover', 'Poncho']);
  const eigene = gruppen.find((g) => g.kategorie === 'Eigene Arten');
  assert.deepEqual(eigene.arten, ['Poncho'], 'ohne Doppelte und ohne bekannte Arten');
});

test('ohne offene Arten bleibt die Auswahl leer', () => {
  const alleArten = artenOhneZeile([]).flatMap((g) => g.arten);
  const zeilen = alleArten.map((art) => ({ art }));
  assert.deepEqual(artenOhneZeile(zeilen), []);
});
