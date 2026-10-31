import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  erstelleSpeicher,
  OBERFLAECHE_SCHLUESSEL,
  ROHDATEN_SCHLUESSEL,
  speicherImArbeitsspeicher,
  SPEICHER_SCHLUESSEL,
  SpeicherFehler,
} from '../js/storage.js';
import { neuesKleidungsteil, neuesSpielzeug } from '../js/model.js';

/** Frischer Speicher je Test – ohne echtes localStorage. */
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

/* --- Grundzustand --------------------------------------------------------- */

test('beim ersten Start steht ein leerer Zustand bereit', () => {
  const speicher = neuerSpeicher();
  const zustand = speicher.zustand();
  assert.equal(zustand.version, 1);
  assert.deepEqual(zustand.teile, []);
  assert.deepEqual(zustand.ausgaben, []);
  assert.deepEqual(zustand.marken, []);
  assert.deepEqual(zustand.sollMengen, []);
  assert.equal(zustand.einstellungen.name, '');
  assert.equal(zustand.einstellungen.letztesBackupAm, null);
  assert.equal(zustand.einstellungen.aenderungenSeitBackup, 0);
});

test('Daten überleben eine neue Speicher-Instanz auf demselben Hintergrund', () => {
  const hintergrund = speicherImArbeitsspeicher();
  erstelleSpeicher(hintergrund).teilAnlegen(kleidungsteil({ name: 'Pulli' }));

  const zweiter = erstelleSpeicher(hintergrund);
  assert.equal(zweiter.teile().length, 1);
  assert.equal(zweiter.teile()[0].name, 'Pulli');
});

/* --- Teile ---------------------------------------------------------------- */

test('Teile anlegen, ändern, aussortieren und zurückholen', () => {
  const speicher = neuerSpeicher();
  const teil = speicher.teilAnlegen(kleidungsteil());

  assert.equal(speicher.teile().length, 1);
  assert.equal(speicher.teileImSchrank().length, 1);

  speicher.teilAendern(teil.id, { name: 'Regenjacke rot' });
  assert.equal(speicher.teil(teil.id).name, 'Regenjacke rot');

  speicher.teilAussortieren(teil.id, 'zu_klein');
  assert.equal(speicher.teil(teil.id).aussortiert, true);
  assert.equal(speicher.teil(teil.id).aussortiertGrund, 'zu_klein');
  assert.ok(speicher.teil(teil.id).aussortiertAm);
  assert.equal(speicher.teileImSchrank().length, 0);
  assert.equal(speicher.aussortierteTeile().length, 1);

  speicher.teilZurueckholen(teil.id);
  assert.equal(speicher.teil(teil.id).aussortiert, false);
  assert.equal(speicher.teil(teil.id).aussortiertGrund, null);
  assert.equal(speicher.teileImSchrank().length, 1);
});

test('Ändern setzt geaendertAm neu', async () => {
  const speicher = neuerSpeicher();
  const teil = speicher.teilAnlegen(kleidungsteil());
  const vorher = speicher.teil(teil.id).geaendertAm;

  await new Promise((fertig) => { setTimeout(fertig, 2); });
  speicher.teilAendern(teil.id, { name: 'Anderer Name' });

  assert.notEqual(speicher.teil(teil.id).geaendertAm, vorher);
});

test('ein unbekanntes Teil zu ändern gibt einen klaren Fehler', () => {
  const speicher = neuerSpeicher();
  assert.throws(() => speicher.teilAendern('gibt-es-nicht', { name: 'x' }), SpeicherFehler);
});

test('Aussortiert leeren löscht die Teile, behält aber die Ausgaben', () => {
  const speicher = neuerSpeicher();
  const teil = speicher.teilAnlegen(kleidungsteil({ preis: { art: 'einzeln', betrag: 1500 } }));
  const behalten = speicher.teilAnlegen(kleidungsteil({ name: 'Bleibt' }));

  assert.equal(speicher.ausgaben().length, 1);

  speicher.teilAussortieren(teil.id, 'kaputt');
  const geloescht = speicher.aussortiertLeeren();

  assert.equal(geloescht, 1);
  assert.equal(speicher.teile().length, 1);
  assert.equal(speicher.teile()[0].id, behalten.id);
  assert.equal(speicher.ausgaben().length, 1, 'die Ausgabe bleibt erhalten');
  assert.equal(speicher.ausgaben()[0].betrag, 1500);
});

/* --- Einzelpreis erzeugt eine Ausgabe ------------------------------------- */

