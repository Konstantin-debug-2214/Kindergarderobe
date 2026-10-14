/**
 * jahreszeit.js – Screen "Nach Jahreszeit" (#/jahreszeit/:id).
 *
 * Zeigt nur Kleidung: Spielzeug gehört in keine Jahreszeit (CLAUDE.md).
 * Der Kategorie-Filter lässt deshalb auch Spielzeug weg (Design-Fehler).
 */

import { el, leeren } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { iconKnopf } from '../ui/knoepfe.js';
import { leererZustand, teilKarte } from '../ui/kacheln.js';
import { speicher } from '../storage.js';
import { JAHRESZEITEN, jahreszeit as jahreszeitVon, kleidungsKategorien } from '../model.js';
import { einheit, stueck, teileDerJahreszeit } from '../filters.js';

/**
 * Gewählte Kategorie des Filters. Liegt außerhalb der Zeichenfunktion, weil
 * jede Datenänderung den Screen neu aufbaut.
 */
let gewaehlteKategorie = null;
let zuletztGezeigt = null;

export function jahreszeitScreen({ jahreszeitId }, { neuZeichnen = () => {}, frisch = true } = {}) {
  const jz = jahreszeitVon(jahreszeitId);

  // Unbekannte Jahreszeit führt zurück zur Übersicht.
  if (!jz) {
    window.location.replace(`${window.location.pathname}${window.location.search}#/`);
    return el('div', { class: 'inhalt' });
  }

  // Beim Wechsel der Jahreszeit beginnt der Filter wieder bei "Alle".
  if (frisch && zuletztGezeigt !== jahreszeitId) {
    gewaehlteKategorie = null;
    zuletztGezeigt = jahreszeitId;
  }

  const alleTeile = speicher.teile();
  const liste = el('div', { class: 'jahreszeit__liste' });
  const zaehlzeile = el('p', { class: 'kopfzeile__unterzeile' });

  function zeichneListe() {
    const gefiltert = teileDerJahreszeit(alleTeile, jahreszeitId, gewaehlteKategorie);
    // Die Kopfzahl nennt immer die ganze Jahreszeit, nicht den Filter.
    const gesamt = stueck(teileDerJahreszeit(alleTeile, jahreszeitId));
    zaehlzeile.textContent = `${gesamt} ${einheit(null, gesamt)} für ${jz.name}`;

    leeren(liste).append(
      gefiltert.length > 0
        ? el(
          'div',
          { class: 'kartenraster kartenraster--vier' },
          gefiltert.map((teil) => teilKarte(teil, { variante: 'jahreszeit' })),
        )
        : leererZustand({
          text: gewaehlteKategorie
            ? 'Keine Teile in dieser Kategorie.'
            : `Noch nichts für ${jz.name}.`,
          hinweis: gewaehlteKategorie
            ? `Für ${jz.name} ist in dieser Kategorie nichts eingetragen.`
            : 'Teile bekommen ihre Jahreszeiten beim Anlegen oder Bearbeiten.',
        }),
    );
  }

  /* --- Jahreszeiten-Knöpfe ------------------------------------------------ */

  const knoepfe = el(
    'div',
    { class: 'jahreszeitwahl', role: 'group', 'aria-label': 'Jahreszeit' },
    JAHRESZEITEN.map((eintrag) => {
      const aktiv = eintrag.id === jahreszeitId;
      return el(
        'a',
        {
          class: `jahreszeitwahl__knopf${aktiv ? ' jahreszeitwahl__knopf--aktiv' : ''}`,
          href: `#/jahreszeit/${eintrag.id}`,
          'data-jahreszeit': eintrag.id,
          'aria-current': aktiv ? 'page' : null,
        },
        [
          icon(eintrag.id, 22),
          el('span', { class: 'jahreszeitwahl__texte' }, [
            el('span', { class: 'jahreszeitwahl__name', text: eintrag.name }),
            el('span', { class: 'jahreszeitwahl__monate nur-tablet', text: eintrag.monateKurz }),
          ]),
        ],
      );
    }),
  );

  /* --- Kategorie-Filter (ohne Spielzeug) ---------------------------------- */

  function kategorieKnopf(id, name) {
    const aktiv = gewaehlteKategorie === id;
    const knopfEl = el('button', {
      type: 'button',
      class: `wahl__knopf${aktiv ? ' wahl__knopf--aktiv' : ''}`,
      'aria-pressed': String(aktiv),
    }, [el('span', { text: name })]);
    knopfEl.addEventListener('click', () => {
      gewaehlteKategorie = id;
      neuZeichnen();
    });
    return knopfEl;
  }

  const kategoriewahl = el('div', { class: 'jahreszeit__kategorien' }, [
    el('p', { class: 'jahreszeit__kategorien-label', text: 'Kategorie' }),
    el('div', { class: 'wahl wahl--scrollbar' }, [
      kategorieKnopf(null, 'Alle'),
      ...kleidungsKategorien().map((k) => kategorieKnopf(k.id, k.name)),
    ]),
  ]);

  zeichneListe();

  return el('div', { class: 'inhalt jahreszeit' }, [
    el('header', { class: 'kopfzeile' }, [
      iconKnopf({ label: 'Zurück', iconName: 'zurueck', href: '#/' }),
      el('div', { class: 'kopfzeile__titelblock' }, [
        el('h1', { class: 'kopfzeile__titel', text: 'Nach Jahreszeit' }),
        zaehlzeile,
      ]),
    ]),
    knoepfe,
    kategoriewahl,
    liste,
  ]);
}
