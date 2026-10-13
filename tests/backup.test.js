import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  backupAlterInTagen,
  backupDateiname,
  backupFaellig,
  erstelleBackup,
  pruefeImport,
  spieleImportEin,
} from '../js/backup.js';
import { erstelleSpeicher, speicherImArbeitsspeicher } from '../js/storage.js';
import { neuesKleidungsteil, neuesSpielzeug } from '../js/model.js';

function neuerSpeicher() {
  return erstelleSpeicher(speicherImArbeitsspeicher());
}

function kleidungsteil(werte = {}) {
  return neuesKleidungsteil({
    name: 'Regenjacke gelb',
    kategorie: 'oberteile',
    art: 'Regenjacke',
    groesse: { system: 'konfektion', von: 110, bis: 110 },
    jahreszeiten: ['herbst'],
    ...werte,
  });
}

/** Baut eine gültige Backup-Datei als Text – ohne Datei auf der Platte. */
function backupText(anpassen = (inhalt) => inhalt) {
  const speicher = neuerSpeicher();
  speicher.teilAnlegen(kleidungsteil({ name: 'Regenjacke gelb', anzahl: 1 }));
  speicher.teilAnlegen(kleidungsteil({ name: 'Socken', kategorie: 'unterteile', art: 'Socken', groesse: { system: 'schuh', von: 23, bis: 26 }, anzahl: 10 }));
  speicher.teilAnlegen(neuesSpielzeug({ name: 'Lego Feuerwehr', art: 'Lego', anzahl: 1 }));
  speicher.markeAnlegen('Paw Patrol');
  speicher.nameSetzen('Mila');

  const { inhalt } = erstelleBackup(speicher.zustand(), new Date('2026-10-13T08:00:00.000Z'));
  return JSON.stringify(anpassen(structuredClone(inhalt)));
}

/* --- Erinnerung ----------------------------------------------------------- */

test('ein Backup ist fällig, sobald es eine Änderung gab', () => {
  assert.equal(backupFaellig({ aenderungenSeitBackup: 0 }), false);
  assert.equal(backupFaellig({ aenderungenSeitBackup: 1 }), true);
  assert.equal(backupFaellig({ aenderungenSeitBackup: 42 }), true);
  assert.equal(backupFaellig({}), false);
  assert.equal(backupFaellig(null), false);
});

test('das Alter des letzten Backups zählt ganze Tage', () => {
  const heute = new Date('2026-10-13T12:00:00');
  assert.equal(backupAlterInTagen('2026-10-13T06:00:00', heute), 0);
  assert.equal(backupAlterInTagen('2026-10-12T23:00:00', heute), 1);
  assert.equal(backupAlterInTagen('2026-08-15T09:00:00', heute), 59);
  assert.equal(backupAlterInTagen(null, heute), null);
  assert.equal(backupAlterInTagen('kein Datum', heute), null);
});

/* --- Export --------------------------------------------------------------- */

test('der Dateiname folgt dem Muster mit Datum', () => {
  assert.equal(backupDateiname(new Date(2026, 9, 13)), 'kindergarderobe-backup-2026-10-13.json');
  assert.equal(backupDateiname(new Date(2026, 0, 5)), 'kindergarderobe-backup-2026-01-05.json');
});

test('das Backup enthält Kennung, Version, Zeitpunkt und alle Daten', () => {
  const speicher = neuerSpeicher();
  speicher.teilAnlegen(kleidungsteil());
  speicher.nameSetzen('Mila');

  const { inhalt, text } = erstelleBackup(speicher.zustand(), new Date('2026-10-13T08:00:00.000Z'));

  assert.equal(inhalt.app, 'kindergarderobe');
  assert.equal(inhalt.version, 1);
  assert.equal(inhalt.erstelltAm, '2026-10-13T08:00:00.000Z');
  assert.equal(inhalt.daten.teile.length, 1);
  assert.equal(inhalt.daten.einstellungen.name, 'Mila');
  assert.ok(!('aenderungenSeitBackup' in inhalt.daten.einstellungen));
  assert.deepEqual(JSON.parse(text), inhalt, 'der Text ist dasselbe als JSON');
});

