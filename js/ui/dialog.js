/**
 * dialog.js – Rückfragen und Auswahl auf einer Ebene über dem Screen.
 *
 * Nutzt das eingebaute <dialog> als modalen Dialog: Escape schließt,
 * der Fokus bleibt im Dialog, der Rest der Seite ist nicht bedienbar.
 * Im Design kommen Dialoge nicht vor; Aufbau im Stil der übrigen Karten.
 */

import { el } from './dom.js';
import { icon } from './icons.js';
import { knopf } from './knoepfe.js';

/**
 * Öffnet einen Dialog und löst auf, womit er geschlossen wurde.
 * @param {{
 *   titel: string,
 *   koerper: (schliesse: (antwort: *) => void) => Array<Node>,
 *   breit?: boolean
 * }} optionen
 * @returns {Promise<*>}
 */
function oeffneDialog({ titel, koerper, breit = false }) {
  return new Promise((fertig) => {
    let entschieden = false;

    function schliesse(antwort) {
      if (entschieden) return;
      entschieden = true;
      dialog.close();
      dialog.remove();
      fertig(antwort);
    }

    const titelId = `dialog-titel-${Math.random().toString(36).slice(2, 8)}`;

    const dialog = el(
      'dialog',
      { class: `dialog${breit ? ' dialog--breit' : ''}`, 'aria-labelledby': titelId },
      [
        el('div', { class: 'dialog__inhalt' }, [
          el('h2', { class: 'dialog__titel', id: titelId, text: titel }),
          ...koerper(schliesse),
        ]),
      ],
    );

    // Escape und Klick auf den Hintergrund gelten als Abbruch.
    dialog.addEventListener('cancel', (ereignis) => {
      ereignis.preventDefault();
      schliesse(null);
    });
    dialog.addEventListener('click', (ereignis) => {
      if (ereignis.target === dialog) schliesse(null);
    });

    document.body.append(dialog);
    dialog.showModal();
    dialog.querySelector('input, select, textarea, button')?.focus();
  });
}

/**
 * Rückfrage mit Bestätigen und Abbrechen.
 * @param {{
 *   titel: string,
 *   inhalt?: Array<Node>,
 *   warnung?: string,
 *   bestaetigenText?: string,
 *   abbrechenText?: string
 * }} optionen
 * @returns {Promise<boolean>} true, wenn bestätigt wurde
 */
export async function frageNach({
  titel,
  inhalt = [],
  warnung,
  bestaetigenText = 'Bestätigen',
  abbrechenText = 'Abbrechen',
}) {
  const antwort = await oeffneDialog({
    titel,
    koerper: (schliesse) => {
      const abbrechen = knopf({ text: abbrechenText });
      const bestaetigen = knopf({ text: bestaetigenText, variante: 'primaer' });
      abbrechen.addEventListener('click', () => schliesse(false));
      bestaetigen.addEventListener('click', () => schliesse(true));

      return [
        ...inhalt,
        warnung ? el('p', { class: 'dialog__warnung', text: warnung }) : null,
        el('div', { class: 'dialog__aktionen' }, [abbrechen, bestaetigen]),
      ].filter(Boolean);
    },
  });

  return antwort === true;
}

/**
 * Rückfrage mit mehreren Antworten, z. B. Löschen / Abbrechen / Speichern.
 * @param {{
 *   titel: string,
 *   inhalt?: Array<Node>,
 *   warnung?: string,
 *   aktionen: Array<{text: string, wert: string, variante?: 'primaer'|'leise'|'warnung'}>
 * }} optionen
 * @returns {Promise<string|null>} der gewählte Wert, oder null bei Abbruch
 */
export function frageNachWahl({ titel, inhalt = [], warnung, aktionen }) {
  return oeffneDialog({
    titel,
    koerper: (schliesse) => {
      const knoepfe = aktionen.map((aktion) => {
        const knopfEl = knopf({
          text: aktion.text,
          variante: aktion.variante === 'primaer' ? 'primaer' : 'leise',
        });
        if (aktion.variante === 'warnung') knopfEl.classList.add('knopf--warnung');
        knopfEl.addEventListener('click', () => schliesse(aktion.wert));
        return knopfEl;
      });

      return [
        ...inhalt,
        warnung ? el('p', { class: 'dialog__warnung', text: warnung }) : null,
        el('div', { class: 'dialog__aktionen dialog__aktionen--mehrere' }, knoepfe),
      ].filter(Boolean);
    },
  });
}

