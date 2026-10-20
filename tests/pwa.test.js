/**
 * Prüft Manifest und Service Worker, soweit das ohne Browser geht.
 *
 * Wichtigster Punkt: Es gibt keinen Build-Schritt, die Liste der
 * zwischengespeicherten Dateien steht per Hand in `sw.js`. Diese Tests
 * vergleichen sie mit dem tatsächlichen Dateibestand – so fällt eine
 * vergessene Datei sofort auf, statt erst offline auf dem Handy.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = fileURLToPath(new URL('..', import.meta.url));

/** Ordner, deren Inhalt vollständig im Cache liegen muss. */
const APP_ORDNER = ['css', 'js', 'fonts', 'icons'];

/** Keine App-Datei, nur ein Platzhalter für Git. */
const NICHT_IM_CACHE = new Set(['icons/.gitkeep']);

const swQuelle = readFileSync(join(WURZEL, 'sw.js'), 'utf8');
const manifest = JSON.parse(readFileSync(join(WURZEL, 'manifest.webmanifest'), 'utf8'));
const indexQuelle = readFileSync(join(WURZEL, 'index.html'), 'utf8');

/** Liest die Liste DATEIEN aus sw.js, ohne das Modul auszuführen. */
function dateilisteAusSw() {
  const block = swQuelle.match(/const DATEIEN = \[([\s\S]*?)\n\];/);
  assert.ok(block, 'sw.js enthält keine Liste "const DATEIEN = [ … ];"');
  return [...block[1].matchAll(/'([^']+)'/g)].map((treffer) => treffer[1]);
}

/** Alle Dateien eines Ordners, Pfade mit Schrägstrich wie im Browser. */
function dateienIn(ordner) {
  return readdirSync(join(WURZEL, ordner), { recursive: true, withFileTypes: true })
    .filter((eintrag) => eintrag.isFile())
    .map((eintrag) => {
      const unterordner = eintrag.parentPath.slice(WURZEL.length).split(sep).join('/');
      return `${unterordner.replace(/^\/+|\/+$/g, '')}/${eintrag.name}`;
    });
}

const dateiliste = dateilisteAusSw();

test('der Cache-Name trägt eine Versionsnummer', () => {
  assert.match(swQuelle, /const VERSION = '[^']+'/);
  assert.match(swQuelle, /const CACHE_NAME = `kindergarderobe-\$\{VERSION\}`/);
});

test('die Dateiliste enthält keine Einträge doppelt', () => {
  assert.equal(new Set(dateiliste).size, dateiliste.length);
});

test('jede App-Datei steht in der Liste des Service Workers', () => {
  const fehlend = [];

  for (const ordner of APP_ORDNER) {
    for (const datei of dateienIn(ordner)) {
      if (NICHT_IM_CACHE.has(datei)) continue;
      if (!dateiliste.includes(`./${datei}`)) fehlend.push(datei);
    }
  }

  assert.deepEqual(fehlend, [], `nicht in sw.js: ${fehlend.join(', ')}`);
});

test('der Start, die Seite selbst und das Manifest stehen in der Liste', () => {
  for (const eintrag of ['./', './index.html', './manifest.webmanifest']) {
    assert.ok(dateiliste.includes(eintrag), `${eintrag} fehlt in sw.js`);
  }
});

test('jeder Eintrag der Liste zeigt auf eine vorhandene Datei', () => {
  const fehlend = dateiliste
    // './' ist der Start und wird als index.html ausgeliefert.
    .filter((eintrag) => eintrag !== './')
    .filter((eintrag) => !existsSync(join(WURZEL, eintrag.replace(/^\.\//, ''))));

  assert.deepEqual(fehlend, [], `in sw.js gelistet, aber nicht vorhanden: ${fehlend.join(', ')}`);
});

test('das Manifest macht die App installierbar', () => {
  assert.equal(manifest.name, 'Kindergarderobe');
  assert.equal(manifest.short_name, 'Kindergarderobe');
  assert.equal(manifest.lang, 'de');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.orientation, 'any');
  // Relative Pfade, damit die App auch unter /Kindergarderobe/ läuft.
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  // Farben aus den Tokens.
  assert.equal(manifest.background_color, '#F1F5F3');
  assert.equal(manifest.theme_color, '#F1F5F3');
});

test('das Manifest hat 192 und 512 jeweils als any und maskable', () => {
  for (const groesse of ['192x192', '512x512']) {
    for (const zweck of ['any', 'maskable']) {
      const gefunden = manifest.icons.some(
        (bild) => bild.sizes === groesse && bild.purpose === zweck,
      );
      assert.ok(gefunden, `Icon ${groesse} mit purpose "${zweck}" fehlt`);
    }
  }
});

test('alle Icons des Manifests sind vorhanden', () => {
  for (const bild of manifest.icons) {
    assert.ok(!bild.src.startsWith('/'), `${bild.src} ist kein relativer Pfad`);
    assert.ok(existsSync(join(WURZEL, bild.src)), `${bild.src} fehlt`);
  }
});

test('die Seite verweist auf Manifest, Favicon und Apple-Icon', () => {
  assert.match(indexQuelle, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(indexQuelle, /<link rel="icon" href="icons\/icon\.svg"/);
  assert.match(indexQuelle, /<link rel="apple-touch-icon" href="icons\/apple-touch-icon\.png">/);
  assert.match(indexQuelle, /<meta name="theme-color" content="#F1F5F3">/);
});
