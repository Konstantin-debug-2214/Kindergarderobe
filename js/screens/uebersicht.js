/**
 * uebersicht.js – Screen "Übersicht" (#/).
 *
 * Datum, Begrüßung, Backup-Hinweis, sechs Kategorie-Kacheln, vier
 * Jahreszeiten-Kacheln. Beim Tippen in die Suche treten die Treffer an die
 * Stelle der Kacheln.
 */

import { el, leeren } from '../ui/dom.js';
import { iconKnopf, knopf, suchfeld } from '../ui/knoepfe.js';
import { banner } from '../ui/banner.js';
import { jahreszeitKachel, kategorieKachel, leererZustand, teilKarte } from '../ui/kacheln.js';
import { speicher } from '../storage.js';
import { backupAlterInTagen, bannerSichtbar, exportiereBackup } from '../backup.js';
import {
  einheit,
  imSchrank,
  stueck,
  suche as sucheTeile,
  zaehleJeJahreszeit,
  zaehleJeKategorie,
} from '../filters.js';
import { JAHRESZEITEN, KATEGORIEN, aktuelleJahreszeit } from '../model.js';
import { alterText, begruessung } from './einstellungen.js';
import { setzeKategorieZustandZurueck } from './kategorie.js';

/**
 * Suchbegriff der Übersicht. Liegt außerhalb der Zeichenfunktion, weil jede
 * Datenänderung den Screen neu aufbaut. Beim Betreten wird er geleert.
 */
let suchbegriff = '';

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

export function uebersichtScreen(parameter, { neuZeichnen = () => {}, frisch = true } = {}) {
  if (frisch) {
    suchbegriff = '';
    // Beim Zurück zur Übersicht fallen Filter und Suche einer Kategorie weg.
    setzeKategorieZustandZurueck();
  }

  const einstellungen = speicher.einstellungen();
  const teile = speicher.teile();

  const begruessungsBlock = el('div', { class: 'uebersicht__begruessung' }, [
    el('p', { class: 'uebersicht__datum', text: heutigesDatum() }),
    el('h1', { class: 'uebersicht__hallo', text: begruessung(einstellungen.name) }),
  ]);

  // Beim Tippen wird nur dieser Bereich getauscht, damit der Fokus im
  // Suchfeld bleibt.
  const ergebnis = el('div', { class: 'uebersicht__ergebnis' });

  function zeichneErgebnis() {
    leeren(ergebnis).append(
      suchbegriff.trim() === '' ? kachelBereiche(teile) : trefferBereich(teile, suchbegriff),
    );
  }

  function sucheFeld(klasse) {
    return suchfeld({
      label: 'Kleidung oder Spielzeug suchen',
      platzhalter: 'Kleidung oder Spielzeug suchen',
      klasse,
      wert: suchbegriff,
      beiEingabe: (wert) => {
        suchbegriff = wert;
        zeichneErgebnis();
      },
    });
  }

  // Tablet: alle Ziele liegen offen in der Kopfzeile.
  const werkzeugeTablet = el('div', { class: 'uebersicht__werkzeuge nur-tablet' }, [
    sucheFeld('uebersicht__suche'),
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
    sucheFeld(),
  ]);

  const hinweis = backupBanner(einstellungen, neuZeichnen);
  zeichneErgebnis();

  return el('div', { class: 'inhalt' }, [
    el('header', { class: 'uebersicht__kopf' }, [
      begruessungsBlock,
      werkzeugeTablet,
      werkzeugeSmartphone,
    ]),
    sucheSmartphone,
    hinweis ? el('div', { class: 'uebersicht__banner' }, [hinweis]) : null,
    ergebnis,
  ]);
}

/* --- Kacheln -------------------------------------------------------------- */

function kachelBereiche(teile) {
  const jeKategorie = zaehleJeKategorie(teile);
  const jeJahreszeit = zaehleJeJahreszeit(teile);
  const gesamt = stueck(imSchrank(teile));
  const jetzt = aktuelleJahreszeit();

  return el('div', {}, [
    el('section', { class: 'bereich' }, [
      el('div', { class: 'bereich__kopf' }, [
        el('h2', { class: 'bereich__titel', text: 'Kategorien' }),
        el('p', {
          class: 'bereich__zusatz',
          text: `${gesamt} ${einheit(null, gesamt)} insgesamt`,
        }),
      ]),
      el(
        'div',
        { class: 'kachelraster' },
        KATEGORIEN.map((k) => kategorieKachel({
          id: k.id,
          name: k.name,
          anzahl: jeKategorie[k.id] ?? 0,
        })),
      ),
    ]),

    el('section', { class: 'bereich' }, [
      el('div', { class: 'bereich__kopf' }, [
        el('h2', { class: 'bereich__titel', text: 'Nach Jahreszeit' }),
      ]),
      el(
        'div',
        { class: 'jahreszeitraster' },
        JAHRESZEITEN.map((j) => jahreszeitKachel({
          id: j.id,
          name: j.name,
          monate: j.monateKurz,
          anzahl: jeJahreszeit[j.id] ?? 0,
          jetzt: j.id === jetzt,
        })),
      ),
    ]),
  ]);
}

/* --- Suchtreffer ---------------------------------------------------------- */

function trefferBereich(teile, begriff) {
  const treffer = sucheTeile(teile, begriff);

  if (treffer.length === 0) {
    return el('section', { class: 'bereich' }, [
      leererZustand({
        text: `Nichts gefunden für „${begriff.trim()}“.`,
        hinweis: 'Gesucht wird in Name, Art, Marke, Notiz und freien Merkmalen. '
          + 'Aussortierte Teile erscheinen hier nicht.',
      }),
    ]);
  }

  const gefunden = stueck(treffer);

  return el('section', { class: 'bereich' }, [
    el('div', { class: 'bereich__kopf' }, [
      el('h2', { class: 'bereich__titel', text: 'Treffer' }),
      el('p', {
        class: 'bereich__zusatz',
        text: `${gefunden} ${einheit(null, gefunden)} gefunden`,
      }),
    ]),
    el(
      'div',
      { class: 'kartenraster' },
      treffer.map((teil) => teilKarte(teil, { zeigeKategorie: true })),
    ),
  ]);
}

/* --- Backup-Hinweis ------------------------------------------------------- */

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
