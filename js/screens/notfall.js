/**
 * notfall.js – Ansicht bei beschädigten Daten.
 *
 * Lassen sich die gespeicherten Daten nicht lesen, kann kein Screen gebaut
 * werden. Statt einer Sackgasse zeigt app.js dann auf jeder Route diese
 * Ansicht. Der beschädigte Stand wird nie überschrieben, ohne dass er vorher
 * als Rohdaten gesichert ist (siehe storage.js).
 *
 * Nicht im Design; Aufbau im Stil der Einstellungen.
 */

import { el } from '../ui/dom.js';
import { banner } from '../ui/banner.js';
import { frageNach } from '../ui/dialog.js';
import { grosserKnopf, karte } from '../ui/felder.js';
import { zeigeHinweis } from '../ui/hinweis.js';
import { speicher, SpeicherFehler } from '../storage.js';
import { ladeRohdatenHerunter } from '../backup.js';
import { starteImport } from './einstellungen.js';

/** Rückmeldung, die ein Neuzeichnen überstehen muss (wie in den Einstellungen). */
let letzteMeldung = null;

/**
 * @param {{neuZeichnen: () => void}} optionen
 */
export function notfallScreen({ neuZeichnen }) {
  function zeigeMeldung(meldung) {
    letzteMeldung = meldung;
    neuZeichnen();
  }

  /**
   * Nach einem erfolgreichen Einspielen sind die Daten wieder lesbar und die
   * App baut den eigentlichen Screen auf – die Bestätigung kommt dann als
   * kurzer Hinweis.
   */
  function nachImport(meldung) {
    if (meldung.art === 'erfolg') {
      letzteMeldung = null;
      zeigeHinweis(meldung.text);
      return;
    }
    zeigeMeldung(meldung);
  }

  const einspielen = grosserKnopf({
    titel: 'Backup einspielen',
    hinweis: 'Datei wählen, Vorschau prüfen',
    iconName: 'import',
    variante: 'primaer',
    beiKlick: () => starteImport(nachImport),
  });

  const herunterladen = grosserKnopf({
    titel: 'Rohdaten herunterladen',
    hinweis: 'als Textdatei, zur Sicherheit',
    iconName: 'export',
    beiKlick: () => {
      try {
        const dateiname = ladeRohdatenHerunter(speicher.rohdaten() ?? '');
        zeigeMeldung({ art: 'erfolg', text: 'Rohdaten heruntergeladen.', zusatz: dateiname });
      } catch (fehler) {
        zeigeMeldung({
          art: 'fehler',
          rolle: 'alert',
          text: 'Die Rohdaten konnten nicht heruntergeladen werden.',
          zusatz: String(fehler.message ?? fehler),
        });
      }
    },
  });

  const neuBeginnen = grosserKnopf({
    titel: 'Mit leeren Daten beginnen',
    hinweis: 'nur ohne Backup',
    iconName: 'papierkorb',
    beiKlick: () => frageNeubeginn(zeigeMeldung),
  });

  return el('div', { class: 'inhalt notfall' }, [
    el('header', { class: 'kopfzeile' }, [
      el('div', { class: 'kopfzeile__titelblock' }, [
        el('h1', { class: 'kopfzeile__titel', text: 'Daten beschädigt' }),
      ]),
    ]),

    letzteMeldung ? el('div', { class: 'meldungsbereich' }, [banner(letzteMeldung)]) : null,

    karte({
      titel: 'Die gespeicherten Daten lassen sich nicht lesen',
      klasse: 'notfall__karte',
      inhalt: [
        banner({
          art: 'fehler',
          rolle: 'alert',
          text: 'Es wurde nichts überschrieben.',
          zusatz: 'Eine Kopie der beschädigten Daten ist auf diesem Gerät gesichert. '
            + 'Am besten das letzte Backup einspielen.',
        }),
        el('div', { class: 'einstellungen__backup-knoepfe' }, [einspielen, herunterladen, neuBeginnen]),
      ],
    }),
  ]);
}

async function frageNeubeginn(zeigeMeldung) {
  const bestaetigt = await frageNach({
    titel: 'Mit leeren Daten beginnen?',
    inhalt: [
      el('p', { text: 'Die App startet ohne Teile, Kosten und Marken.' }),
      el('p', {
        class: 'dialog__hinweis',
        text: 'Die beschädigten Daten bleiben als Kopie auf diesem Gerät gesichert. '
          + 'Gibt es ein Backup, ist „Backup einspielen“ der bessere Weg.',
      }),
    ],
    warnung: 'Danach sind die bisherigen Einträge in der App nicht mehr zu sehen.',
    bestaetigenText: 'Leer beginnen',
  });

  if (!bestaetigt) return;

  try {
    speicher.neuBeginnen();
    letzteMeldung = null;
    zeigeHinweis('Mit leeren Daten begonnen');
  } catch (fehler) {
    zeigeMeldung({
      art: 'fehler',
      rolle: 'alert',
      text: 'Es konnte nicht neu begonnen werden.',
      zusatz: fehler instanceof SpeicherFehler ? fehler.message : String(fehler.message ?? fehler),
    });
  }
}
