/**
 * uebersicht.js – Screen "Übersicht" (#/).
 *
 * In diesem Auftrag echt: Datum, Begrüßung mit gespeichertem Namen und der
 * Backup-Banner. Kacheln und Suche bleiben Platzhalter.
 */

import { el } from '../ui/dom.js';
import { iconKnopf, knopf, suchfeld } from '../ui/knoepfe.js';
import { banner } from '../ui/banner.js';
import { speicher } from '../storage.js';
import { backupAlterInTagen, bannerSichtbar, exportiereBackup } from '../backup.js';
import { alterText, begruessung } from './einstellungen.js';
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

/** Text des Backup-Hinweises, abhängig davon, ob es schon ein Backup gibt. */
export function bannerText(letztesBackupAm, heute = new Date()) {
  const tage = backupAlterInTagen(letztesBackupAm, heute);

  if (tage === null) {
    return 'Es gibt noch kein Backup. Zeit, die Daten zu sichern.';
  }
  if (tage === 0) {
    return 'Seit dem letzten Backup hat sich etwas geändert. Zeit, die Daten zu sichern.';
  }
  return `Das letzte Backup ist ${alterText(tage).replace('vor ', '')} alt. `
    + 'Zeit, die Daten zu sichern.';
}

function backupBanner(einstellungen, neuZeichnen) {
  if (!bannerSichtbar(einstellungen, speicher.bannerAusgeblendetBei())) return null;

  const sichern = knopf({ text: 'Jetzt sichern', variante: 'primaer' });
  sichern.addEventListener('click', async () => {
    sichern.disabled = true;
    try {
      await exportiereBackup(speicher);
    } finally {
      sichern.disabled = false;
    }
  });

  return banner({
    art: 'hinweis',
    text: bannerText(einstellungen.letztesBackupAm),
    aktionen: [sichern],
    beiSchliessen: () => {
      // Den Zählerstand merken: Jede Änderung erhöht ihn, dadurch erscheint
      // der Hinweis von selbst wieder – auch nach einem Neuladen.
      speicher.bannerAusblenden(einstellungen.aenderungenSeitBackup);
      neuZeichnen();
    },
  });
}

export function uebersichtScreen(parameter, { neuZeichnen = () => {} } = {}) {
  const einstellungen = speicher.einstellungen();

  const begruessungsBlock = el('div', { class: 'uebersicht__begruessung' }, [
    el('p', { class: 'uebersicht__datum', text: heutigesDatum() }),
    el('h1', { class: 'uebersicht__hallo', text: begruessung(einstellungen.name) }),
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
  const werkzeugeSmartphone = el('div', { class: 'uebersicht__werkzeuge nur-smartphone' }, [
    iconKnopf({ label: 'Kosten', iconName: 'euro', href: '#/kosten' }),
  ]);

  const sucheSmartphone = el('div', { class: 'uebersicht__suche-zeile nur-smartphone' }, [
    suchfeld({
      label: 'Kleidung oder Spielzeug suchen',
      platzhalter: 'Kleidung oder Spielzeug suchen',
    }),
  ]);

  const hinweis = backupBanner(einstellungen, neuZeichnen);

  return el('div', { class: 'inhalt' }, [
    el('header', { class: 'uebersicht__kopf' }, [
      begruessungsBlock,
      werkzeugeTablet,
      werkzeugeSmartphone,
    ]),
    sucheSmartphone,
    hinweis ? el('div', { class: 'uebersicht__banner' }, [hinweis]) : null,
    el('section', { class: 'karte platzhalter' }, [
      el('p', { class: 'platzhalter__marke', text: 'Platzhalter' }),
      el('p', {
        class: 'platzhalter__hinweis',
        text:
          'Hier stehen später die sechs Kategorie-Kacheln mit Stückzahl und die vier '
          + 'Jahreszeiten-Kacheln.',
      }),
    ]),
    testlinks('Testlinks (vorläufig)', [
      knopf({ text: 'Kategorie: Oberteile', href: `#/kategorie/${BEISPIEL_KATEGORIE}` }),
      knopf({ text: 'Jahreszeit: Herbst', href: `#/jahreszeit/${BEISPIEL_JAHRESZEIT}` }),
      knopf({ text: 'Teil (Beispiel)', href: `#/teil/${BEISPIEL_TEIL}` }),
    ]),
  ]);
}
