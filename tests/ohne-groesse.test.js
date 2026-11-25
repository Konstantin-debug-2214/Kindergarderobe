/**
 * Auftrag 14: Größe in "Sets & Sonstiges" optional, Größen-Treffer aus der
 * Statistik nur in Konfektion.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  groesseOptional,
  KATEGORIEN_GROESSE_OPTIONAL,
  kleidungsKategorien,
  neuesKleidungsteil,
  pruefeTeil,
  pruefeTeilAusfuehrlich,
} from '../js/model.js';
import {
  groessenChips,
  gruppiereNachArt,
  leererFilter,
  teilPasstZuFilter,
  vorhandeneFilterwerte,
} from '../js/filters.js';
import { groesseNachTipp, teilAusEntwurf, entwurfAusTeil } from '../js/formular.js';
import { erstelleBackup, pruefeImport, spieleImportEin } from '../js/backup.js';
import { erstelleSpeicher, speicherImArbeitsspeicher } from '../js/storage.js';

const konf = (von, bis = von) => ({ system: 'konfektion', von, bis });

function bettwaesche(werte = {}) {
  return neuesKleidungsteil({
    name: 'Bettwäsche Sterne',
    kategorie: 'sets_sonstiges',
    art: 'Bettwäsche',
    groesse: null,
    jahreszeiten: ['herbst', 'winter'],
    passform: 'passt_gut',
    ...werte,
  });
}

/* --- Validierung ----------------------------------------------------------- */

test('die Regel steht als Konstante: nur Sets & Sonstiges ohne Größe', () => {
  assert.deepEqual(KATEGORIEN_GROESSE_OPTIONAL, ['sets_sonstiges']);
  assert.equal(groesseOptional('sets_sonstiges'), true);
  for (const k of kleidungsKategorien().filter((x) => x.id !== 'sets_sonstiges')) {
    assert.equal(groesseOptional(k.id), false, k.id);
  }
});

test('Sets & Sonstiges ohne Größe ist gültig, auch mit eigener Art', () => {
  assert.deepEqual(pruefeTeil(bettwaesche()), []);
  assert.deepEqual(pruefeTeil(bettwaesche({ art: 'Schlafsack' })), []);
  // Ein fehlendes Feld zählt wie null.
  const ohneFeld = bettwaesche();
  delete ohneFeld.groesse;
  assert.deepEqual(pruefeTeil(ohneFeld), []);
});

test('in allen anderen Kleidungs-Kategorien fehlt die Größe am Feld', () => {
  for (const [kategorie, art] of [['oberteile', 'Pullover'], ['unterteile', 'Hose'],
    ['schuhe', 'Sneaker'], ['muetzen', 'Mütze']]) {
    const fehler = pruefeTeilAusfuehrlich(bettwaesche({ kategorie, art }));
    assert.deepEqual(fehler, [{ feld: 'groesse', text: 'Größe fehlt.' }], kategorie);
  }
});

test('eine angegebene Größe in Sets & Sonstiges wird weiter geprüft', () => {
  assert.deepEqual(pruefeTeil(bettwaesche({ groesse: konf(98, 104) })), []);
  const falschesSystem = pruefeTeil(bettwaesche({ groesse: { system: 'schuh', von: 25, bis: 25 } }));
  assert.ok(falschesSystem.some((f) => f.includes('passt nicht zur Kategorie')));
  assert.ok(pruefeTeil(bettwaesche({ groesse: konf(30) })).some((f) => f.includes('außerhalb')));
  assert.ok(pruefeTeil(bettwaesche({ groesse: konf(110, 98) })).some((f) => f.includes('von darf')));
  assert.ok(pruefeTeil(bettwaesche({ groesse: 'groß' })).some((f) => f.includes('Größe fehlt')));
});

test('Jahreszeit und Passform bleiben auch ohne Größe Pflicht', () => {
  assert.ok(pruefeTeil(bettwaesche({ jahreszeiten: [] })).some((f) => f.includes('Jahreszeit')));
  assert.ok(pruefeTeil(bettwaesche({ passform: null })).some((f) => f.includes('Passform')));
});