test('ein Einzelpreis legt automatisch eine Ausgabe mit anzahlTeile 1 an', () => {
  const speicher = neuerSpeicher();
  const teil = speicher.teilAnlegen(kleidungsteil({
    name: 'Strickjacke senf',
    preis: { art: 'einzeln', betrag: 1500 },
  }));

  const ausgaben = speicher.ausgaben();
  assert.equal(ausgaben.length, 1);
  assert.equal(ausgaben[0].betrag, 1500);
  assert.equal(ausgaben[0].anzahlTeile, 1);
  assert.equal(ausgaben[0].bezeichnung, 'Strickjacke senf');
  assert.equal(speicher.teil(teil.id).preis.ausgabeId, ausgaben[0].id);
});

test('ein geänderter Einzelpreis aktualisiert dieselbe Ausgabe', () => {
  const speicher = neuerSpeicher();
  const teil = speicher.teilAnlegen(kleidungsteil({ preis: { art: 'einzeln', betrag: 1500 } }));
  const ausgabeId = speicher.teil(teil.id).preis.ausgabeId;

  speicher.teilAendern(teil.id, { preis: { art: 'einzeln', betrag: 900, ausgabeId } });

  assert.equal(speicher.ausgaben().length, 1, 'es entsteht keine zweite Ausgabe');
  assert.equal(speicher.ausgaben()[0].betrag, 900);
});

test('ein Sammelkauf legt keine zusätzliche Ausgabe an', () => {
  const speicher = neuerSpeicher();
  const ausgabe = speicher.ausgabeAnlegen({
    bezeichnung: 'Flohmarkt Kita',
    datum: '2026-09-12',
    betrag: 2500,
    anzahlTeile: 6,
  });

  speicher.teilAnlegen(kleidungsteil({
    preis: { art: 'sammelkauf', ausgabeId: ausgabe.id },
  }));

  assert.equal(speicher.ausgaben().length, 1);
});

test('eine gelöschte Ausgabe löst die Verknüpfung am Teil', () => {
  const speicher = neuerSpeicher();
  const ausgabe = speicher.ausgabeAnlegen({ bezeichnung: 'Basar', betrag: 1850, anzahlTeile: 4 });
  const teil = speicher.teilAnlegen(kleidungsteil({
    preis: { art: 'sammelkauf', ausgabeId: ausgabe.id },
  }));

  speicher.ausgabeLoeschen(ausgabe.id);

  assert.equal(speicher.ausgaben().length, 0);
  assert.equal(speicher.teil(teil.id).preis, null);
});

/* --- Marken, Soll-Mengen, Name -------------------------------------------- */

test('Marken anlegen und löschen, ohne doppelte Einträge', () => {
  const speicher = neuerSpeicher();
  speicher.markeAnlegen('Paw Patrol');
  speicher.markeAnlegen('Paw Patrol');
  speicher.markeAnlegen('Spider-Man');
  assert.deepEqual(speicher.marken(), ['Paw Patrol', 'Spider-Man']);

  speicher.markeLoeschen('Paw Patrol');
  assert.deepEqual(speicher.marken(), ['Spider-Man']);
});

test('eine gelöschte Marke bleibt am bestehenden Teil erhalten', () => {
  const speicher = neuerSpeicher();
  speicher.markeAnlegen('Paw Patrol');
  const teil = speicher.teilAnlegen(kleidungsteil({ merkmal: 'marke', marke: 'Paw Patrol' }));

  speicher.markeLoeschen('Paw Patrol');

  assert.deepEqual(speicher.marken(), []);
  assert.equal(speicher.teil(teil.id).marke, 'Paw Patrol');
});

test('Soll-Mengen setzen, überschreiben und löschen', () => {
  const speicher = neuerSpeicher();
  speicher.sollMengeSetzen('Pullover', 'winter', 3);
  assert.equal(speicher.sollMengen().length, 1);

  speicher.sollMengeSetzen('Pullover', 'winter', 5);
  assert.equal(speicher.sollMengen().length, 1, 'dieselbe Art und Jahreszeit bleibt ein Eintrag');
  assert.equal(speicher.sollMengen()[0].soll, 5);

  speicher.sollMengeSetzen('Pullover', 'sommer', 2);
  assert.equal(speicher.sollMengen().length, 2);

  speicher.sollMengeLoeschen('Pullover', 'winter');
  assert.equal(speicher.sollMengen().length, 1);
  assert.equal(speicher.sollMengen()[0].jahreszeit, 'sommer');
});

test('der Name des Kindes wird gespeichert', () => {
  const speicher = neuerSpeicher();
  speicher.nameSetzen('Mila');
  assert.equal(speicher.einstellungen().name, 'Mila');
});

