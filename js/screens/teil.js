/**
 * teil.js – Screen "Detail" (#/teil/:id).
 *
 * Tablet: links die Teile der Kategorie, rechts die Einzelheiten.
 * Smartphone: dieselbe Liste zum Blättern mit ‹ ›, Aktionsleiste unten.
 *
 * Passform und Notiz werden sofort gespeichert und zählen als Änderung.
 */

import { el, leeren } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { iconKnopf, knopf } from '../ui/knoepfe.js';
import { banner } from '../ui/banner.js';
import { zeigeHinweis } from '../ui/hinweis.js';
import { waehleAus } from '../ui/dialog.js';
import { umschalter } from '../ui/formularteile.js';
import { speicher, SpeicherFehler } from '../storage.js';
import {
  AUSSORTIER_GRUENDE,
  JAHRESZEITEN,
  MERKMAL,
  PASSFORM,
  TYP,
  kategorie as kategorieVon,
} from '../model.js';
import { einheit, nachbarn, stueck, teileDerKategorie } from '../filters.js';
import { preisHinweis, preisText } from '../costs.js';
import { groesseText } from '../formular.js';

export function teilScreen({ teilId }, { neuZeichnen = () => {} } = {}) {
  const teil = speicher.teil(teilId);

  if (!teil) return nichtGefunden();
  if (teil.aussortiert) return istAussortiert(teil);

  const kat = kategorieVon(teil.kategorie);
  const liste = teileDerKategorie(speicher.teile(), teil.kategorie);
  const stelle = nachbarn(liste, teil.id);

  /* --- Aktionen ----------------------------------------------------------- */

  const bearbeiten = knopf({
    text: 'Bearbeiten',
    href: `#/teil/${encodeURIComponent(teil.id)}/bearbeiten`,
    iconName: 'stift',
    variante: 'primaer',
  });

  /* --- Zusammenbau -------------------------------------------------------- */

  return el('div', { class: 'inhalt detail' }, [
    el('header', { class: 'kopfzeile detail__kopf' }, [
      iconKnopf({
        label: 'Zurück',
        iconName: 'zurueck',
        href: `#/kategorie/${encodeURIComponent(teil.kategorie)}`,
      }),
      el('div', { class: 'kopfzeile__titelblock' }, [
        // Tablet: der Kategoriename ist die Überschrift.
        el('h1', { class: 'kopfzeile__titel nur-tablet', text: kat?.name ?? 'Teil' }),
        // Smartphone: Kategorie und Stelle in der Liste.
        el('p', {
          class: 'detail__stelle nur-smartphone',
          text: `${kat?.name ?? ''} · ${stelle.stelle} von ${stelle.gesamt}`,
        }),
      ]),
      blaetterKnoepfe(stelle),
      el('div', { class: 'kopfzeile__aktionen nur-tablet' }, [aussortierenKnopf(teil), bearbeiten]),
    ]),

    el('div', { class: 'detail__raster' }, [
      el('aside', {
        class: 'detail__liste nur-tablet',
        'aria-label': 'Teile der Kategorie',
        'data-nach-oben': '',
      }, listeAufbauen(liste, teil)),
      el('div', { class: 'detail__inhalt', 'data-nach-oben': '' },
        einzelheiten(teil, neuZeichnen)),
    ]),

    // Smartphone: feste Leiste unten statt der Kopf-Knöpfe.
    el('div', { class: 'detail__aktionsleiste nur-smartphone' }, [
      aussortierenKnopf(teil),
      knopf({
        text: 'Bearbeiten',
        href: `#/teil/${encodeURIComponent(teil.id)}/bearbeiten`,
        iconName: 'stift',
        variante: 'primaer',
      }),
    ]),
  ]);
}

/** Knopf "Aussortieren" – auf dem Tablet oben, auf dem Smartphone unten. */
function aussortierenKnopf(teil) {
  const knopfEl = knopf({ text: 'Aussortieren', iconName: 'aussortiert' });
  knopfEl.addEventListener('click', () => frageGrund(teil));
  return knopfEl;
}

/* --- Blättern (Smartphone) ------------------------------------------------ */

function blaetterKnoepfe(stelle) {
  const zurueck = iconKnopf({
    label: 'Vorheriges Teil',
    iconName: 'zurueck',
    href: stelle.vorher ? `#/teil/${encodeURIComponent(stelle.vorher.id)}` : undefined,
  });
  const vor = iconKnopf({
    label: 'Nächstes Teil',
    iconName: 'pfeil-rechts',
    href: stelle.nachher ? `#/teil/${encodeURIComponent(stelle.nachher.id)}` : undefined,
  });

  // Am Rand der Liste bleibt der Knopf sichtbar, aber ohne Wirkung.
  if (!stelle.vorher) zurueck.setAttribute('aria-disabled', 'true');
  if (!stelle.nachher) vor.setAttribute('aria-disabled', 'true');

  return el('div', { class: 'detail__blaettern nur-smartphone' }, [zurueck, vor]);
}

