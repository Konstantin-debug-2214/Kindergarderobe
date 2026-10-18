/**
 * kosten.js – Screen "Kosten" (#/kosten).
 *
 * Alle Summen entstehen allein aus `ausgaben`. Kosten aussortierter oder
 * gelöschter Teile bleiben deshalb erhalten (CLAUDE.md, Zählregeln).
 */

import { el, leeren } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { iconKnopf, knopf } from '../ui/knoepfe.js';
import { zaehler } from '../ui/formularteile.js';
import { leererZustand } from '../ui/kacheln.js';
import { zeigeHinweis } from '../ui/hinweis.js';
import { frageNach } from '../ui/dialog.js';
import { frageNachAusgabe, heuteAlsDatum } from '../ui/ausgabeDialog.js';
import { speicher, SpeicherFehler } from '../storage.js';
import {
  euroTextInCent,
  formatEuro,
  istSammelkauf,
  jahreMitAusgaben,
  jahresZahlen,
  jahrVon,
  proTeil,
} from '../costs.js';

/** Gewähltes Jahr. Liegt außerhalb, weil jede Änderung den Screen neu baut. */
let gewaehltesJahr = null;

/** Eingaben des Formulars auf dem Tablet – überleben das Neuzeichnen. */
let entwurf = null;

function leererEntwurf() {
  return { bezeichnung: '', datum: heuteAlsDatum(), betragText: '', anzahlTeile: 1, fehler: '' };
}

const DATUM = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit', month: '2-digit', year: 'numeric',
});
const DATUM_KURZ = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' });

function datumText(isoText, kurz = false) {
  const datum = new Date(isoText);
  if (Number.isNaN(datum.getTime())) return String(isoText ?? '');
  return kurz ? DATUM_KURZ.format(datum) : DATUM.format(datum);
}