/* --- Änderungszähler ------------------------------------------------------ */

test('jede Datenänderung erhöht den Änderungszähler um 1', () => {
  const speicher = neuerSpeicher();
  assert.equal(speicher.einstellungen().aenderungenSeitBackup, 0);

  const teil = speicher.teilAnlegen(kleidungsteil());
  assert.equal(speicher.einstellungen().aenderungenSeitBackup, 1);

  speicher.teilAendern(teil.id, { name: 'Neu' });
  assert.equal(speicher.einstellungen().aenderungenSeitBackup, 2);

  speicher.nameSetzen('Mila');
  assert.equal(speicher.einstellungen().aenderungenSeitBackup, 3);

  speicher.markeAnlegen('Frozen');
  assert.equal(speicher.einstellungen().aenderungenSeitBackup, 4);

  speicher.sollMengeSetzen('Pullover', 'winter', 2);
  assert.equal(speicher.einstellungen().aenderungenSeitBackup, 5);

  speicher.ausgabeAnlegen({ bezeichnung: 'Basar', betrag: 1850, anzahlTeile: 4 });
  assert.equal(speicher.einstellungen().aenderungenSeitBackup, 6);

  speicher.teilAussortieren(teil.id, 'kaputt');
  assert.equal(speicher.einstellungen().aenderungenSeitBackup, 7);

  speicher.aussortiertLeeren();
  assert.equal(speicher.einstellungen().aenderungenSeitBackup, 8);
});

test('ein notiertes Backup setzt den Zähler zurück und zählt selbst nicht mit', () => {
  const speicher = neuerSpeicher();
  speicher.teilAnlegen(kleidungsteil());
  speicher.teilAnlegen(neuesSpielzeug({ name: 'Lego', art: 'Lego' }));
  assert.equal(speicher.einstellungen().aenderungenSeitBackup, 2);

  speicher.backupNotieren('2026-10-13T10:00:00.000Z');

  assert.equal(speicher.einstellungen().aenderungenSeitBackup, 0);
  assert.equal(speicher.einstellungen().letztesBackupAm, '2026-10-13T10:00:00.000Z');
});

/* --- Ereignisse ----------------------------------------------------------- */

test('nach jeder Änderung läuft der angemeldete Rückruf', () => {
  const speicher = neuerSpeicher();
  let gezaehlt = 0;
  const abmelden = speicher.beiAenderung(() => { gezaehlt += 1; });

  speicher.teilAnlegen(kleidungsteil());
  speicher.nameSetzen('Mila');
  assert.equal(gezaehlt, 2);

  abmelden();
  speicher.nameSetzen('Noah');
  assert.equal(gezaehlt, 2, 'nach dem Abmelden läuft nichts mehr');
});

/* --- Fehlerbehandlung ----------------------------------------------------- */

test('ein voller Speicher gibt eine verständliche Meldung', () => {
  const voll = {
    getItem: () => null,
    setItem: () => {
      const fehler = new Error('voll');
      fehler.name = 'QuotaExceededError';
      throw fehler;
    },
    removeItem: () => {},
  };
  const speicher = erstelleSpeicher(voll);

  assert.throws(
    () => speicher.nameSetzen('Mila'),
    (fehler) => fehler instanceof SpeicherFehler && fehler.message.includes('voll'),
  );
});

test('beschädigte Daten im Speicher geben eine verständliche Meldung', () => {
  const hintergrund = speicherImArbeitsspeicher();
  hintergrund.setItem('kindergarderobe', '{kaputt');
  const speicher = erstelleSpeicher(hintergrund);

  assert.throws(
    () => speicher.zustand(),
    (fehler) => fehler instanceof SpeicherFehler && fehler.message.includes('beschädigt'),
  );
});

/* --- Kein nutzbares localStorage (#3) -------------------------------------- */

/** Führt fn mit einem vorgetäuschten globalen localStorage aus. */
function mitLocalStorage(ersatz, fn) {
  const vorher = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { value: ersatz, configurable: true, writable: true });
  try {
    return fn();
  } finally {
    if (vorher) Object.defineProperty(globalThis, 'localStorage', vorher);
    else delete globalThis.localStorage;
  }
}

test('ohne nutzbares localStorage meldet der Speicher, dass er nicht dauerhaft ist (#3)', () => {
  const gesperrt = { getItem() { throw new Error('SecurityError'); } };
  const speicher = mitLocalStorage(gesperrt, () => erstelleSpeicher());

  assert.equal(speicher.dauerhaft, false);
  // Die App bleibt trotzdem benutzbar – nur eben ohne Dauer.
  speicher.teilAnlegen(kleidungsteil());
  assert.equal(speicher.teile().length, 1);
});

