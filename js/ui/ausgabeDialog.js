/**
 * ausgabeDialog.js – Formular für eine Ausgabe als Dialog.
 *
 * Wird an drei Stellen genutzt: "Neuer Sammelkauf" im Teil-Formular,
 * "Kosten hinzufügen" auf dem Smartphone und das Bearbeiten eines Eintrags
 * in der Kosten-Ansicht. Im Design kommt der Dialog nicht vor; Aufbau im Stil
 * der übrigen Karten.
 */

import { el, leeren } from './dom.js';
import { frageNachWahl } from './dialog.js';
import { zaehler } from './formularteile.js';
import { euroTextInCent } from '../costs.js';

/** Heute als "JJJJ-MM-TT" für das Datumsfeld. */
export function heuteAlsDatum() {
  const jetzt = new Date();
  const monat = String(jetzt.getMonth() + 1).padStart(2, '0');
  const tag = String(jetzt.getDate()).padStart(2, '0');
  return `${jetzt.getFullYear()}-${monat}-${tag}`;
}

/** Cent als Text fürs Eingabefeld: 1250 -> "12,50". */
function centAlsText(cent) {
  if (!Number.isFinite(cent)) return '';
  return (cent / 100).toFixed(2).replace('.', ',');
}

/**
 * Zeigt den Dialog und gibt zurück, was der Nutzer wollte.
 * Fehlende Angaben öffnen den Dialog erneut mit einer Meldung.
 *
 * @param {{
 *   titel: string,
 *   bestaetigenText?: string,
 *   vorgabe?: {bezeichnung?: string, datum?: string, betrag?: number, anzahlTeile?: number},
 *   minTeile?: number,
 *   hinweis?: string,
 *   zugeordneteTeile?: Array<string>|null,
 *   mitLoeschen?: boolean
 * }} optionen
 * @returns {Promise<{aktion: 'speichern', werte: Object}|{aktion: 'loeschen'}|null>}
 */
export async function frageNachAusgabe({
  titel,
  bestaetigenText = 'Speichern',
  vorgabe = {},
  minTeile = 1,
  hinweis,
  zugeordneteTeile = null,
  mitLoeschen = false,
}) {
  const werte = {
    bezeichnung: vorgabe.bezeichnung ?? '',
    datum: vorgabe.datum ?? heuteAlsDatum(),
    betragText: Number.isFinite(vorgabe.betrag) ? centAlsText(vorgabe.betrag) : '',
    anzahlTeile: Math.max(minTeile, vorgabe.anzahlTeile ?? minTeile),
  };

  let fehlertext = '';

  for (;;) {
    // eslint-disable-next-line no-await-in-loop
    const antwort = await zeigeDialog();

    if (antwort === null || antwort === 'abbrechen') return null;
    if (antwort === 'loeschen') return { aktion: 'loeschen' };

    const betrag = euroTextInCent(werte.betragText);

    if (werte.bezeichnung.trim() === '') {
      fehlertext = 'Bitte angeben, wofür das Geld ausgegeben wurde.';
    } else if (betrag === null || betrag <= 0) {
      fehlertext = 'Bitte einen Betrag über 0 eintragen, z. B. 25,00.';
    } else {
      return {
        aktion: 'speichern',
        werte: {
          bezeichnung: werte.bezeichnung.trim(),
          datum: werte.datum || heuteAlsDatum(),
          betrag,
          anzahlTeile: werte.anzahlTeile,
        },
      };
    }
  }

  function zeigeDialog() {
    const kennung = Math.random().toString(36).slice(2, 8);
    const idWofuer = `ausgabe-wofuer-${kennung}`;
    const idDatum = `ausgabe-datum-${kennung}`;
    const idBetrag = `ausgabe-betrag-${kennung}`;

    const bezeichnung = el('input', {
      id: idWofuer, class: 'feld__eingabe', type: 'text',
      placeholder: 'z. B. Flohmarkt Kita', autocomplete: 'off',
    });
    bezeichnung.value = werte.bezeichnung;
    bezeichnung.addEventListener('input', () => { werte.bezeichnung = bezeichnung.value; });

    const datum = el('input', { id: idDatum, class: 'feld__eingabe', type: 'date' });
    datum.value = werte.datum;
    datum.addEventListener('input', () => { werte.datum = datum.value; });

    const betrag = el('input', {
      id: idBetrag, class: 'eurofeld__eingabe', type: 'text',
      inputmode: 'decimal', placeholder: '0,00', 'aria-label': 'Gesamtbetrag in Euro',
    });
    betrag.value = werte.betragText;
    betrag.addEventListener('input', () => { werte.betragText = betrag.value; });

    // Zähler und Zuordnungstext hängen zusammen und werden hier getauscht,
    // ohne den ganzen Dialog neu aufzubauen.
    const zaehlerBereich = el('div', {});
    const zuordnungBereich = el('div', {});

    function zeichneZaehler() {
      leeren(zaehlerBereich).append(zaehler({
        wert: werte.anzahlTeile,
        min: minTeile,
        label: 'Anzahl Teile',
        beiAenderung: (wert) => {
          werte.anzahlTeile = wert;
          zeichneZaehler();
          zeichneZuordnung();
        },
      }));
    }

    function zeichneZuordnung() {
      leeren(zuordnungBereich);
      if (!zugeordneteTeile) return;
      zuordnungBereich.append(zuordnung(zugeordneteTeile, werte.anzahlTeile));
    }

    zeichneZaehler();
    zeichneZuordnung();

    const aktionen = [];
    if (mitLoeschen) aktionen.push({ text: 'Löschen', wert: 'loeschen', variante: 'warnung' });
    aktionen.push({ text: 'Abbrechen', wert: 'abbrechen' });
    aktionen.push({ text: bestaetigenText, wert: 'speichern', variante: 'primaer' });

    return frageNachWahl({
      titel,
      aktionen,
      inhalt: [
        el('div', { class: 'abschnitt' }, [
          el('label', { class: 'abschnitt__label', for: idWofuer, text: 'Wofür?' }),
          bezeichnung,
        ]),
        el('div', { class: 'ausgabefelder' }, [
          el('div', { class: 'abschnitt' }, [
            el('label', { class: 'abschnitt__label', for: idDatum, text: 'Datum' }),
            datum,
          ]),
          el('div', { class: 'abschnitt' }, [
            el('label', { class: 'abschnitt__label', for: idBetrag, text: 'Gesamtbetrag' }),
            el('div', { class: 'eurofeld' }, [
              betrag,
              el('span', { class: 'eurofeld__zeichen', text: '€' }),
            ]),
          ]),
        ]),
        el('div', { class: 'abschnitt' }, [
          el('p', { class: 'abschnitt__label', text: 'Anzahl Teile' }),
          zaehlerBereich,
        ]),
        hinweis ? el('p', { class: 'dialog__hinweis', text: hinweis }) : null,
        zuordnungBereich,
        fehlertext ? el('p', { class: 'feldfehler', role: 'alert', text: fehlertext }) : null,
      ].filter(Boolean),
    });
  }
}

/** "3 von 6 Teilen zugeordnet" samt Namen. */
function zuordnung(namen, anzahlTeile) {
  return el('div', { class: 'zuordnung' }, [
    el('p', {
      class: 'zuordnung__kopf',
      text: `${namen.length} von ${anzahlTeile} ${anzahlTeile === 1 ? 'Teil' : 'Teilen'} zugeordnet`,
    }),
    el('p', {
      class: 'zuordnung__namen',
      text: namen.length > 0 ? namen.join(' · ') : 'Noch kein Teil zugeordnet.',
    }),
  ]);
}