/* --- Liste der Kategorie (Tablet) ----------------------------------------- */

function listeAufbauen(liste, aktuelles) {
  const anzahl = stueck(liste);

  return [
    el('p', {
      class: 'detail__listenkopf',
      text: `${anzahl} ${einheit(aktuelles.kategorie, anzahl).toUpperCase()}`,
    }),
    ...liste.map((eintrag) => {
      const aktiv = eintrag.id === aktuelles.id;
      const groesse = eintrag.typ === TYP.KLEIDUNG
        ? (eintrag.groesse ? `Gr. ${groesseText(eintrag.groesse)}` : 'ohne Größe')
        : (Number.isInteger(eintrag.alterAb) ? `ab ${eintrag.alterAb}` : 'ohne Alter');

      return el(
        'a',
        {
          class: `detail__eintrag${aktiv ? ' detail__eintrag--aktiv' : ''}`,
          href: `#/teil/${encodeURIComponent(eintrag.id)}`,
          'aria-current': aktiv ? 'true' : null,
          'data-kategorie': eintrag.kategorie,
        },
        [
          el('span', { class: 'detail__eintrag-icon' }, [icon(eintrag.kategorie, 24)]),
          el('span', { class: 'detail__eintrag-texte' }, [
            el('span', { class: 'detail__eintrag-name', text: eintrag.name }),
            el('span', {
              class: 'detail__eintrag-zusatz',
              text: `${groesse} · ${preisText(eintrag)}`,
            }),
          ]),
          eintrag.passform === 'bald_zu_klein'
            ? el('span', { class: 'etikett-warnung', text: 'Bald zu klein' })
            : null,
        ],
      );
    }),
  ];
}

/* --- Einzelheiten --------------------------------------------------------- */

function einzelheiten(teil, neuZeichnen) {
  const istKleidung = teil.typ === TYP.KLEIDUNG;

  const kopf = el('div', { class: 'detail__titelzeile' }, [
    el('span', { class: 'detail__bild', 'data-kategorie': teil.kategorie }, [
      icon(teil.kategorie, 34),
    ]),
    el('div', { class: 'detail__titeltexte' }, [
      el('h2', { class: 'detail__name', text: teil.name }),
      // Die Notiz steht als Untertitel – ohne Notiz kein Untertitel.
      teil.notiz ? el('p', { class: 'detail__untertitel', text: teil.notiz }) : null,
    ]),
  ]);

  return [
    kopf,
    el('div', { class: 'detail__kacheln' }, kacheln(teil)),
    ...(istKleidung ? [jahreszeitenBereich(teil), passformBereich(teil)] : []),
    ...(!istKleidung && teil.tags?.length > 0 ? [tagBereich(teil)] : []),
    notizBereich(teil, neuZeichnen),
  ];
}

/** Die Kacheln mit den wichtigsten Werten. */
function kacheln(teil) {
  const istKleidung = teil.typ === TYP.KLEIDUNG;
  const eintraege = [];

  if (istKleidung) {
    eintraege.push({
      label: 'Größe',
      wert: teil.groesse ? groesseText(teil.groesse) : '–',
    });
  } else {
    eintraege.push({
      label: 'Alter ab',
      wert: Number.isInteger(teil.alterAb) ? `ab ${teil.alterAb}` : '–',
    });
    eintraege.push({ label: 'Art', wert: teil.art || '–' });
  }

  eintraege.push({ label: 'Farbe', wert: teil.farbe ? grossOhneRest(teil.farbe) : '–' });
  eintraege.push({ label: 'Merkmal', wert: merkmalText(teil) });
  eintraege.push({
    label: 'Preis',
    wert: preisText(teil),
    hinweis: preisHinweis(teil, speicher.ausgaben()),
  });

  // Eine Anzahl über 1 ist sonst nirgends im Detail zu sehen.
  if ((teil.anzahl ?? 1) > 1) {
    eintraege.push({
      label: 'Anzahl',
      wert: `${teil.anzahl} ${einheit(teil.kategorie, teil.anzahl)}`,
    });
  }

  return eintraege.map((eintrag) => el('div', { class: 'wertkachel' }, [
    el('p', { class: 'wertkachel__label', text: eintrag.label }),
    el('p', { class: 'wertkachel__wert', text: eintrag.wert }),
    eintrag.hinweis ? el('p', { class: 'wertkachel__hinweis', text: eintrag.hinweis }) : null,
  ]));
}

/** "Blanko", "Aufdruck" oder der Markenname. */
function merkmalText(teil) {
  if (teil.merkmal === 'marke' && teil.marke) return teil.marke;
  if (teil.merkmal) return MERKMAL.find((m) => m.id === teil.merkmal)?.name ?? '–';
  return '–';
}

function grossOhneRest(text) {
  return String(text).charAt(0).toUpperCase() + String(text).slice(1);
}

