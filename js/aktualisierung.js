/**
 * aktualisierung.js – Service Worker anmelden und auf neue Versionen hinweisen.
 *
 * Ohne Service-Worker-Unterstützung (oder ohne sicheren Ursprung) passiert
 * nichts; die App läuft dann wie bisher, nur ohne Offline-Betrieb.
 *
 * Eine neue Version wird nicht von selbst übernommen: Der neue Worker wartet,
 * im Meldungsbereich erscheint „Neue Version verfügbar“ mit dem Knopf
 * „Neu laden“. Erst der Tipp darauf übernimmt und lädt die Seite neu – so
 * gehen angefangene Eingaben nicht verloren.
 */

import { leeren } from './ui/dom.js';
import { banner } from './ui/banner.js';
import { knopf } from './ui/knoepfe.js';

/** Wird beim Tipp auf „Neu laden“ gesetzt – nur dann wird neu geladen. */
let uebernahmeLaeuft = false;

/** Meldet den Service Worker an und beobachtet neue Versionen. */
export function richteAktualisierungEin() {
  if (!('serviceWorker' in navigator)) return;

  // Der Wechsel auf den neuen Worker ist das Signal zum Neuladen. Beim ersten
  // Besuch wechselt der Worker ebenfalls – dann aber ungefragt, und es wird
  // nichts neu geladen.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (uebernahmeLaeuft) window.location.reload();
  });

  // Erst nach dem Laden anmelden, damit der Worker dem Start nicht im Weg ist.
  window.addEventListener('load', async () => {
    try {
      // updateViaCache: 'none' – das Skript selbst kommt immer aus dem Netz,
      // sonst würde eine neue Version womöglich tagelang nicht auffallen.
      const anmeldung = await navigator.serviceWorker.register('./sw.js', {
        updateViaCache: 'none',
      });
      beobachte(anmeldung);
    } catch (fehler) {
      // Kein Offline-Betrieb, aber die App bleibt benutzbar.
      console.warn('Service Worker nicht angemeldet:', fehler);
    }
  });
}

function beobachte(anmeldung) {
  // Beim Start kann schon eine Version warten (Fenster vorher geschlossen).
  if (anmeldung.waiting && navigator.serviceWorker.controller) {
    zeigeHinweis(anmeldung.waiting);
  }

  anmeldung.addEventListener('updatefound', () => {
    const neuer = anmeldung.installing;
    if (!neuer) return;

    neuer.addEventListener('statechange', () => {
      // 'installed' mit vorhandenem Controller heißt: eine neue Version liegt
      // bereit. Ohne Controller ist es die allererste Installation.
      if (neuer.state === 'installed' && navigator.serviceWorker.controller) {
        zeigeHinweis(neuer);
      }
    });
  });
}

/* --- Hinweis-Banner (nicht im Design) ------------------------------------- */

function zeigeHinweis(wartenderWorker) {
  const bereich = document.getElementById('hinweisband');
  if (!bereich) return;

  const neuLaden = knopf({
    text: 'Neu laden',
    // Kreisender Pfeil – derselbe wie beim Zurückholen.
    iconName: 'zurueckholen',
    variante: 'primaer',
  });

  neuLaden.addEventListener('click', () => {
    uebernahmeLaeuft = true;
    wartenderWorker.postMessage('UEBERNEHMEN');
  });

  leeren(bereich).append(banner({
    text: 'Neue Version verfügbar',
    zusatz: 'Beim Neuladen gehen nur nicht gespeicherte Eingaben verloren.',
    iconName: 'zurueckholen',
    aktionen: [neuLaden],
    // Ausgeblendet bleibt der Hinweis nur bis zum nächsten Start.
    beiSchliessen: () => leeren(bereich),
  }));
}
