/**
 * aussortiert.js – Screen "Aussortiert" (#/aussortiert).
 *
 * Der Papierkorb: Teile zählen nirgends mit, lassen sich aber zurückholen.
 * "Leeren" löscht endgültig; die Kosten bleiben erhalten (CLAUDE.md).
 */

import { el } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { iconKnopf, knopf } from '../ui/knoepfe.js';
import { leererZustand } from '../ui/kacheln.js';
import { zeigeHinweis } from '../ui/hinweis.js';
import { frageNach } from '../ui/dialog.js';
import { speicher, SpeicherFehler } from '../storage.js';
import { AUSSORTIER_GRUENDE, TYP, kategorie as kategorieVon } from '../model.js';
import { aussortierteNachDatum, einheit, stueck } from '../filters.js';
import { groesseText } from '../formular.js';

const DATUM_LANG = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit', month: '2-digit', year: 'numeric',
});
const DATUM_KURZ = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' });

function datumText(isoText, kurz = false) {
  if (!isoText) return null;
  const datum = new Date(isoText);
  if (Number.isNaN(datum.getTime())) return null;
  return kurz ? DATUM_KURZ.format(datum) : DATUM_LANG.format(datum);
}

function grundText(id) {
  return AUSSORTIER_GRUENDE.find((g) => g.id === id)?.name.toLowerCase() ?? null;
}

export function aussortiertScreen() {
  const teile = aussortierteNachDatum(speicher.teile());
  const anzahl = stueck(teile);

  const leeren = knopf({ text: 'Aussortiert leeren', iconName: 'papierkorb' });
  leeren.classList.add('knopf--warnung', 'nur-tablet');
  leeren.addEventListener('click', () => frageLeeren(anzahl));

  const leerenKurz = knopf({ text: 'Leeren', iconName: 'papierkorb' });
  leerenKurz.classList.add('knopf--warnung', 'nur-smartphone');
  leerenKurz.addEventListener('click', () => frageLeeren(anzahl));

  return el('div', { class: 'inhalt aussortiert' }, [
    el('header', { class: 'kopfzeile' }, [
      // Auf dem Smartphone navigiert die untere Leiste (CLAUDE.md).
      zurueckKnopf(),
      el('div', { class: 'kopfzeile__titelblock' }, [
        el('h1', { class: 'kopfzeile__titel', text: 'Aussortiert' }),
        el('p', { class: 'kopfzeile__unterzeile nur-tablet' }, [
          `${anzahl} ${einheit(null, anzahl)} · zählen nicht in Übersicht und Statistik`,
        ]),
        el('p', { class: 'kopfzeile__unterzeile nur-smartphone' }, [
          `${anzahl} ${einheit(null, anzahl)} · zählen nicht mit`,
        ]),
      ]),
      // Ohne aussortierte Teile gibt es nichts zu leeren.
      teile.length > 0
        ? el('div', { class: 'kopfzeile__aktionen' }, [leeren, leerenKurz])
        : null,
    ]),

    teile.length > 0
      ? el('div', { class: 'aussortiert__liste' }, teile.map(zeile))
      : leererZustand({
        text: 'Nichts aussortiert.',
        hinweis: 'Hier landen Teile, die du aussortierst. Du kannst sie jederzeit '
          + 'zurückholen – erst "Aussortiert leeren" löscht sie endgültig.',
      }),
  ]);

  /* --- Eine Zeile der Liste --------------------------------------------- */

  function zeile(teil) {
    const kat = kategorieVon(teil.kategorie);

    const groesse = teil.typ === TYP.KLEIDUNG
      ? (teil.groesse ? `Gr. ${groesseText(teil.groesse)}` : null)
      : (Number.isInteger(teil.alterAb) ? `ab ${teil.alterAb}` : null);

    const grund = grundText(teil.aussortiertGrund);
    const lang = datumText(teil.aussortiertAm);
    const kurz = datumText(teil.aussortiertAm, true);

    const zurueck = knopf({ text: 'Zurückholen', iconName: 'zurueckholen' });
    zurueck.classList.add('nur-tablet');
    zurueck.addEventListener('click', () => holeZurueck(teil));

    const zurueckKurz = knopf({ text: 'Zurück', iconName: 'zurueckholen' });
    zurueckKurz.classList.add('nur-smartphone');
    zurueckKurz.addEventListener('click', () => holeZurueck(teil));

    return el('div', { class: 'aussortiert__zeile' }, [
      el('span', { class: 'aussortiert__icon', 'data-kategorie': teil.kategorie }, [
        icon(teil.kategorie, 24),
      ]),
      el('div', { class: 'aussortiert__texte' }, [
        el('p', { class: 'aussortiert__name', text: teil.name }),
        el('p', {
          class: 'aussortiert__zusatz nur-tablet',
          text: [kat?.name, groesse, lang ? `aussortiert am ${lang}` : null, grund]
            .filter(Boolean).join(' · '),
        }),
        el('p', {
          class: 'aussortiert__zusatz nur-smartphone',
          text: [kurz, grund].filter(Boolean).join(' · '),
        }),
      ]),
      zurueck,
      zurueckKurz,
    ]);
  }
}

/** Zurück-Knopf nur für das Tablet. */
function zurueckKnopf() {
  const knopfEl = iconKnopf({ label: 'Zurück', iconName: 'zurueck', href: '#/' });
  knopfEl.classList.add('nur-tablet');
  return knopfEl;
}

/* --- Aktionen ------------------------------------------------------------- */

function holeZurueck(teil) {
  try {
    speicher.teilZurueckholen(teil.id);
    zeigeHinweis(`${teil.name} zurückgeholt`);
  } catch (fehler) {
    zeigeHinweis(
      fehler instanceof SpeicherFehler ? fehler.message : 'Das Teil konnte nicht zurückgeholt werden.',
      { art: 'hinweis' },
    );
  }
}

async function frageLeeren(anzahl) {
  const bestaetigt = await frageNach({
    titel: 'Aussortiert endgültig leeren?',
    inhalt: [
      el('p', {
        text: `${anzahl} ${einheit(null, anzahl)} werden gelöscht. Danach lassen sie sich nur `
          + 'über ein älteres Backup wiederherstellen.',
      }),
      el('p', {
        class: 'dialog__hinweis',
        text: 'Die Kosten bleiben erhalten: Ausgaben zählen weiter in der Kostensumme.',
      }),
    ],
    warnung: 'Das lässt sich nicht rückgängig machen.',
    bestaetigenText: 'Endgültig löschen',
  });

  if (!bestaetigt) return;

  try {
    const geloescht = speicher.aussortiertLeeren();
    zeigeHinweis(`${geloescht} ${geloescht === 1 ? 'Eintrag' : 'Einträge'} gelöscht`);
  } catch (fehler) {
    zeigeHinweis(
      fehler instanceof SpeicherFehler ? fehler.message : 'Es konnte nicht gelöscht werden.',
      { art: 'hinweis' },
    );
  }
}
