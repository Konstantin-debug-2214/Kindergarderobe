/**
 * Fingerabdruck der App-Dateien aus `DATEIEN` in sw.js.
 *
 * Damit prüft tests/version.test.js, ob nach einer Änderung an den App-Dateien
 * auch `VERSION` hochgezählt wurde. Zeilenenden in Textdateien werden
 * vereinheitlicht: Windows (CRLF) und GitHub (LF) ergeben denselben Wert.
 */

import { createHash } from 'node:crypto';

const TEXT_ENDUNGEN = ['.html', '.css', '.js', '.webmanifest', '.svg', '.txt'];

/** Die Liste DATEIEN aus dem Quelltext von sw.js. */
export function dateilisteAus(swQuelle) {
  const block = swQuelle.match(/const DATEIEN = \[([\s\S]*?)\n\];/);
  if (!block) throw new Error('sw.js enthält keine Liste "const DATEIEN = [ … ];"');
  return [...block[1].matchAll(/'([^']+)'/g)].map((treffer) => treffer[1]);
}

/** Der Wert von VERSION aus dem Quelltext von sw.js. */
export function versionAus(swQuelle) {
  return swQuelle.match(/const VERSION = '([^']+)'/)?.[1] ?? null;
}

/**
 * @param {Array<string>} dateien Einträge aus DATEIEN, z. B. './css/base.css'
 * @param {(pfad: string) => Buffer} lies liest eine Datei relativ zum Hauptverzeichnis
 * @returns {string} 16 Hex-Zeichen
 */
export function fingerabdruck(dateien, lies) {
  const hash = createHash('sha256');
  const pfade = dateien
    .filter((eintrag) => eintrag !== './') // './' ist index.html, das steht schon drin
    .map((eintrag) => eintrag.replace(/^\.\//, ''))
    .sort();

  for (const pfad of pfade) {
    let inhalt = lies(pfad);
    if (TEXT_ENDUNGEN.some((endung) => pfad.endsWith(endung))) {
      inhalt = Buffer.from(inhalt.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
    }
    hash.update(`${pfad}\n`);
    hash.update(inhalt);
    hash.update('\n');
  }

  return hash.digest('hex').slice(0, 16);
}