/* --- Import prüfen -------------------------------------------------------- */

test('eine gültige Datei ergibt eine passende Vorschau', () => {
  const ergebnis = pruefeImport({
    dateiname: 'kindergarderobe-backup-2026-10-13.json',
    text: backupText(),
  });

  assert.equal(ergebnis.ok, true);
  assert.equal(ergebnis.vorschau.dateiname, 'kindergarderobe-backup-2026-10-13.json');
  assert.equal(ergebnis.vorschau.erstelltAm, '2026-10-13T08:00:00.000Z');
  assert.equal(ergebnis.vorschau.teileStueck, 12, 'nach Stück gezählt: 1 + 10 + 1');
  assert.equal(ergebnis.vorschau.aussortiertStueck, 0);
  assert.equal(ergebnis.vorschau.markenAnzahl, 1);
  assert.equal(ergebnis.vorschau.name, 'Mila');
});

test('aussortierte Teile zählen in der Vorschau getrennt', () => {
  const speicher = neuerSpeicher();
  const teil = speicher.teilAnlegen(kleidungsteil({ anzahl: 3 }));
  speicher.teilAnlegen(kleidungsteil({ name: 'Bleibt', anzahl: 2 }));
  speicher.teilAussortieren(teil.id, 'zu_klein');

  const { text } = erstelleBackup(speicher.zustand());
  const ergebnis = pruefeImport({ dateiname: 'b.json', text });

  assert.equal(ergebnis.ok, true);
  assert.equal(ergebnis.vorschau.teileStueck, 2);
  assert.equal(ergebnis.vorschau.aussortiertStueck, 3);
});

test('die Vorschau nennt Anzahl und Summe der Kosten', () => {
  const speicher = neuerSpeicher();
  speicher.ausgabeAnlegen({ bezeichnung: 'Flohmarkt', datum: '2026-09-12', betrag: 2500, anzahlTeile: 6 });
  speicher.ausgabeAnlegen({ bezeichnung: 'Basar', datum: '2026-08-15', betrag: 1850, anzahlTeile: 4 });

  const { text } = erstelleBackup(speicher.zustand());
  const ergebnis = pruefeImport({ dateiname: 'b.json', text });

  assert.equal(ergebnis.vorschau.kostenAnzahl, 2);
  assert.equal(ergebnis.vorschau.kostenSumme, 4350);
});

test('eine beschädigte Datei wird abgelehnt', () => {
  const ergebnis = pruefeImport({ dateiname: 'kaputt.json', text: '{ das ist kein JSON' });
  assert.equal(ergebnis.ok, false);
  assert.match(ergebnis.fehler, /JSON/);
});

test('eine fremde Datei wird abgelehnt', () => {
  const fremd = JSON.stringify({ app: 'andere-app', version: 1, daten: { teile: [] } });
  const ergebnis = pruefeImport({ dateiname: 'fremd.json', text: fremd });
  assert.equal(ergebnis.ok, false);
  assert.match(ergebnis.fehler, /kein Backup der Kindergarderobe/);
});

test('ein Backup aus einer neueren Version wird abgelehnt', () => {
  const text = backupText((inhalt) => ({ ...inhalt, version: 2 }));
  const ergebnis = pruefeImport({ dateiname: 'neu.json', text });
  assert.equal(ergebnis.ok, false);
  assert.match(ergebnis.fehler, /neueren Version/);
});

