/**
 * Wurde nach einer Änderung an den App-Dateien `VERSION` in sw.js hochgezählt?
 *
 * Ohne neue Version merkt der Browser kein Update; die installierte App
 * bliebe wegen „Cache zuerst“ dauerhaft beim alten Stand. tests/sw-versionen.txt
 * hält zu jeder Version den Fingerabdruck ihrer Dateien fest. Passt der
 * aktuelle Fingerabdruck nicht zur aktuellen Version, schlägt dieser Test an
 * und nennt die Zeile, die einzutragen ist.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { dateilisteAus, fingerabdruck, versionAus } from './fingerabdruck.js';

const WURZEL = fileURLToPath(new URL('..', import.meta.url));
const VERSIONEN_DATEI = 'tests/sw-versionen.txt';

const swQuelle = readFileSync(join(WURZEL, 'sw.js'), 'utf8');
const version = versionAus(swQuelle);
const aktuell = fingerabdruck(dateilisteAus(swQuelle), (pfad) => readFileSync(join(WURZEL, pfad)));

/** Zeilen "v3 0123abcd…" aus tests/sw-versionen.txt; # leitet Kommentare ein. */
function vermerkte() {
  return readFileSync(join(WURZEL, VERSIONEN_DATEI), 'utf8')
    .split(/\r?\n/)
    .map((zeile) => zeile.replace(/#.*/, '').trim())
    .filter(Boolean)
    .map((zeile) => {
      const [name, wert] = zeile.split(/\s+/);
      return { name, wert };
    });
}

const nummer = (name) => Number(String(name).replace(/^v/, ''));

test('VERSION in sw.js hat die Form v1, v2, …', () => {
  assert.match(String(version), /^v\d+$/);
});

test('nach geänderten App-Dateien ist VERSION hochgezählt (#12)', () => {
  const eintrag = vermerkte().find((zeile) => zeile.name === version);
  const naechste = `v${nummer(version) + 1}`;

  assert.ok(eintrag, `Neue Version ${version}: in ${VERSIONEN_DATEI} die Zeile `
    + `"${version} ${aktuell}" ergänzen.`);

  assert.equal(aktuell, eintrag.wert,
    `Die App-Dateien haben sich seit ${version} geändert, VERSION wurde aber nicht `
    + `hochgezählt. In sw.js VERSION auf '${naechste}' setzen und in ${VERSIONEN_DATEI} `
    + `die Zeile "${naechste} ${aktuell}" ergänzen – sonst erreicht das Update die `
    + 'installierte App nicht.');
});

test('jede Version ist nur einmal vermerkt und die aktuelle ist die neueste (#12)', () => {
  const namen = vermerkte().map((zeile) => zeile.name);
  assert.equal(new Set(namen).size, namen.length, 'eine Version steht doppelt in der Liste');
  assert.equal(Math.max(...namen.map(nummer)), nummer(version),
    'VERSION in sw.js ist nicht die höchste vermerkte Version');
});
