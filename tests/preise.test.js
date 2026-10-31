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

/* --- #4: Wechsel weg vom Einzelpreis -------------------------------------- */

function teilMitEinzelpreis(speicher, betrag = 800) {
  const teil = speicher.teilAnlegen(kleidungsteil({ name: 'Regenjacke', preis: preisEinzeln(betrag) }));
  return { teil, eigene: speicher.teil(teil.id).preis.ausgabeId };
}

test('Einzelpreis -> Kein Preis löscht die eigene Ausgabe (#4)', () => {
  const speicher = neuerSpeicher();
  const { teil, eigene } = teilMitEinzelpreis(speicher);

  speichere(speicher, teil.id, { ...entwurfAusTeil(speicher.teil(teil.id)), preis: null });

  assert.equal(speicher.teil(teil.id).preis, null);
  assert.equal(speicher.ausgaben().some((x) => x.id === eigene), false);
  assert.deepEqual(jahresZahlen(speicher.ausgaben(), 2026), { summe: 0, teile: 0, durchschnitt: 0 });
});

test('Einzelpreis -> Sammelkauf löscht die eigene Ausgabe und zählt nicht doppelt (#4)', () => {
  const speicher = neuerSpeicher();
  const paket = speicher.ausgabeAnlegen({ bezeichnung: 'Paket', datum: '2026-05-01', betrag: 3000, anzahlTeile: 3 });
  const { teil, eigene } = teilMitEinzelpreis(speicher);

  speichere(speicher, teil.id, { ...entwurfAusTeil(speicher.teil(teil.id)), preis: preisSammelkauf(paket.id) });

  assert.equal(speicher.ausgaben().some((x) => x.id === eigene), false);
  assert.deepEqual(speicher.ausgaben().map(kern), [{ bezeichnung: 'Paket', betrag: 3000, anzahlTeile: 3 }]);
  assert.deepEqual(jahresZahlen(speicher.ausgaben(), 2026), { summe: 3000, teile: 3, durchschnitt: 1000 });
});

test('Sammelkauf -> Kein Preis löst nur die Verknüpfung (#4)', () => {
  const speicher = neuerSpeicher();
  const { sammelkauf, a } = sammelkaufMitZweiTeilen(speicher);

  speichere(speicher, a.id, { ...entwurfAusTeil(speicher.teil(a.id)), preis: null });

  assert.equal(speicher.teil(a.id).preis, null);
  const nachher = speicher.ausgaben().find((x) => x.id === sammelkauf.id);
  assert.deepEqual(kern(nachher), { bezeichnung: 'Flohmarkt Kita', betrag: 2500, anzahlTeile: 6 });
});

test('Einzelpreis -> Kein Preis -> Einzelpreis ergibt genau eine Ausgabe (#4)', () => {
  const speicher = neuerSpeicher();
  const { teil } = teilMitEinzelpreis(speicher);

  // Im Formular: erst "Kein Preis", dann wieder "Einzelpreis" mit 12,50 €.
  const entwurf = { ...entwurfAusTeil(speicher.teil(teil.id)), preis: null };
  speichere(speicher, teil.id, { ...entwurf, preis: preisEinzeln(1250, eigeneAusgabeId(entwurf.preis)) });

  assert.deepEqual(speicher.ausgaben().map(kern), [{ bezeichnung: 'Regenjacke', betrag: 1250, anzahlTeile: 1 }]);
  assert.equal(speicher.teil(teil.id).preis.ausgabeId, speicher.ausgaben()[0].id);
});

test('Passform oder Notiz ändern lässt den Einzelpreis in Ruhe (#4)', () => {
  const speicher = neuerSpeicher();
  const { teil, eigene } = teilMitEinzelpreis(speicher);

  speicher.teilAendern(teil.id, { passform: 'bald_zu_klein' });
  speicher.teilAendern(teil.id, { notiz: 'Knie geflickt' });

  assert.deepEqual(speicher.ausgaben().map((x) => x.id), [eigene]);
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
