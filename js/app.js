/**
 * app.js – Start der Anwendung.
 *
 * Verbindet den Router mit den Screen-Modulen, baut die untere Leiste und
 * fragt dauerhaften Speicher an.
 */

import { starteRouter } from './router.js';
import { leeren } from './ui/dom.js';
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

  starteRouter({
    beiWechsel({ screen, parameter }) {
      const bauen = SCREENS[screen];
      leeren(screenKnoten).append(bauen(parameter));

      aktualisiereLeiste(leisteKnoten, screen);
      document.title = `${TITEL[screen]} – Kindergarderobe`;
      window.scrollTo(0, 0);
    },
  });

  dauerhaftenSpeicherAnfragen();
}

start();
