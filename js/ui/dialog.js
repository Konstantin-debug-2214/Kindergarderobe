/**
 * dialog.js – Rückfragen auf einer Ebene über dem Screen.
 *
 * Nutzt das eingebaute <dialog> als modalen Dialog: Escape schließt,
 * der Fokus bleibt im Dialog, der Rest der Seite ist nicht bedienbar.
 * Im Design kommen Dialoge nicht vor; Aufbau im Stil der übrigen Karten.
 */

import { el } from './dom.js';
import { knopf } from './knoepfe.js';

/**
 * Zeigt eine Rückfrage und löst erst auf, wenn der Nutzer entschieden hat.
 * @param {{
 *   titel: string,
 *   inhalt?: Array<Node>,
 *   warnung?: string,
 *   bestaetigenText?: string,
 *   abbrechenText?: string,
 *   gefahr?: boolean
 * }} optionen
 * @returns {Promise<boolean>} true, wenn bestätigt wurde
 */
export function frageNach({
  titel,
  inhalt = [],
  warnung,
  bestaetigenText = 'Bestätigen',
  abbrechenText = 'Abbrechen',
}) {
  return new Promise((fertig) => {
    const abbrechen = knopf({ text: abbrechenText });
    const bestaetigen = knopf({ text: bestaetigenText, variante: 'primaer' });

    const dialog = el('dialog', { class: 'dialog', 'aria-labelledby': 'dialog-titel' }, [
      el('div', { class: 'dialog__inhalt' }, [
        el('h2', { class: 'dialog__titel', id: 'dialog-titel', text: titel }),
        ...inhalt,
        warnung ? el('p', { class: 'dialog__warnung', text: warnung }) : null,
        el('div', { class: 'dialog__aktionen' }, [abbrechen, bestaetigen]),
      ]),
    ]);

    let entschieden = false;
    function schliesse(antwort) {
      if (entschieden) return;
      entschieden = true;
      dialog.close();
      dialog.remove();
      fertig(antwort);
    }

    abbrechen.addEventListener('click', () => schliesse(false));
    bestaetigen.addEventListener('click', () => schliesse(true));
    // Escape und Klick auf den Hintergrund gelten als Abbruch.
    dialog.addEventListener('cancel', (ereignis) => {
      ereignis.preventDefault();
      schliesse(false);
    });
    dialog.addEventListener('click', (ereignis) => {
      if (ereignis.target === dialog) schliesse(false);
    });

    document.body.append(dialog);
    dialog.showModal();
    bestaetigen.focus();
  });
}
