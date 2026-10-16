/**
 * statistik.js – Screen "Statistik" (#/statistik).
 *
 * Gezählt wird nach Stück, Aussortiertes bleibt überall außen vor.
 * Spielzeug erscheint nur in der Gesamtzahl, bei den Kategorien und in
 * "Spielzeug nach Art" – nicht bei Jahreszeiten, Arten oder Größen.
 */

import { el } from '../ui/dom.js';
import { iconKnopf, knopf } from '../ui/knoepfe.js';
import { balkenListe, diagrammKarte, saeulenDiagramm } from '../ui/diagramme.js';
import { speicher } from '../storage.js';
import { JAHRESZEITEN, KATEGORIEN, TYP } from '../model.js';
import {
  gesamtImSchrank,
  haeufigsteArten,
  zaehleJeGroesse,
  zaehleJeJahreszeit,
  zaehleJeKategorie,
} from '../filters.js';

export function statistikScreen() {
  const teile = speicher.teile();
  const gesamt = gesamtImSchrank(teile);

  const jeKategorie = zaehleJeKategorie(teile);
  const jeJahreszeit = zaehleJeJahreszeit(teile);
  const kleidungsArten = haeufigsteArten(teile, { typ: TYP.KLEIDUNG });
  const spielzeugArten = haeufigsteArten(teile, { typ: TYP.SPIELZEUG });
  const jeGroesse = zaehleJeGroesse(teile);

  const sollMengen = knopf({
    text: 'Soll-Mengen & Saisonwechsel',
    href: '#/saisonwechsel',
    iconName: 'liste',
  });

  return el('div', { class: 'inhalt statistik' }, [
    el('header', { class: 'kopfzeile' }, [
      // Auf dem Smartphone navigiert die untere Leiste (CLAUDE.md).
      zurueckKnopf(),
      el('div', { class: 'kopfzeile__titelblock' }, [
        el('h1', { class: 'kopfzeile__titel', text: 'Statistik' }),
        el('p', {
          class: 'kopfzeile__unterzeile',
          text: `${gesamt} ${gesamt === 1 ? 'Teil' : 'Teile'} im Schrank · `
            + 'Aussortiertes zählt nicht mit · Tippe auf einen Wert, um die Teile zu sehen',
        }),
      ]),
      el('div', { class: 'kopfzeile__aktionen nur-tablet' }, [sollMengen]),
    ]),

    // Smartphone: die Verweis-Karte steht oben, wie im Design.
    el('a', { class: 'verweiskarte nur-smartphone', href: '#/saisonwechsel' }, [
      el('span', { class: 'verweiskarte__text', text: 'Soll-Mengen & Saisonwechsel' }),
    ]),

    el('div', { class: 'statistik__raster' }, [
      diagrammKarte({
        titel: 'Nach Kategorie',
        inhalt: balkenListe({
          eintraege: KATEGORIEN.map((k) => ({
            name: k.name,
            anzahl: jeKategorie[k.id] ?? 0,
            ziel: `#/kategorie/${k.id}`,
          })),
        }),
      }),

      diagrammKarte({
        titel: 'Art der Kleidung',
        zusatz: 'die häufigsten 7',
        inhalt: balkenListe({
          eintraege: kleidungsArten.map((eintrag) => ({
            name: eintrag.wert,
            anzahl: eintrag.anzahl,
            ziel: `#/?art=${encodeURIComponent(eintrag.wert)}`,
          })),
          leerText: 'Noch keine Kleidung eingetragen.',
        }),
      }),

      diagrammKarte({
        titel: 'Nach Jahreszeit',
        inhalt: balkenListe({
          eintraege: JAHRESZEITEN.map((j) => ({
            name: j.name,
            anzahl: jeJahreszeit[j.id] ?? 0,
            iconName: j.id,
            ziel: `#/jahreszeit/${j.id}`,
          })),
        }),
        hinweis: 'Ein Teil kann zu mehreren Jahreszeiten gehören.',
      }),

      diagrammKarte({
        titel: 'Nach Größe',
        inhalt: saeulenDiagramm({
          eintraege: jeGroesse.map((eintrag) => ({
            name: String(eintrag.wert),
            anzahl: eintrag.anzahl,
            ziel: `#/?groesse=${eintrag.wert}`,
          })),
          leerText: 'Noch keine Teile mit Konfektionsgröße.',
        }),
        hinweis: 'Nur Konfektionsgrößen. Eine Doppelgröße wie 98/104 zählt bei beiden Größen.',
      }),

      diagrammKarte({
        titel: 'Spielzeug nach Art',
        zusatz: 'die häufigsten 7',
        inhalt: balkenListe({
          eintraege: spielzeugArten.map((eintrag) => ({
            name: eintrag.wert,
            anzahl: eintrag.anzahl,
            ziel: `#/?art=${encodeURIComponent(eintrag.wert)}`,
          })),
          leerText: 'Noch kein Spielzeug eingetragen.',
        }),
      }),
    ]),
  ]);
}

/** Zurück-Knopf nur für das Tablet. */
function zurueckKnopf() {
  const knopfEl = iconKnopf({ label: 'Zurück', iconName: 'zurueck', href: '#/' });
  knopfEl.classList.add('nur-tablet');
  return knopfEl;
}
