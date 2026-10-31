/**
 * Preise am Teil: Einzelpreis, Sammelkauf und die Wechsel dazwischen.
 *
 * Geprüft wird der Weg, den auch das Formular geht: Teil laden, Preis im
 * Entwurf ändern, über teilAusEntwurf speichern. So fallen Fehler auf, die
 * erst im Zusammenspiel von Formular-Logik und Speicher entstehen.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { erstelleSpeicher, speicherImArbeitsspeicher } from '../js/storage.js';
import { neuesKleidungsteil } from '../js/model.js';
import { jahresZahlen } from '../js/costs.js';
import {
  eigeneAusgabeId,
  entwurfAusTeil,
  preisEinzeln,
  preisSammelkauf,
  teilAusEntwurf,
} from '../js/formular.js';

function neuerSpeicher() {
  return erstelleSpeicher(speicherImArbeitsspeicher());
}

function kleidungsteil(werte = {}) {
  return neuesKleidungsteil({
    name: 'Pulli',
    kategorie: 'oberteile',
    art: 'Pullover',
    groesse: { system: 'konfektion', von: 110, bis: 110 },
    jahreszeiten: ['herbst'],
    ...werte,
  });
}

/** Speichert einen geänderten Entwurf wie das Formular. */
function speichere(speicher, id, entwurf) {
  speicher.teilAendern(id, teilAusEntwurf(entwurf));
}

/** Nur die Felder, auf die es bei einer Ausgabe ankommt. */
function kern(ausgabe) {
  const { bezeichnung, betrag, anzahlTeile } = ausgabe;
  return { bezeichnung, betrag, anzahlTeile };
}

function sammelkaufMitZweiTeilen(speicher) {
  const sammelkauf = speicher.ausgabeAnlegen({
    bezeichnung: 'Flohmarkt Kita', datum: '2026-09-12', betrag: 2500, anzahlTeile: 6,
  });
  const a = speicher.teilAnlegen(kleidungsteil({ name: 'Pulli A', preis: preisSammelkauf(sammelkauf.id) }));
  const b = speicher.teilAnlegen(kleidungsteil({ name: 'Pulli B', preis: preisSammelkauf(sammelkauf.id) }));
  return { sammelkauf, a, b };
}

/* --- #1: Sammelkauf -> Einzelpreis ---------------------------------------- */

test('Sammelkauf -> Einzelpreis lässt den Sammelkauf unverändert (#1)', () => {
  const speicher = neuerSpeicher();
  const { sammelkauf, a, b } = sammelkaufMitZweiTeilen(speicher);

  // So hat das Formular den Einzelpreis bisher gebaut: mit der Id des
  // Sammelkaufs. Der Speicher darf diese Ausgabe trotzdem nicht umschreiben.
  speicher.teilAendern(a.id, { preis: { art: 'einzeln', betrag: 800, ausgabeId: sammelkauf.id } });

  const nachher = speicher.ausgaben().find((x) => x.id === sammelkauf.id);
  assert.deepEqual(kern(nachher), { bezeichnung: 'Flohmarkt Kita', betrag: 2500, anzahlTeile: 6 });
  assert.equal(speicher.teil(b.id).preis.ausgabeId, sammelkauf.id);
});

test('Sammelkauf -> Einzelpreis legt eine eigene Ausgabe an (#1)', () => {
  const speicher = neuerSpeicher();
  const { sammelkauf, a } = sammelkaufMitZweiTeilen(speicher);

  const entwurf = entwurfAusTeil(speicher.teil(a.id));
  speichere(speicher, a.id, { ...entwurf, preis: preisEinzeln(800, eigeneAusgabeId(entwurf.preis)) });

  const teil = speicher.teil(a.id);
  assert.equal(teil.preis.art, 'einzeln');
  assert.notEqual(teil.preis.ausgabeId, sammelkauf.id);

  const eigene = speicher.ausgaben().find((x) => x.id === teil.preis.ausgabeId);
  assert.deepEqual(kern(eigene), { bezeichnung: 'Pulli A', betrag: 800, anzahlTeile: 1 });
  // Sammelkauf 25 € für 6 Teile plus der neue Einzelpreis.
  assert.deepEqual(jahresZahlen(speicher.ausgaben(), 2026).teile, 7);
});

test('die eigene Ausgabe gibt es nur bei einem Einzelpreis (#1)', () => {
  assert.equal(eigeneAusgabeId({ art: 'einzeln', betrag: 800, ausgabeId: 'x' }), 'x');
  assert.equal(eigeneAusgabeId({ art: 'sammelkauf', ausgabeId: 's' }), null);
  assert.equal(eigeneAusgabeId(null), null);
});

test('ein Einzelpreis nutzt keine Ausgabe, die einem anderen Teil gehört (#1)', () => {
  const speicher = neuerSpeicher();
  const erstes = speicher.teilAnlegen(kleidungsteil({ name: 'Erstes', preis: preisEinzeln(500) }));
  const fremd = speicher.teil(erstes.id).preis.ausgabeId;

  const zweites = speicher.teilAnlegen(kleidungsteil({ name: 'Zweites', preis: preisEinzeln(900, fremd) }));

  assert.notEqual(speicher.teil(zweites.id).preis.ausgabeId, fremd);
  const ausgabeDesErsten = speicher.ausgaben().find((x) => x.id === fremd);
  assert.deepEqual(kern(ausgabeDesErsten), { bezeichnung: 'Erstes', betrag: 500, anzahlTeile: 1 });
});
