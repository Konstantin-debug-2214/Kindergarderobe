/**
 * kacheln.js – Kacheln der Übersicht und Karten eines Teils.
 *
 * Alles, was ein Teil zeigt, trägt die Farbe seiner Kategorie
 * (Farbregel in CLAUDE.md). Das Feld `farbe` färbt nichts.
 */

import { el } from './dom.js';
import { icon } from './icons.js';
import { JAHRESZEITEN, MERKMAL, TYP, kategorie } from '../model.js';
import { einheit } from '../filters.js';
import { groesseText } from '../formular.js';

/**
 * Kachel einer Kategorie: Icon, Stückzahl mit Einheit, Name.
 * @param {{id: string, name: string, anzahl: number}} optionen
 */
export function kategorieKachel({ id, name, anzahl }) {
  return el('a', { class: 'kachel', href: `#/kategorie/${id}`, 'data-kategorie': id }, [
    el('div', { class: 'kachel__kopf' }, [
      icon(id, 30),
      el('div', { class: 'kachel__zahl' }, [
        el('span', { class: 'kachel__wert', text: String(anzahl) }),
        el('span', { class: 'kachel__einheit', text: einheit(id, anzahl) }),
      ]),
    ]),
    el('p', { class: 'kachel__name', text: name }),
  ]);
}

/**
 * Kachel einer Jahreszeit: Icon, Name, Monate, Stückzahl.
 * Die aktuelle Jahreszeit bekommt Fläche, Rahmen in der Akzentfarbe und die
 * Marke "Jetzt".
 * @param {{id: string, name: string, monate: string, anzahl: number, jetzt: boolean}} optionen
 */
export function jahreszeitKachel({ id, name, monate, anzahl, jetzt }) {
  return el(
    'a',
    {
      class: `jahreszeit-kachel${jetzt ? ' jahreszeit-kachel--jetzt' : ''}`,
      href: `#/jahreszeit/${id}`,
      'data-jahreszeit': id,
    },
    [
      jetzt ? el('span', { class: 'jahreszeit-kachel__jetzt', text: 'Jetzt' }) : null,
      icon(id, 24),
      el('div', { class: 'jahreszeit-kachel__texte' }, [
        el('p', { class: 'jahreszeit-kachel__name', text: name }),
        el('p', { class: 'jahreszeit-kachel__monate', text: monate }),
      ]),
      el('span', { class: 'jahreszeit-kachel__zahl', text: String(anzahl) }),
    ],
  );
}

/**
 * Karte eines Teils – für Kategorie-Ansicht, Suche und Jahreszeit.
 * @param {Object} teil
 * @param {{zeigeKategorie?: boolean, variante?: 'standard'|'jahreszeit'}} [optionen]
 *   In der Jahreszeiten-Ansicht steht der Kategoriename links und die Größe
 *   rechts, wie im Design.
 */
export function teilKarte(teil, { zeigeKategorie = false, variante = 'standard' } = {}) {
  const kategorieId = teil.kategorie;
  const etikett = etikettText(teil);

  const zusatz = [];
  if (zeigeKategorie) zusatz.push(kategorie(kategorieId)?.name ?? '');

  if (teil.typ === TYP.KLEIDUNG) {
    const jahreszeiten = (teil.jahreszeiten ?? [])
      .map((id) => JAHRESZEITEN.find((j) => j.id === id)?.name)
      .filter(Boolean);
    if (jahreszeiten.length > 0) zusatz.push(jahreszeiten.join(' · '));
  } else if (teil.art) {
    zusatz.push(teil.art);
  }

  const groesseChip = teil.typ === TYP.KLEIDUNG
    ? (teil.groesse ? `Gr. ${groesseText(teil.groesse)}` : null)
    : (Number.isInteger(teil.alterAb) ? `ab ${teil.alterAb} J.` : null);

  const zeile = variante === 'jahreszeit'
    ? [
      el('span', { class: 'teilkarte__zusatz', text: kategorie(kategorieId)?.name ?? '' }),
      groesseChip ? el('span', { class: 'teilkarte__groesse', text: groesseChip }) : null,
    ]
    : [
      groesseChip ? el('span', { class: 'teilkarte__groesse', text: groesseChip }) : null,
      zusatz.length > 0 ? el('span', { class: 'teilkarte__zusatz', text: zusatz.join(' · ') }) : null,
    ];

  return el(
    'a',
    {
      class: `teilkarte${variante === 'jahreszeit' ? ' teilkarte--jahreszeit' : ''}`,
      href: `#/teil/${encodeURIComponent(teil.id)}`,
      'data-kategorie': kategorieId,
    },
    [
      el('div', { class: 'teilkarte__bild' }, [
        icon(kategorieId, 36),
        // In der Jahreszeiten-Ansicht trägt die Karte kein Merkmal-Etikett.
        etikett && variante !== 'jahreszeit'
          ? el('span', { class: 'teilkarte__etikett', text: etikett })
          : null,
        // Mehrere Stück sind sonst nicht zu erkennen.
        (teil.anzahl ?? 1) > 1
          ? el('span', { class: 'teilkarte__anzahl', text: `${teil.anzahl}×` })
          : null,
      ]),
      el('div', { class: 'teilkarte__koerper' }, [
        el('p', { class: 'teilkarte__name', text: teil.name }),
        el('div', { class: 'teilkarte__zeile' }, zeile),
      ]),
    ],
  );
}

/** Marke, sonst das Merkmal – als Etikett oben rechts auf der Karte. */
function etikettText(teil) {
  if (teil.merkmal === 'marke' && teil.marke) return teil.marke;
  if (teil.merkmal) return MERKMAL.find((m) => m.id === teil.merkmal)?.name ?? null;
  return null;
}

/**
 * Leerer Zustand mit Erklärung und optionaler Aktion.
 * @param {{text: string, hinweis?: string, aktion?: Node}} optionen
 */
export function leererZustand({ text, hinweis, aktion }) {
  return el('div', { class: 'leerer-zustand' }, [
    el('p', { class: 'leerer-zustand__text', text }),
    hinweis ? el('p', { class: 'leerer-zustand__hinweis', text: hinweis }) : null,
    aktion,
  ]);
}
