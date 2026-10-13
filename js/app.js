/**
 * app.js – Start der Anwendung.
 *
 * Verbindet den Router mit den Screen-Modulen, baut die untere Leiste und
 * fragt dauerhaften Speicher an.
 */

import { starteRouter } from './router.js';
import { speicher, SpeicherFehler } from './storage.js';
import { el, leeren } from './ui/dom.js';
import { banner } from './ui/banner.js';
import { aktualisiereLeiste, baueLeiste } from './ui/leiste.js';

import { uebersichtScreen } from './screens/uebersicht.js';
import { kategorieScreen } from './screens/kategorie.js';
import { jahreszeitScreen } from './screens/jahreszeit.js';
import { teilScreen } from './screens/teil.js';
import { teilBearbeitenScreen } from './screens/teilBearbeiten.js';
import { neuScreen } from './screens/neu.js';
import { kostenScreen } from './screens/kosten.js';
import { statistikScreen } from './screens/statistik.js';
import { saisonwechselScreen } from './screens/saisonwechsel.js';
import { aussortiertScreen } from './screens/aussortiert.js';
import { einstellungenScreen } from './screens/einstellungen.js';

/** Screen-Name aus router.js -> Funktion, die den Inhalt baut. */
const SCREENS = {
  uebersicht: uebersichtScreen,
  kategorie: kategorieScreen,
  jahreszeit: jahreszeitScreen,
  teil: teilScreen,
  teilBearbeiten: teilBearbeitenScreen,
  neu: neuScreen,
  kosten: kostenScreen,
  statistik: statistikScreen,
  saisonwechsel: saisonwechselScreen,
  aussortiert: aussortiertScreen,
  einstellungen: einstellungenScreen,
};

/** Titel je Screen für das Browser-Fenster. */
const TITEL = {
  uebersicht: 'Übersicht',
  kategorie: 'Kategorie',
  jahreszeit: 'Nach Jahreszeit',
  teil: 'Teil',
  teilBearbeiten: 'Teil bearbeiten',
  neu: 'Neues Teil',
  kosten: 'Kosten',
  statistik: 'Statistik',
  saisonwechsel: 'Soll-Mengen & Saisonwechsel',
  aussortiert: 'Aussortiert',
  einstellungen: 'Einstellungen',
};

/**
 * Bittet den Browser, die Daten dauerhaft zu speichern, damit localStorage
 * nicht automatisch geräumt wird. Ein "Nein" ist kein Fehler.
 */
async function dauerhaftenSpeicherAnfragen() {
  if (!navigator.storage?.persist) return;
  try {
    await navigator.storage.persist();
  } catch {
    // Browser lehnt ab oder kennt die Anfrage nicht: die App läuft trotzdem.
  }
}

function start() {
  const screenKnoten = document.getElementById('screen');
  const leisteKnoten = document.getElementById('leiste');

  baueLeiste(leisteKnoten);

  /** Die gerade angezeigte Route – für das Neuzeichnen nach Datenänderungen. */
  let aktuelleRoute = null;

  /**
   * Baut den Screen auf.
   * @param {{screen: string, parameter: Object}} route
   * @param {{frisch?: boolean}} [optionen] frisch bedeutet: neu betretener
   *   Screen (Routenwechsel). Bei false baut sich derselbe Screen nach einer
   *   Datenänderung nur neu auf und darf seinen Zustand behalten, etwa eine
   *   gerade gezeigte Meldung.
   */
  function zeichne({ screen, parameter }, { frisch = true } = {}) {
    aktuelleRoute = { screen, parameter };
    const bauen = SCREENS[screen];

    try {
      // neuZeichnen erlaubt einem Screen, sich selbst neu aufzubauen.
      leeren(screenKnoten).append(bauen(parameter, { neuZeichnen, frisch }));
    } catch (fehler) {
      leeren(screenKnoten).append(fehlerSeite(fehler));
    }

    aktualisiereLeiste(leisteKnoten, screen);
    document.title = `${TITEL[screen]} – Kindergarderobe`;
    if (frisch) window.scrollTo(0, 0);
  }

  function neuZeichnen() {
    if (aktuelleRoute) zeichne(aktuelleRoute, { frisch: false });
  }

  starteRouter({ beiWechsel: zeichne });

  // Nach jeder Datenänderung den aktuellen Screen neu aufbauen.
  speicher.beiAenderung(neuZeichnen);

  dauerhaftenSpeicherAnfragen();
}

/**
 * Notanzeige, wenn ein Screen nicht gebaut werden kann – zum Beispiel, weil
 * die gespeicherten Daten beschädigt sind. Besser als eine leere Seite.
 */
function fehlerSeite(fehler) {
  console.error(fehler);
  return el('div', { class: 'inhalt' }, [
    banner({
      art: 'fehler',
      rolle: 'alert',
      text: 'Die Ansicht konnte nicht aufgebaut werden.',
      zusatz: fehler instanceof SpeicherFehler
        ? fehler.message
        : 'Bitte die Seite neu laden. Hilft das nicht, ein Backup einspielen.',
    }),
  ]);
}

start();