test('mit nutzbarem localStorage ist der Speicher dauerhaft (#3)', () => {
  const speicher = mitLocalStorage(speicherImArbeitsspeicher(), () => erstelleSpeicher());
  assert.equal(speicher.dauerhaft, true);
  assert.equal(neuerSpeicher().dauerhaft, true);
});

/* --- Beschädigte Daten (#2) ----------------------------------------------- */

const KAPUTT = '{"teile":[{"name":"Regenjacke"';

function beschaedigterSpeicher(roh = KAPUTT) {
  const hintergrund = speicherImArbeitsspeicher();
  hintergrund.setItem(SPEICHER_SCHLUESSEL, roh);
  return { hintergrund, speicher: erstelleSpeicher(hintergrund) };
}

test('beschädigte Daten werden erkannt und als Rohdaten gesichert (#2)', () => {
  const { hintergrund, speicher } = beschaedigterSpeicher();

  assert.throws(
    () => speicher.teile(),
    (fehler) => fehler instanceof SpeicherFehler && fehler.art === 'beschaedigt',
  );
  // Nichts überschrieben, zusätzlich eine Kopie unter eigenem Schlüssel.
  assert.equal(hintergrund.getItem(SPEICHER_SCHLUESSEL), KAPUTT);
  assert.equal(hintergrund.getItem(ROHDATEN_SCHLUESSEL), KAPUTT);
  assert.equal(speicher.rohdaten(), KAPUTT);
});

test('lesbares JSON mit falschem Aufbau gilt ebenfalls als beschädigt (#2)', () => {
  for (const roh of ['null', '[]', '42', '{"teile":"nichts"}', '{"teile":[],"marken":{}}']) {
    const { speicher } = beschaedigterSpeicher(roh);
    assert.throws(
      () => speicher.zustand(),
      (fehler) => fehler instanceof SpeicherFehler && fehler.art === 'beschaedigt',
      roh,
    );
  }
});

test('eine Änderung überschreibt beschädigte Daten nicht (#2)', () => {
  const { hintergrund, speicher } = beschaedigterSpeicher();
  assert.throws(() => speicher.teilAnlegen(kleidungsteil()), SpeicherFehler);
  assert.throws(() => speicher.backupNotieren(), SpeicherFehler);
  assert.equal(hintergrund.getItem(SPEICHER_SCHLUESSEL), KAPUTT);
});

test('ein Backup lässt sich trotz beschädigter Daten einspielen (#2)', () => {
  const { hintergrund, speicher } = beschaedigterSpeicher();

  speicher.allesErsetzen({ teile: [kleidungsteil({ name: 'Aus dem Backup' })], einstellungen: { name: 'Mila' } });

  assert.equal(speicher.teile()[0].name, 'Aus dem Backup');
  // Die Rohdaten bleiben trotzdem erhalten.
  assert.equal(hintergrund.getItem(ROHDATEN_SCHLUESSEL), KAPUTT);
});

test('neu beginnen leert die Daten, die Rohdaten bleiben gesichert (#2)', () => {
  const { hintergrund, speicher } = beschaedigterSpeicher();

  speicher.neuBeginnen();

  assert.deepEqual(speicher.teile(), []);
  assert.equal(hintergrund.getItem(ROHDATEN_SCHLUESSEL), KAPUTT);
});

test('eine zweite Beschädigung überschreibt die erste Sicherung nicht (#2)', () => {
  const { hintergrund, speicher } = beschaedigterSpeicher();
  assert.throws(() => speicher.zustand(), SpeicherFehler);

  hintergrund.setItem(SPEICHER_SCHLUESSEL, '{"ganz":"anders"');
  assert.throws(() => speicher.zustand(), SpeicherFehler);

  assert.equal(hintergrund.getItem(ROHDATEN_SCHLUESSEL), KAPUTT);
  assert.ok(
    hintergrund.schluessel().some((s) => s.startsWith(`${ROHDATEN_SCHLUESSEL}-`)
      && hintergrund.getItem(s) === '{"ganz":"anders"'),
    'die zweite Fassung liegt unter einem eigenen Schlüssel',
  );
});

test('kann die Kopie nicht gesichert werden, bleibt alles unangetastet (#2)', () => {
  const { hintergrund, speicher } = beschaedigterSpeicher();
  const original = hintergrund.setItem;
  hintergrund.setItem = (schluessel, wert) => {
    if (schluessel.startsWith(ROHDATEN_SCHLUESSEL)) throw new Error('voll');
    original(schluessel, wert);
  };

  assert.throws(() => speicher.allesErsetzen({ teile: [] }), SpeicherFehler);
  assert.throws(() => speicher.neuBeginnen(), SpeicherFehler);
  assert.equal(hintergrund.getItem(SPEICHER_SCHLUESSEL), KAPUTT);
});

