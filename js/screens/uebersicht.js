/**
 * uebersicht.js – Screen "Übersicht" (#/).
 *
 * Noch ohne Daten: Kacheln, Suche und Backup-Banner kommen in späteren
 * Aufträgen. Vorhanden sind die Kopf-Knöpfe und Testlinks, damit sich alle
 * Routen erreichen lassen.
 */

import { el } from '../ui/dom.js';
import { iconKnopf, knopf, suchfeld } from '../ui/knoepfe.js';
import { testlinks } from './platzhalter.js';

/** Beispielwerte für die Testlinks. */
const BEISPIEL_KATEGORIE = 'oberteile';
const BEISPIEL_JAHRESZEIT = 'herbst';
const BEISPIEL_TEIL = 'beispiel-teil';

/** Formatiert das heutige Datum, z. B. "Montag, 13. Oktober". */
function heutigesDatum() {
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
}

export function uebersichtScreen() {
  const begruessung = el('div', { class: 'uebersicht__begruessung' }, [
    el('p', { class: 'uebersicht__datum', text: heutigesDatum() }),
    el('h1', { class: 'uebersicht__hallo', text: 'Hallo, [Name]!' }),
  ]);

  // Tablet: alle Ziele liegen offen in der Kopfzeile.
  const werkzeugeTablet = el('div', { class: 'uebersicht__werkzeuge nur-tablet' }, [
    suchfeld({
      label: 'Kleidung oder Spielzeug suchen',
      platzhalter: 'Kleidung oder Spielzeug suchen',
      klasse: 'uebersicht__suche',
    }),
    knopf({ text: 'Kosten', href: '#/kosten', iconName: 'euro' }),
    iconKnopf({ label: 'Statistik', iconName: 'statistik', href: '#/statistik' }),
    iconKnopf({ label: 'Aussortiert', iconName: 'aussortiert', href: '#/aussortiert' }),
    iconKnopf({ label: 'Einstellungen', iconName: 'einstellungen', href: '#/einstellungen' }),
    knopf({ text: 'Teil hinzufügen', href: '#/neu', iconName: 'plus', variante: 'primaer' }),
  ]);

  // Smartphone: nur der "€"-Knopf; alles Weitere liegt in der unteren Leiste.
  const werkzeugeSmartphone = el(
    'div',
    { class: 'uebersicht__werkzeuge nur-smartphone' },
    [iconKnopf({ label: 'Kosten', iconName: 'euro', href: '#/kosten' })],
  );

  const sucheSmartphone = el(
    'div',
    { class: 'uebersicht__suche-zeile nur-smartphone' },
    [
      suchfeld({
        label: 'Kleidung oder Spielzeug suchen',
        platzhalter: 'Kleidung oder Spielzeug suchen',
      }),
    ],
  );

  return el('div', { class: 'inhalt' }, [
    el('header', { class: 'uebersicht__kopf' }, [begruessung, werkzeugeTablet, werkzeugeSmartphone]),
    sucheSmartphone,
    el('section', { class: 'karte platzhalter' }, [
      el('p', { class: 'platzhalter__marke', text: 'Platzhalter' }),
      el('p', {
        class: 'platzhalter__hinweis',
        text:
          'Hier stehen später die sechs Kategorie-Kacheln mit Stückzahl, die vier '
          + 'Jahreszeiten-Kacheln und der Backup-Hinweis.',
      }),
    ]),
    testlinks('Testlinks (vorläufig)', [
      knopf({ text: 'Kategorie: Oberteile', href: `#/kategorie/${BEISPIEL_KATEGORIE}` }),
      knopf({ text: 'Jahreszeit: Herbst', href: `#/jahreszeit/${BEISPIEL_JAHRESZEIT}` }),
      knopf({ text: 'Teil (Beispiel)', href: `#/teil/${BEISPIEL_TEIL}` }),
    ]),
  ]);
}