function jahreszeitenBereich(teil) {
  const gesetzt = teil.jahreszeiten ?? [];

  return el('section', { class: 'detail__bereich' }, [
    el('p', { class: 'abschnitt__label', text: 'Jahreszeit' }),
    gesetzt.length > 0
      ? el(
        'div',
        { class: 'jahreszeitchips' },
        JAHRESZEITEN.filter((j) => gesetzt.includes(j.id)).map((j) => el(
          'span',
          { class: 'jahreszeitchip', 'data-jahreszeit': j.id },
          [icon(j.id, 18), el('span', { text: j.name })],
        )),
      )
      : el('p', { class: 'abschnitt__leer', text: 'Keine Jahreszeit eingetragen.' }),
  ]);
}

/** Passform zum Antippen – die Auswahl wird sofort gespeichert. */
function passformBereich(teil) {
  return el('section', { class: 'detail__bereich' }, [
    el('p', { class: 'abschnitt__label', text: 'Passform' }),
    umschalter({
      label: 'Passform',
      optionen: PASSFORM,
      wert: teil.passform,
      beiWahl: (passform) => {
        if (passform === teil.passform) return;
        speicher.teilAendern(teil.id, { passform });
      },
    }),
  ]);
}

function tagBereich(teil) {
  return el('section', { class: 'detail__bereich' }, [
    el('p', { class: 'abschnitt__label', text: 'Freie Merkmale' }),
    el(
      'div',
      { class: 'jahreszeitchips' },
      teil.tags.map((tag) => el('span', { class: 'merkmalchip', text: tag })),
    ),
  ]);
}

/** Notizfeld – gespeichert wird beim Verlassen des Feldes. */
function notizBereich(teil, neuZeichnen) {
  const id = 'detail-notiz';
  const feld = el('textarea', {
    id,
    class: 'textbereich',
    rows: '3',
    placeholder: 'Notiz hinzufügen',
  });
  feld.value = teil.notiz ?? '';

  feld.addEventListener('change', () => {
    const neu = feld.value.trim();
    if (neu === (teil.notiz ?? '')) return;
    try {
      speicher.teilAendern(teil.id, { notiz: neu });
      // Neu zeichnen, damit der Untertitel mitzieht.
      neuZeichnen();
    } catch (fehler) {
      zeigeHinweis(
        fehler instanceof SpeicherFehler ? fehler.message : 'Die Notiz konnte nicht gespeichert werden.',
        { art: 'hinweis' },
      );
    }
  });

  return el('section', { class: 'detail__bereich' }, [
    el('label', { class: 'abschnitt__label', for: id, text: 'Notiz' }),
    feld,
  ]);
}

/* --- Aussortieren --------------------------------------------------------- */

async function frageGrund(teil) {
  const grund = await waehleAus({
    titel: 'Warum wird das Teil aussortiert?',
    eintraege: AUSSORTIER_GRUENDE.map((g) => ({ wert: g.id, titel: g.name })),
  });

  if (!grund) return;

  try {
    speicher.teilAussortieren(teil.id, grund);
    zeigeHinweis(`${teil.name} aussortiert`);
    window.location.hash = `#/kategorie/${encodeURIComponent(teil.kategorie)}`;
  } catch (fehler) {
    zeigeHinweis(
      fehler instanceof SpeicherFehler ? fehler.message : 'Das Teil konnte nicht aussortiert werden.',
      { art: 'hinweis' },
    );
  }
}

/* --- Sonderfälle ---------------------------------------------------------- */

function nichtGefunden() {
  return el('div', { class: 'inhalt' }, [
    el('header', { class: 'kopfzeile' }, [
      iconKnopf({ label: 'Zurück', iconName: 'zurueck', href: '#/' }),
      el('div', { class: 'kopfzeile__titelblock' }, [
        el('h1', { class: 'kopfzeile__titel', text: 'Teil' }),
      ]),
    ]),
    banner({
      art: 'fehler',
      rolle: 'alert',
      text: 'Dieses Teil gibt es nicht (mehr).',
      zusatz: 'Vielleicht wurde es endgültig gelöscht.',
    }),
    el('div', { class: 'detail__wegweiser' }, [
      knopf({ text: 'Zur Übersicht', href: '#/', variante: 'primaer', iconName: 'start' }),
    ]),
  ]);
}

function istAussortiert(teil) {
  return el('div', { class: 'inhalt' }, [
    el('header', { class: 'kopfzeile' }, [
      iconKnopf({ label: 'Zurück', iconName: 'zurueck', href: '#/' }),
      el('div', { class: 'kopfzeile__titelblock' }, [
        el('h1', { class: 'kopfzeile__titel', text: teil.name }),
      ]),
    ]),
    banner({
      art: 'hinweis',
      text: 'Dieses Teil ist aussortiert.',
      zusatz: 'Aussortierte Teile zählen nirgends mit und lassen sich zurückholen.',
    }),
    el('div', { class: 'detail__wegweiser' }, [
      knopf({
        text: 'Zu den aussortierten Teilen',
        href: '#/aussortiert',
        variante: 'primaer',
        iconName: 'aussortiert',
      }),
    ]),
  ]);
}