export function kostenScreen(parameter, { neuZeichnen = () => {}, frisch = true } = {}) {
  const alleAusgaben = speicher.ausgaben();
  const teile = speicher.teile();
  const jahre = jahreMitAusgaben(alleAusgaben);

  if (frisch) {
    gewaehltesJahr = new Date().getFullYear();
    entwurf = leererEntwurf();
  }
  if (!entwurf) entwurf = leererEntwurf();
  if (gewaehltesJahr === null) gewaehltesJahr = new Date().getFullYear();

  const zahlen = jahresZahlen(alleAusgaben, gewaehltesJahr);
  const desJahres = alleAusgaben
    .filter((ausgabe) => jahrVon(ausgabe.datum) === gewaehltesJahr)
    .slice()
    .sort((a, b) => String(b.datum).localeCompare(String(a.datum)));

  /* --- Summenkarte mit Jahr-Umschalter ----------------------------------- */

  function jahrWechseln(richtung) {
    // Nur zu Jahren springen, in denen es wirklich Ausgaben gibt.
    const kandidaten = richtung < 0
      ? jahre.filter((j) => j < gewaehltesJahr)
      : jahre.filter((j) => j > gewaehltesJahr);
    if (kandidaten.length === 0) return;
    gewaehltesJahr = richtung < 0 ? Math.max(...kandidaten) : Math.min(...kandidaten);
    neuZeichnen();
  }

  const gibtFrueher = jahre.some((j) => j < gewaehltesJahr);
  const gibtSpaeter = jahre.some((j) => j > gewaehltesJahr);

  const zurueckJahr = iconKnopf({ label: 'Früheres Jahr', iconName: 'zurueck' });
  zurueckJahr.addEventListener('click', () => jahrWechseln(-1));
  zurueckJahr.disabled = !gibtFrueher;

  const vorJahr = iconKnopf({ label: 'Späteres Jahr', iconName: 'pfeil-rechts' });
  vorJahr.addEventListener('click', () => jahrWechseln(+1));
  vorJahr.disabled = !gibtSpaeter;

  const summenkarte = el('section', { class: 'summenkarte' }, [
    el('div', { class: 'summenkarte__kopf' }, [
      el('p', { class: 'summenkarte__label', text: `Ausgaben ${gewaehltesJahr}` }),
      // Der Umschalter erscheint nur, wenn es andere Jahre gibt.
      gibtFrueher || gibtSpaeter
        ? el('div', { class: 'summenkarte__jahre' }, [zurueckJahr, vorJahr])
        : null,
    ]),
    el('p', { class: 'summenkarte__summe', text: formatEuro(zahlen.summe) }),
    el('p', {
      class: 'summenkarte__zusatz',
      text: zahlen.teile > 0
        ? `${zahlen.teile} ${zahlen.teile === 1 ? 'Teil' : 'Teile'} · Ø `
          + `${formatEuro(zahlen.durchschnitt)} pro Teil`
        : 'Noch keine Ausgaben',
    }),
  ]);

  /* --- Formular (Tablet) -------------------------------------------------- */

  function speichereNeu(werte) {
    try {
      speicher.ausgabeAnlegen(werte);
      entwurf = leererEntwurf();
      // Das Jahr der neuen Ausgabe anzeigen, sonst wäre sie nicht zu sehen.
      gewaehltesJahr = jahrVon(werte.datum) ?? gewaehltesJahr;
      zeigeHinweis(`${werte.bezeichnung} gespeichert`);
      neuZeichnen();
    } catch (fehler) {
      zeigeHinweis(
        fehler instanceof SpeicherFehler ? fehler.message : 'Die Ausgabe konnte nicht gespeichert werden.',
        { art: 'hinweis' },
      );
    }
  }

  const formular = el('section', { class: 'karte kostenformular nur-tablet' }, [
    el('h2', { class: 'karte__titel', text: 'Kosten hinzufügen' }),
    ...formularFelder(),
  ]);

  function formularFelder() {
    const wofuer = el('input', {
      id: 'kosten-wofuer', class: 'feld__eingabe', type: 'text',
      placeholder: 'z. B. Flohmarkt Kita', autocomplete: 'off',
    });
    wofuer.value = entwurf.bezeichnung;
    wofuer.addEventListener('input', () => { entwurf.bezeichnung = wofuer.value; });

    const datum = el('input', { id: 'kosten-datum', class: 'feld__eingabe', type: 'date' });
    datum.value = entwurf.datum;
    datum.addEventListener('input', () => { entwurf.datum = datum.value; });

    const betrag = el('input', {
      id: 'kosten-betrag', class: 'eurofeld__eingabe', type: 'text',
      inputmode: 'decimal', placeholder: '0,00', 'aria-label': 'Gesamtbetrag in Euro',
    });
    betrag.value = entwurf.betragText;
    betrag.addEventListener('input', () => { entwurf.betragText = betrag.value; });

    const speichern = knopf({ text: 'Speichern', variante: 'primaer' });
    speichern.classList.add('kostenformular__speichern');
    speichern.addEventListener('click', () => {
      const cent = euroTextInCent(entwurf.betragText);
      if (entwurf.bezeichnung.trim() === '') {
        entwurf.fehler = 'Bitte angeben, wofür das Geld ausgegeben wurde.';
        neuZeichnen();
        return;
      }
      if (cent === null || cent <= 0) {
        entwurf.fehler = 'Bitte einen Betrag über 0 eintragen, z. B. 25,00.';
        neuZeichnen();
        return;
      }
      speichereNeu({
        bezeichnung: entwurf.bezeichnung.trim(),
        datum: entwurf.datum || heuteAlsDatum(),
        betrag: cent,
        anzahlTeile: entwurf.anzahlTeile,
      });
    });

    return [
      el('div', { class: 'abschnitt' }, [
        el('label', { class: 'abschnitt__label', for: 'kosten-wofuer', text: 'Wofür?' }),
        wofuer,
      ]),
      el('div', { class: 'abschnitt' }, [
        el('label', { class: 'abschnitt__label', for: 'kosten-datum', text: 'Datum' }),
        datum,
      ]),
      el('div', { class: 'ausgabefelder' }, [
        el('div', { class: 'abschnitt' }, [
          el('label', { class: 'abschnitt__label', for: 'kosten-betrag', text: 'Gesamtbetrag' }),
          el('div', { class: 'eurofeld' }, [
            betrag,
            el('span', { class: 'eurofeld__zeichen', text: '€' }),
          ]),
        ]),
        el('div', { class: 'abschnitt' }, [
          el('p', { class: 'abschnitt__label', text: 'Anzahl Teile' }),
          zaehler({
            wert: entwurf.anzahlTeile,
            min: 1,
            label: 'Anzahl Teile',
            beiAenderung: (wert) => { entwurf.anzahlTeile = wert; neuZeichnen(); },
          }),
        ]),
      ]),
      el('p', {
        class: 'kostenformular__hinweis',
        text: 'Für Sammelkäufe: Einzelpreise müssen nicht bekannt sein. '
          + 'Teile können später zugeordnet werden.',
      }),
      entwurf.fehler
        ? el('p', { class: 'feldfehler', role: 'alert', text: entwurf.fehler })
        : null,
      speichern,
    ].filter(Boolean);
  }

  /* --- Einträge ----------------------------------------------------------- */

  function eintrag(ausgabe) {
    const sammelkauf = istSammelkauf(ausgabe);
    // Teile, deren Preis an dieser Ausgabe hängt.
    const verknuepfte = teile.filter((teil) => teil.preis?.ausgabeId === ausgabe.id);
    const einzelteil = !sammelkauf && verknuepfte.length === 1 ? verknuepfte[0] : null;

    const art = sammelkauf
      ? `Sammelkauf · ${ausgabe.anzahlTeile} Teile`
      : 'Einzelteil';

    const inhalt = [
      el('span', {
        class: 'kosteneintrag__icon',
        'data-art': sammelkauf ? 'sammelkauf' : (einzelteil ? 'teil' : 'ohne'),
        'data-kategorie': einzelteil?.kategorie ?? null,
      }, [icon(sammelkauf ? 'tuete' : (einzelteil?.kategorie ?? 'euro'), 24)]),
      el('span', { class: 'kosteneintrag__texte' }, [
        el('span', { class: 'kosteneintrag__name', text: ausgabe.bezeichnung }),
        // Auf dem Smartphone reicht das kurze Datum, wie im Design.
        el('span', {
          class: 'kosteneintrag__zusatz nur-tablet',
          text: `${datumText(ausgabe.datum)} · ${art}`,
        }),
        el('span', {
          class: 'kosteneintrag__zusatz nur-smartphone',
          text: `${datumText(ausgabe.datum, true)} · ${art}`,
        }),
      ]),
      el('span', { class: 'kosteneintrag__betraege' }, [
        el('span', { class: 'kosteneintrag__betrag', text: formatEuro(ausgabe.betrag) }),
        sammelkauf
          ? el('span', {
            class: 'kosteneintrag__proteil',
            text: `ca. ${formatEuro(proTeil(ausgabe))} / Teil`,
          })
          : null,
      ]),
    ];

    // Einzelteile führen zum Teil, alles andere öffnet den Bearbeiten-Dialog.
    if (einzelteil) {
      return el('a', {
        class: 'kosteneintrag',
        href: `#/teil/${encodeURIComponent(einzelteil.id)}`,
      }, inhalt);
    }

    const zeile = el('button', { type: 'button', class: 'kosteneintrag' }, inhalt);
    zeile.addEventListener('click', () => bearbeite(ausgabe, verknuepfte, neuZeichnen));
    return zeile;
  }

  const eintraege = el('section', { class: 'karte kosteneintraege', 'data-nach-oben': '' }, [
    el('div', { class: 'bereich__kopf' }, [
      el('h2', { class: 'karte__titel', text: 'Einträge' }),
      desJahres.length > 0
        ? el('p', { class: 'bereich__zusatz', text: 'neueste zuerst' })
        : null,
    ]),
    desJahres.length > 0
      ? el('div', { class: 'kosteneintraege__liste' }, desJahres.map(eintrag))
      : leererZustand({
        text: `Noch keine Ausgaben für ${gewaehltesJahr}.`,
        hinweis: 'Trage Kosten ein, um zu sehen, was die Garderobe kostet. '
          + 'Einzelpreise an Teilen erscheinen hier automatisch.',
      }),
  ]);

  /* --- Zusammenbau -------------------------------------------------------- */

  const neuKnopf = knopf({ text: 'Kosten', iconName: 'plus', variante: 'primaer' });
  neuKnopf.classList.add('nur-smartphone');
  neuKnopf.addEventListener('click', async () => {
    const ergebnis = await frageNachAusgabe({
      titel: 'Kosten hinzufügen',
      hinweis: 'Für Sammelkäufe: Einzelpreise müssen nicht bekannt sein. '
        + 'Teile können später zugeordnet werden.',
    });
    if (ergebnis?.aktion === 'speichern') speichereNeu(ergebnis.werte);
  });

  return el('div', { class: 'inhalt kosten' }, [
    el('header', { class: 'kopfzeile' }, [
      iconKnopf({ label: 'Zurück', iconName: 'zurueck', href: '#/' }),
      el('div', { class: 'kopfzeile__titelblock' }, [
        el('h1', { class: 'kopfzeile__titel', text: 'Kosten' }),
      ]),
      el('div', { class: 'kopfzeile__aktionen' }, [neuKnopf]),
    ]),

    el('div', { class: 'kosten__raster' }, [
      el('div', { class: 'kosten__links', 'data-nach-oben': '' }, [summenkarte, formular]),
      eintraege,
    ]),
  ]);
}