/* --- Formular -------------------------------------------------------------- */

test('ein Tipp auf die gewählte Größe wählt sie nur in Sets & Sonstiges ab', () => {
  assert.equal(groesseNachTipp('sets_sonstiges', 'konfektion', konf(104), 104), null);
  assert.deepEqual(groesseNachTipp('oberteile', 'konfektion', konf(104), 104), konf(104));
  // Eine andere Größe wählt um, eine Doppelgröße gilt nicht als dieselbe.
  assert.deepEqual(groesseNachTipp('sets_sonstiges', 'konfektion', konf(104), 110), konf(110));
  assert.deepEqual(groesseNachTipp('sets_sonstiges', 'konfektion', konf(98, 104), 104), konf(104));
  assert.deepEqual(groesseNachTipp('sets_sonstiges', 'konfektion', null, 98), konf(98));
});

test('ein Teil ohne Größe übersteht Entwurf und Speichern', () => {
  const teil = teilAusEntwurf(entwurfAusTeil(bettwaesche()));
  assert.equal(teil.groesse, null);
  assert.deepEqual(pruefeTeil(teil), []);
});

/* --- Backup ---------------------------------------------------------------- */

test('ein Backup mit einem Teil ohne Größe wird angenommen und eingespielt', () => {
  const quelle = erstelleSpeicher(speicherImArbeitsspeicher());
  quelle.teilAnlegen(bettwaesche());
  const { inhalt } = erstelleBackup(quelle.zustand(), new Date('2026-11-25T08:00:00.000Z'));
  assert.equal(inhalt.version, 1);

  const ergebnis = pruefeImport({ dateiname: 'b.json', text: JSON.stringify(inhalt) });
  assert.equal(ergebnis.ok, true, ergebnis.fehler);

  const ziel = erstelleSpeicher(speicherImArbeitsspeicher());
  spieleImportEin(ziel, ergebnis);
  assert.equal(ziel.teile().length, 1);
  assert.equal(ziel.teile()[0].groesse, null);
  assert.equal(ziel.teile()[0].name, 'Bettwäsche Sterne');
});

test('ein Backup mit einem Oberteil ohne Größe wird abgelehnt', () => {
  const quelle = erstelleSpeicher(speicherImArbeitsspeicher());
  quelle.teilAnlegen(bettwaesche());
  const { inhalt } = erstelleBackup(quelle.zustand(), new Date('2026-11-25T08:00:00.000Z'));
  inhalt.daten.teile[0].kategorie = 'oberteile';
  inhalt.daten.teile[0].art = 'Pullover';

  const ergebnis = pruefeImport({ dateiname: 'b.json', text: JSON.stringify(inhalt) });
  assert.equal(ergebnis.ok, false);
});

/* --- Filter und Gruppen ---------------------------------------------------- */

test('bei gesetztem Größenfilter erscheinen Teile ohne Größe nicht', () => {
  assert.equal(teilPasstZuFilter(bettwaesche(), leererFilter()), true);
  assert.equal(teilPasstZuFilter(bettwaesche(), { ...leererFilter(), groessen: [104] }), false);
  assert.equal(teilPasstZuFilter(bettwaesche(), { ...leererFilter(), jahreszeiten: ['winter'] }), true);
  assert.deepEqual(vorhandeneFilterwerte([bettwaesche()]).groessen, []);
});

test('in der Gruppe zählen Teile ohne Größe mit, bekommen aber keinen Chip', () => {
  const teile = [
    bettwaesche({ name: 'A', anzahl: 2 }),
    bettwaesche({ name: 'B', groesse: konf(104), passform: 'bald_zu_klein' }),
  ];
  assert.deepEqual(groessenChips(teile), [{ text: '104', passform: 'bald_zu_klein' }]);
  assert.deepEqual(groessenChips([bettwaesche()]), []);

  const [gruppe] = gruppiereNachArt(teile);
  assert.equal(gruppe.stueck, 3);
  assert.deepEqual(gruppe.werte, [{ text: '104', passform: 'bald_zu_klein' }]);
});