/**
 * Auswahl aus einer Liste. Ein Tipp auf einen Eintrag wählt ihn aus.
 * @param {{
 *   titel: string,
 *   eintraege: Array<{wert: string, titel: string, hinweis?: string, zusatz?: string}>,
 *   leerText?: string,
 *   weitereAktion?: {text: string, wert: string, iconName?: string}
 * }} optionen
 * @returns {Promise<string|null>} der gewählte Wert, oder null bei Abbruch
 */
export function waehleAus({ titel, eintraege, leerText, weitereAktion }) {
  return oeffneDialog({
    titel,
    koerper: (schliesse) => {
      const liste = el(
        'div',
        { class: 'auswahlliste' },
        eintraege.map((eintrag) => {
          const zeile = el('button', { type: 'button', class: 'auswahlliste__eintrag' }, [
            el('span', { class: 'auswahlliste__texte' }, [
              el('span', { class: 'auswahlliste__titel', text: eintrag.titel }),
              eintrag.hinweis
                ? el('span', { class: 'auswahlliste__hinweis', text: eintrag.hinweis })
                : null,
            ]),
            eintrag.zusatz
              ? el('span', { class: 'auswahlliste__zusatz', text: eintrag.zusatz })
              : null,
            icon('pfeil-rechts', 18),
          ]);
          zeile.addEventListener('click', () => schliesse(eintrag.wert));
          return zeile;
        }),
      );

      const abbrechen = knopf({ text: 'Abbrechen' });
      abbrechen.addEventListener('click', () => schliesse(null));

      const unten = [abbrechen];
      if (weitereAktion) {
        const weiter = knopf({
          text: weitereAktion.text,
          variante: 'primaer',
          iconName: weitereAktion.iconName ?? 'plus',
        });
        weiter.addEventListener('click', () => schliesse(weitereAktion.wert));
        unten.push(weiter);
      }

      return [
        eintraege.length === 0 && leerText
          ? el('p', { class: 'dialog__leer', text: leerText })
          : null,
        eintraege.length > 0 ? liste : null,
        el('div', { class: 'dialog__aktionen' }, unten),
      ].filter(Boolean);
    },
  });
}

/**
 * Dialog zum Pflegen einer Liste: Einträge lassen sich löschen, das Ergebnis
 * wird sofort gespeichert. Schließt mit "Fertig".
 * @param {{
 *   titel: string,
 *   hinweis?: string,
 *   eintraege: () => Array<string>,
 *   beiLoeschen: (eintrag: string) => void,
 *   leerText?: string
 * }} optionen
 * @returns {Promise<void>}
 */
export function pflegeListe({ titel, hinweis, eintraege, beiLoeschen, leerText }) {
  return oeffneDialog({
    titel,
    koerper: (schliesse) => {
      const liste = el('div', { class: 'pflegeliste' });

      function zeichne() {
        const werte = eintraege();
        liste.replaceChildren(
          ...(werte.length === 0
            ? [el('p', { class: 'dialog__leer', text: leerText ?? 'Noch nichts vorhanden.' })]
            : werte.map((wert) => {
              const loeschen = el('button', {
                type: 'button',
                class: 'icon-knopf pflegeliste__loeschen',
                'aria-label': `${wert} löschen`,
                title: `${wert} löschen`,
              }, [icon('schliessen', 20)]);
              loeschen.addEventListener('click', () => {
                beiLoeschen(wert);
                zeichne();
              });
              return el('div', { class: 'pflegeliste__zeile' }, [
                el('span', { class: 'pflegeliste__name', text: wert }),
                loeschen,
              ]);
            })),
        );
      }

      zeichne();

      const fertig = knopf({ text: 'Fertig', variante: 'primaer' });
      fertig.addEventListener('click', () => schliesse(true));

      return [
        hinweis ? el('p', { class: 'dialog__hinweis', text: hinweis }) : null,
        liste,
        el('div', { class: 'dialog__aktionen' }, [fertig]),
      ].filter(Boolean);
    },
  });
}