test('fehlende Daten werden erkannt', () => {
  const ohneDaten = JSON.stringify({ app: 'kindergarderobe', version: 1 });
  assert.match(pruefeImport({ dateiname: 'b.json', text: ohneDaten }).fehler, /fehlen die Daten/);

  const ohneVersion = JSON.stringify({ app: 'kindergarderobe', daten: { teile: [] } });
  assert.match(pruefeImport({ dateiname: 'b.json', text: ohneVersion }).fehler, /Versionsangabe/);
});

test('fehlerhafte Teile im Backup werden benannt', () => {
  const text = backupText((inhalt) => {
    inhalt.daten.teile[0].name = '';
    inhalt.daten.teile[1].anzahl = 0;
    return inhalt;
  });

  const ergebnis = pruefeImport({ dateiname: 'b.json', text });

  assert.equal(ergebnis.ok, false);
  assert.match(ergebnis.fehler, /2 Teile/);
  assert.equal(ergebnis.einzelheiten.length, 2);
  assert.ok(ergebnis.einzelheiten.some((zeile) => zeile.includes('Name fehlt')));
  assert.ok(ergebnis.einzelheiten.some((zeile) => zeile.includes('Anzahl')));
});

test('ein leeres Backup ist gültig', () => {
  const leer = JSON.stringify({
    app: 'kindergarderobe',
    version: 1,
    erstelltAm: '2026-10-13T08:00:00.000Z',
    daten: { teile: [], ausgaben: [], marken: [], sollMengen: [], einstellungen: { name: '' } },
  });

  const ergebnis = pruefeImport({ dateiname: 'leer.json', text: leer });

  assert.equal(ergebnis.ok, true);
  assert.equal(ergebnis.vorschau.teileStueck, 0);
  assert.equal(ergebnis.vorschau.kostenSumme, 0);
});

/* --- Import einspielen ---------------------------------------------------- */

test('ein geprüftes Backup ersetzt alle aktuellen Daten', () => {
  const speicher = neuerSpeicher();
  speicher.teilAnlegen(kleidungsteil({ name: 'Wird ersetzt' }));
  speicher.nameSetzen('Noah');

  const ergebnis = pruefeImport({ dateiname: 'b.json', text: backupText() });
  spieleImportEin(speicher, ergebnis);

  assert.equal(speicher.teile().length, 3);
  assert.ok(!speicher.teile().some((t) => t.name === 'Wird ersetzt'));
  assert.equal(speicher.einstellungen().name, 'Mila');
  assert.deepEqual(speicher.marken(), ['Paw Patrol']);
});

test('nach dem Einspielen ist kein Backup mehr fällig', () => {
  const speicher = neuerSpeicher();
  speicher.teilAnlegen(kleidungsteil());
  assert.equal(backupFaellig(speicher.einstellungen()), true);

  spieleImportEin(speicher, pruefeImport({ dateiname: 'b.json', text: backupText() }));

  assert.equal(backupFaellig(speicher.einstellungen()), false);
  assert.equal(speicher.einstellungen().letztesBackupAm, '2026-10-13T08:00:00.000Z');
});

test('ein ungeprüftes Ergebnis lässt sich nicht einspielen', () => {
  const speicher = neuerSpeicher();
  assert.throws(() => spieleImportEin(speicher, { ok: false, fehler: 'kaputt' }));
});

test('Export und Import zusammen erhalten die Daten', () => {
  const original = neuerSpeicher();
  original.teilAnlegen(kleidungsteil({ name: 'Pulli', preis: { art: 'einzeln', betrag: 1500 } }));
  original.sollMengeSetzen('Pullover', 'winter', 3);
  original.nameSetzen('Mila');

  const { dateiname, text } = erstelleBackup(original.zustand());

  const ziel = neuerSpeicher();
  spieleImportEin(ziel, pruefeImport({ dateiname, text }));

  assert.deepEqual(ziel.teile(), original.teile());
  assert.deepEqual(ziel.ausgaben(), original.ausgaben());
  assert.deepEqual(ziel.sollMengen(), original.sollMengen());
  assert.equal(ziel.einstellungen().name, 'Mila');
});