test('alles ersetzen übernimmt die Daten und setzt den Zähler auf 0', () => {
  const speicher = neuerSpeicher();
  speicher.teilAnlegen(kleidungsteil({ name: 'Wird ersetzt' }));

  speicher.allesErsetzen({
    teile: [kleidungsteil({ name: 'Aus dem Backup' })],
    ausgaben: [{ id: 'a1', bezeichnung: 'Basar', datum: '2026-08-15', betrag: 1850, anzahlTeile: 4 }],
    marken: ['Frozen'],
    sollMengen: [],
    einstellungen: { name: 'Mila' },
  }, { letztesBackupAm: '2026-08-15T09:00:00.000Z' });

  assert.equal(speicher.teile().length, 1);
  assert.equal(speicher.teile()[0].name, 'Aus dem Backup');
  assert.equal(speicher.ausgaben().length, 1);
  assert.deepEqual(speicher.marken(), ['Frozen']);
  assert.equal(speicher.einstellungen().name, 'Mila');
  assert.equal(speicher.einstellungen().aenderungenSeitBackup, 0);
  assert.equal(speicher.einstellungen().letztesBackupAm, '2026-08-15T09:00:00.000Z');
});

/* --- Oberflächen-Zustand: ausgeblendeter Backup-Hinweis ------------------- */

test('ohne Ausblenden ist kein Zählerstand gemerkt', () => {
  assert.equal(neuerSpeicher().bannerAusgeblendetBei(), null);
});

test('der gemerkte Zählerstand überlebt einen Neustart der App', () => {
  const hintergrund = speicherImArbeitsspeicher();
  const erster = erstelleSpeicher(hintergrund);
  erster.teilAnlegen(kleidungsteil());
  erster.bannerAusblenden(erster.einstellungen().aenderungenSeitBackup);

  // Neue Instanz auf demselben Hintergrund – wie nach einem Neuladen.
  const zweiter = erstelleSpeicher(hintergrund);
  assert.equal(zweiter.bannerAusgeblendetBei(), 1);
});

test('Ausblenden zählt nicht als Änderung', () => {
  const speicher = neuerSpeicher();
  speicher.teilAnlegen(kleidungsteil());
  const vorher = speicher.einstellungen().aenderungenSeitBackup;

  speicher.bannerAusblenden(vorher);

  assert.equal(speicher.einstellungen().aenderungenSeitBackup, vorher);
});

test('der Oberflächen-Zustand liegt unter einem eigenen Schlüssel', () => {
  const hintergrund = speicherImArbeitsspeicher();
  const speicher = erstelleSpeicher(hintergrund);
  speicher.teilAnlegen(kleidungsteil());
  speicher.bannerAusblenden(1);

  const daten = JSON.parse(hintergrund.getItem(SPEICHER_SCHLUESSEL));
  assert.ok(!JSON.stringify(daten).includes('bannerAusgeblendetBei'),
    'der Zählerstand steht nicht bei den Daten');
  assert.equal(JSON.parse(hintergrund.getItem(OBERFLAECHE_SCHLUESSEL)).bannerAusgeblendetBei, 1);
});

test('nach einem Export gilt ein früheres Ausblenden nicht mehr', () => {
  const speicher = neuerSpeicher();
  speicher.teilAnlegen(kleidungsteil());
  speicher.bannerAusblenden(1);

  speicher.backupNotieren('2026-10-14T10:00:00.000Z');

  assert.equal(speicher.bannerAusgeblendetBei(), null);
});

test('nach einem eingespielten Backup gilt ein früheres Ausblenden nicht mehr', () => {
  const speicher = neuerSpeicher();
  speicher.teilAnlegen(kleidungsteil());
  speicher.bannerAusblenden(1);

  speicher.allesErsetzen({ teile: [], ausgaben: [], marken: [], sollMengen: [] });

  assert.equal(speicher.bannerAusgeblendetBei(), null);
});

test('ein kaputter Oberflächen-Zustand stört nicht', () => {
  const hintergrund = speicherImArbeitsspeicher();
  hintergrund.setItem(OBERFLAECHE_SCHLUESSEL, '{kaputt');
  const speicher = erstelleSpeicher(hintergrund);

  assert.equal(speicher.bannerAusgeblendetBei(), null);
});