/* --- Bearbeiten und Löschen ----------------------------------------------- */

async function bearbeite(ausgabe, verknuepfte, neuZeichnen) {
  const ergebnis = await frageNachAusgabe({
    titel: 'Eintrag bearbeiten',
    vorgabe: ausgabe,
    zugeordneteTeile: verknuepfte.map((teil) => teil.name),
    mitLoeschen: true,
  });

  if (!ergebnis) return;

  if (ergebnis.aktion === 'loeschen') {
    await loesche(ausgabe, verknuepfte, neuZeichnen);
    return;
  }

  try {
    speicher.ausgabeAendern(ausgabe.id, ergebnis.werte);
    zeigeHinweis('Eintrag gespeichert');
    neuZeichnen();
  } catch (fehler) {
    zeigeHinweis(
      fehler instanceof SpeicherFehler ? fehler.message : 'Der Eintrag konnte nicht gespeichert werden.',
      { art: 'hinweis' },
    );
  }
}

async function loesche(ausgabe, verknuepfte, neuZeichnen) {
  const bestaetigt = await frageNach({
    titel: 'Eintrag löschen?',
    inhalt: [
      el('p', { text: `„${ausgabe.bezeichnung}“ über ${formatEuro(ausgabe.betrag)} wird gelöscht.` }),
      verknuepfte.length > 0
        ? el('p', {
          class: 'dialog__hinweis',
          text: verknuepfte.length === 1
            ? 'Ein Teil verliert dadurch seinen Preis und steht dann auf „kein Preis“.'
            : `${verknuepfte.length} Teile verlieren dadurch ihren Preis und stehen dann `
              + 'auf „kein Preis“.',
        })
        : null,
    ].filter(Boolean),
    warnung: 'Das lässt sich nicht rückgängig machen.',
    bestaetigenText: 'Löschen',
  });

  if (!bestaetigt) return;

  try {
    speicher.ausgabeLoeschen(ausgabe.id);
    zeigeHinweis('Eintrag gelöscht');
    neuZeichnen();
  } catch (fehler) {
    zeigeHinweis(
      fehler instanceof SpeicherFehler ? fehler.message : 'Der Eintrag konnte nicht gelöscht werden.',
      { art: 'hinweis' },
    );
  }
}
