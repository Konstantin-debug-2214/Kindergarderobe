/**
 * sw.js – Service Worker: macht die App installierbar und offlinefähig.
 *
 * Alle App-Dateien werden beim Installieren in einen Cache gelegt; danach
 * gilt „Cache zuerst“, damit die App auch ohne Netz startet. Es gibt keinen
 * Build-Schritt, die Liste steht deshalb hier. Ein Test in `tests/` prüft,
 * dass sie zum Dateibestand passt.
 *
 * Neue Version: Der Browser lädt dieses Skript erneut, bemerkt die Änderung
 * und installiert den neuen Worker im Wartezustand. Übernommen wird er erst,
 * wenn John im Hinweis-Banner auf „Neu laden“ tippt (Nachricht UEBERNEHMEN) –
 * so gehen keine Eingaben verloren.
 *
 * Alle Pfade sind relativ, damit die App unter /Kindergarderobe/ auf GitHub
 * Pages und lokal unter / läuft.
 */

/** Bei jeder Änderung an den App-Dateien hochzählen. */
const VERSION = 'v2';
const CACHE_NAME = `kindergarderobe-${VERSION}`;

/** Alle Dateien, die die App zum Laufen braucht. */
const DATEIEN = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/base.css',
  './css/components.css',
  './css/screens.css',
  './css/tokens.css',
  './fonts/OFL-Fredoka.txt',
  './fonts/OFL-Nunito.txt',
  './fonts/fredoka-latin-variable.woff2',
  './fonts/nunito-latin-variable.woff2',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg',
  './js/aktualisierung.js',
  './js/app.js',
  './js/backup.js',
  './js/costs.js',
  './js/filters.js',
  './js/formular.js',
  './js/model.js',
  './js/router.js',
  './js/saison.js',
  './js/screens/aussortiert.js',
  './js/screens/einstellungen.js',
  './js/screens/jahreszeit.js',
  './js/screens/kategorie.js',
  './js/screens/kosten.js',
  './js/screens/platzhalter.js',
  './js/screens/saisonwechsel.js',
  './js/screens/statistik.js',
  './js/screens/teil.js',
  './js/screens/teilFormular.js',
  './js/screens/uebersicht.js',
  './js/storage.js',
  './js/ui/ausgabeDialog.js',
  './js/ui/banner.js',
  './js/ui/diagramme.js',
  './js/ui/dialog.js',
  './js/ui/dom.js',
  './js/ui/felder.js',
  './js/ui/formularteile.js',
  './js/ui/hinweis.js',
  './js/ui/icons.js',
  './js/ui/kacheln.js',
  './js/ui/knoepfe.js',
  './js/ui/kopfzeile.js',
  './js/ui/leiste.js',
  './js/ui/nachOben.js',
];

/* --- Installieren: alles einsammeln --------------------------------------- */

self.addEventListener('install', (ereignis) => {
  ereignis.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(DATEIEN)),
  );
  // Kein skipWaiting: der neue Worker wartet, bis John „Neu laden“ tippt.
});

/* --- Aktivieren: alte Caches wegräumen ------------------------------------ */

self.addEventListener('activate', (ereignis) => {
  ereignis.waitUntil((async () => {
    const namen = await caches.keys();
    await Promise.all(
      namen
        .filter((name) => name.startsWith('kindergarderobe-') && name !== CACHE_NAME)
        .map((name) => caches.delete(name)),
    );
    // Übernimmt die bereits offene Seite, damit sie sofort offline läuft.
    await self.clients.claim();
  })());
});

/* --- Abrufen: Cache zuerst ------------------------------------------------ */

self.addEventListener('fetch', (ereignis) => {
  const anfrage = ereignis.request;

  // Nur eigene Dateien und nur Lesezugriffe.
  if (anfrage.method !== 'GET') return;
  if (new URL(anfrage.url).origin !== self.location.origin) return;

  ereignis.respondWith(ausCacheOderNetz(anfrage));
});

async function ausCacheOderNetz(anfrage) {
  const cache = await caches.open(CACHE_NAME);

  // ignoreSearch: index.html?t=123 trifft denselben Eintrag.
  const gefunden = await cache.match(anfrage, { ignoreSearch: true });
  if (gefunden) return gefunden;

  try {
    const antwort = await fetch(anfrage);
    // Nur eigene, vollständige Antworten nachtragen.
    if (antwort.ok && antwort.type === 'basic') {
      cache.put(anfrage, antwort.clone());
    }
    return antwort;
  } catch (fehler) {
    // Ohne Netz: beim Aufruf einer Seite die App selbst ausliefern.
    if (anfrage.mode === 'navigate') {
      const seite = await cache.match('./index.html');
      if (seite) return seite;
    }
    throw fehler;
  }
}

/* --- Übernehmen auf Wunsch ------------------------------------------------ */

self.addEventListener('message', (ereignis) => {
  if (ereignis.data === 'UEBERNEHMEN') self.skipWaiting();
});
