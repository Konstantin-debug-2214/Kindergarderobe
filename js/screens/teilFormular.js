/**
 * teilFormular.js – Screen "Teil hinzufügen" (#/neu) und "Teil bearbeiten"
 * (#/teil/:id/bearbeiten). Beide nutzen dasselbe Formular.
 *
 * Der Entwurf liegt außerhalb der Zeichenfunktion, weil jede Datenänderung
 * (z. B. eine neu angelegte Marke) den Screen neu aufbaut. Beim Betreten des
 * Screens wird er zurückgesetzt.
 */

import { el } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { knopf, iconKnopf } from '../ui/knoepfe.js';
import { banner } from '../ui/banner.js';
import { frageNach, pflegeListe, waehleAus } from '../ui/dialog.js';
import { frageNachAusgabe } from '../ui/ausgabeDialog.js';
import {
  abschnitt,
  chips,
  euroFeld,
  farbwahl,
  textbereich,
  umschalter,
  wahlknoepfe,
  zaehler,
} from '../ui/formularteile.js';
import { speicher, SpeicherFehler } from '../storage.js';
import {
  ALTER_AB_VORGABEN,
  FARBEN,
  kategorie as kategorieVon,
  GROESSENSYSTEME,
  JAHRESZEITEN,
  MERKMAL,
  PASSFORM,
  TYP,
  artenVon,
  groessenSystemFuer,
  groessenWerte,
  kleidungsKategorien,
  istKleidungsKategorie,
  KATEGORIE_SPIELZEUG,
  pruefeTeilAusfuehrlich,
} from '../model.js';
import {
  artNachKategoriewechsel,
  entwurfAusTeil,
  entwurfGeaendert,
  entwurfMitTyp,
  gaengigeGroessen,
  groesseNachWechsel,
  groesseText,
  leererEntwurf,
  preisEinzeln,
  preisSammelkauf,
  sammelkaeufe,
  teilAusEntwurf,
} from '../formular.js';
import { euroTextInCent, formatEuro } from '../costs.js';

/** Felder, deren Meldung an einer anderen Stelle steht als ihr Name sagt. */
const ANZEIGE_FELD = { marke: 'merkmal' };

/** Zustand des Formulars, siehe Kopfkommentar. */
let entwurf = null;
let ausgangswert = null;
let fehlerJeFeld = {};
/** Betrag als Text, damit Eingaben wie "12," beim Tippen stehen bleiben. */
let betragText = '';
/** Rückmeldung, wenn etwas schiefgeht (z. B. Speicher voll). */
let meldung = null;

/* --- Einstiege ------------------------------------------------------------ */

export function neuScreen(parameter = {}, optionen = {}) {
  // "#/neu?kategorie=schuhe" belegt die Kategorie vor, z. B. wenn man aus
  // einer leeren Kategorie heraus ein Teil anlegt.
  if (optionen.frisch !== false) starteNeu(parameter.kategorie);
  return formular({ modus: 'neu' }, optionen);
}

export function teilBearbeitenScreen({ teilId }, optionen = {}) {
  if (optionen.frisch !== false) {
    const teil = speicher.teil(teilId);
    if (!teil) return unbekanntesTeil();
    starteBearbeiten(teil);
  }
  if (!entwurf) return unbekanntesTeil();
  return formular({ modus: 'bearbeiten', teilId }, optionen);
}

function starteNeu(kategorieId) {
  const spielzeug = kategorieId === KATEGORIE_SPIELZEUG;
  entwurf = leererEntwurf(spielzeug ? TYP.SPIELZEUG : TYP.KLEIDUNG);
  if (kategorieId && !spielzeug && istKleidungsKategorie(kategorieId)) {
    entwurf = { ...entwurf, kategorie: kategorieId };
  }
  ausgangswert = { ...entwurf };
  fehlerJeFeld = {};
  betragText = '';
  meldung = null;
}

function starteBearbeiten(teil) {
  entwurf = entwurfAusTeil(teil);
  ausgangswert = { ...entwurf };
  fehlerJeFeld = {};
  betragText = teil.preis?.art === 'einzeln'
    ? (teil.preis.betrag / 100).toFixed(2).replace('.', ',')
    : '';
  meldung = null;
}

function unbekanntesTeil() {
  entwurf = null;
  return el('div', { class: 'inhalt' }, [
    banner({
      art: 'fehler',
      rolle: 'alert',
      text: 'Dieses Teil gibt es nicht (mehr).',
      zusatz: 'Vielleicht wurde es endgültig gelöscht.',
    }),
    el('div', { class: 'testlinks' }, [
      knopf({ text: 'Zur Übersicht', href: '#/', variante: 'primaer', iconName: 'start' }),
    ]),
  ]);
}

/* --- Formular ------------------------------------------------------------- */

function formular({ modus, teilId }, { neuZeichnen = () => {} }) {
  const istKleidung = entwurf.typ === TYP.KLEIDUNG;
  const titel = modus === 'neu' ? 'Neues Teil' : 'Teil bearbeiten';

  /** Ändert den Entwurf und baut den Screen neu auf. */
  function setze(aenderungen) {
    entwurf = { ...entwurf, ...aenderungen };
    loescheFehler(Object.keys(aenderungen));
    neuZeichnen();
  }

  /** Ändert den Entwurf ohne Neuaufbau – für Eingaben beim Tippen. */
  function setzeStill(aenderungen) {
    entwurf = { ...entwurf, ...aenderungen };
    loescheFehler(Object.keys(aenderungen));
    aktualisiereVorschau();
  }

  /**
   * Nimmt die Fehlermeldung an den geänderten Feldern weg – sobald jemand
   * etwas einträgt, soll dort nicht länger "fehlt" stehen. Andere offene
   * Fehler bleiben sichtbar.
   */
  function loescheFehler(felder) {
    for (const feld of felder) {
      if (!fehlerJeFeld[feld]) continue;
      delete fehlerJeFeld[feld];
      // Beim stillen Ändern wird nicht neu gezeichnet, deshalb direkt entfernen.
      document.querySelector(`[data-feld="${ANZEIGE_FELD[feld] ?? feld}"] .feldfehler`)?.remove();
    }
  }

  const zurueckZiel = modus === 'neu' ? '#/' : `#/teil/${encodeURIComponent(teilId)}`;

  async function verlassen() {
    if (entwurfGeaendert(entwurf, ausgangswert)) {
      const verwerfen = await frageNach({
        titel: 'Änderungen verwerfen?',
        inhalt: [el('p', { text: 'Die Eingaben gehen verloren.' })],
        bestaetigenText: 'Verwerfen',
        abbrechenText: 'Weiter bearbeiten',
      });
      if (!verwerfen) return;
    }
    entwurf = null;
    window.location.hash = zurueckZiel;
  }

  // Die Vorschau wird beim Tippen ausgetauscht, ohne den Screen neu zu bauen.
  let aktuelleVorschau = vorschauKarte();

  function aktualisiereVorschau() {
    const neue = vorschauKarte();
    aktuelleVorschau.replaceWith(neue);
    aktuelleVorschau = neue;
  }

  /* --- Kopfzeile --------------------------------------------------------- */

  const schliessen = iconKnopf({ label: 'Schließen', iconName: 'schliessen' });
  schliessen.addEventListener('click', verlassen);

  const abbrechen = knopf({ text: 'Abbrechen' });
  abbrechen.addEventListener('click', verlassen);

  const speichern = knopf({ text: 'Speichern', variante: 'primaer', iconName: 'haken' });
  speichern.addEventListener('click', speichereTeil);

  const typUmschalter = umschalter({
    label: 'Kleidung oder Spielzeug',
    optionen: [
      { id: TYP.KLEIDUNG, name: 'Kleidung', iconName: 'oberteile' },
      { id: TYP.SPIELZEUG, name: 'Spielzeug', iconName: 'spielzeug' },
    ],
    wert: entwurf.typ,
    // Beim Bearbeiten steht der Typ fest.
    gesperrt: modus === 'bearbeiten',
    beiWahl: (typ) => {
      entwurf = entwurfMitTyp(entwurf, typ);
      fehlerJeFeld = {};
      neuZeichnen();
    },
  });

  const kopf = el('header', { class: 'formular__kopf' }, [
    schliessen,
    el('div', { class: 'formular__titelblock' }, [
      el('h1', { class: 'kopfzeile__titel', text: titel }),
    ]),
    el('div', { class: 'formular__kopf-umschalter nur-tablet' }, [typUmschalter]),
    el('div', { class: 'formular__kopf-aktionen' }, [
      el('span', { class: 'nur-tablet' }, [abbrechen]),
      speichern,
    ]),
  ]);

  /* --- Felder ------------------------------------------------------------ */

  const links = [bauVorschau(aktuelleVorschau), bauName(), ...bauPreis(), bauNotiz()];
  const rechts = istKleidung ? bauKleidungsfelder() : bauSpielzeugfelder();

  return el('div', { class: 'inhalt formular' }, [
    kopf,
    el('div', { class: 'formular__umschalter-mobil nur-smartphone' }, [
      umschalter({
        label: 'Kleidung oder Spielzeug',
        optionen: [
          { id: TYP.KLEIDUNG, name: 'Kleidung' },
          { id: TYP.SPIELZEUG, name: 'Spielzeug' },
        ],
        wert: entwurf.typ,
        gesperrt: modus === 'bearbeiten',
        beiWahl: (typ) => {
          entwurf = entwurfMitTyp(entwurf, typ);
          fehlerJeFeld = {};
          neuZeichnen();
        },
      }),
    ]),
    meldung ? el('div', { class: 'meldungsbereich' }, [banner(meldung)]) : null,
    el('div', { class: 'formular__raster' }, [
      el('div', { class: 'formular__links' }, links),
      el('div', { class: 'formular__rechts' }, rechts),
    ]),
  ]);

  /* --- Bausteine --------------------------------------------------------- */

  function reihe(element, reihenfolge) {
    element.style.setProperty('--reihenfolge', String(reihenfolge));
    return element;
  }

  function bauVorschau(karte) {
    return reihe(abschnitt({ label: 'Vorschau', inhalt: [karte] }), 1);
  }

  function bauName() {
    const id = 'feld-name';
    const eingabe = el('input', {
      id,
      class: 'feld__eingabe',
      type: 'text',
      placeholder: 'z. B. Ringelshirt blau',
      autocomplete: 'off',
    });
    eingabe.value = entwurf.name ?? '';
    eingabe.addEventListener('input', () => setzeStill({ name: eingabe.value }));

    return reihe(el('div', { class: 'abschnitt', 'data-feld': 'name' }, [
      el('label', { class: 'abschnitt__label', for: id, text: 'Name' }),
      eingabe,
      fehlerJeFeld.name
        ? el('p', { class: 'feldfehler', role: 'alert', text: fehlerJeFeld.name })
        : null,
    ]), 2);
  }

  function bauNotiz() {
    return reihe(textbereich({
      label: 'Notiz',
      hinweis: '(optional)',
      wert: entwurf.notiz,
      platzhalter: 'z. B. Geschenk von Oma',
      beiEingabe: (wert) => setzeStill({ notiz: wert }),
    }), istKleidung ? 12 : 10);
  }

  function bauAnzahl() {
    return reihe(abschnitt({
      label: 'Anzahl',
      feld: 'anzahl',
      fehler: fehlerJeFeld.anzahl,
      inhalt: [zaehler({
        wert: entwurf.anzahl ?? 1,
        min: 1,
        label: 'Anzahl',
        beiAenderung: (wert) => setze({ anzahl: wert }),
      })],
    }), istKleidung ? 10 : 8);
  }

  function bauFarbe() {
    return reihe(abschnitt({
      label: 'Farbe',
      hinweis: '(optional)',
      inhalt: [farbwahl({
        farben: FARBEN,
        wert: entwurf.farbe,
        beiWahl: (farbe) => setze({ farbe }),
      })],
    }), istKleidung ? 7 : 5);
  }

  function bauMerkmal() {
    const inhalt = [
      umschalter({
        label: 'Merkmal',
        optionen: MERKMAL,
        wert: entwurf.merkmal,
        beiWahl: (merkmal) => setze({
          merkmal: merkmal === entwurf.merkmal ? null : merkmal,
          marke: merkmal === 'marke' ? entwurf.marke : null,
        }),
      }),
    ];

    if (entwurf.merkmal === 'marke') inhalt.push(bauMarkenliste());

    return reihe(abschnitt({
      label: 'Merkmal',
      hinweis: '(optional)',
      feld: 'merkmal',
      fehler: fehlerJeFeld.merkmal ?? fehlerJeFeld.marke,
      inhalt,
    }), istKleidung ? 8 : 6);
  }

  function bauMarkenliste() {
    const marken = speicher.marken();

    const neueMarke = el('button', { type: 'button', class: 'wahl__knopf wahl__knopf--neu' }, [
      icon('plus', 18),
      el('span', { text: 'Neue Marke' }),
    ]);
    neueMarke.addEventListener('click', async () => {
      const name = await frageNachText({
        titel: 'Neue Marke',
        label: 'Name der Marke',
        platzhalter: 'z. B. Paw Patrol',
      });
      if (!name) return;
      speicher.markeAnlegen(name);
      // Die neue Marke ist gleich ausgewählt.
      entwurf = { ...entwurf, marke: name };
      neuZeichnen();
    });

    const bearbeiten = el('button', { type: 'button', class: 'textknopf' }, [
      icon('stift', 16),
      el('span', { text: 'Bearbeiten' }),
    ]);
    bearbeiten.addEventListener('click', async () => {
      await pflegeListe({
        titel: 'Marken bearbeiten',
        hinweis: 'Gelöschte Marken bleiben an bestehenden Teilen erhalten.',
        leerText: 'Noch keine Marke angelegt.',
        eintraege: () => speicher.marken(),
        beiLoeschen: (name) => {
          speicher.markeLoeschen(name);
          if (entwurf.marke === name) entwurf = { ...entwurf, marke: null };
        },
      });
      neuZeichnen();
    });

    return el('div', { class: 'markenliste' }, [
      el('div', { class: 'wahl' }, [
        ...marken.map((marke) => {
          const aktiv = marke === entwurf.marke;
          const knopfEl = el('button', {
            type: 'button',
            class: `wahl__knopf${aktiv ? ' wahl__knopf--aktiv' : ''}`,
            'aria-pressed': String(aktiv),
          }, [el('span', { text: marke })]);
          knopfEl.addEventListener('click', () => setze({ marke: aktiv ? null : marke }));
          return knopfEl;
        }),
        neueMarke,
      ]),
      marken.length > 0 ? bearbeiten : null,
    ]);
  }

  /* --- Preis ------------------------------------------------------------- */

  function bauPreis() {
    const art = entwurf.preis?.art ?? 'kein';
    const inhalt = [
      umschalter({
        label: 'Preis',
        optionen: [
          { id: 'kein', name: 'Kein Preis' },
          { id: 'einzeln', name: 'Einzelpreis' },
          { id: 'sammelkauf', name: 'Sammelkauf' },
        ],
        wert: art,
        beiWahl: (neueArt) => {
          if (neueArt === 'kein') {
            betragText = '';
            setze({ preis: null });
          } else if (neueArt === 'einzeln') {
            setze({ preis: preisEinzeln(euroTextInCent(betragText) ?? 0, entwurf.preis?.ausgabeId) });
          } else {
            waehleSammelkauf();
          }
        },
      }),
    ];

    if (art === 'einzeln') {
      inhalt.push(euroFeld({
        label: 'Betrag in Euro',
        wert: betragText,
        beiEingabe: (wert) => {
          betragText = wert;
          const cent = euroTextInCent(wert);
          setzeStill({ preis: preisEinzeln(cent ?? 0, entwurf.preis?.ausgabeId) });
        },
      }));
    }

    if (art === 'sammelkauf') {
      const ausgabe = speicher.ausgaben().find((a) => a.id === entwurf.preis.ausgabeId);
      const wechseln = knopf({ text: 'Anderer Sammelkauf' });
      wechseln.addEventListener('click', waehleSammelkauf);

      inhalt.push(el('div', { class: 'sammelkauf' }, [
        ausgabe
          ? el('div', { class: 'sammelkauf__angabe' }, [
            el('p', { class: 'sammelkauf__titel', text: ausgabe.bezeichnung }),
            el('p', {
              class: 'sammelkauf__hinweis',
              text: `${datumText(ausgabe.datum)} · ${formatEuro(ausgabe.betrag)} für `
                + `${ausgabe.anzahlTeile} Teile · ca. ${formatEuro(
                  Math.round(ausgabe.betrag / ausgabe.anzahlTeile),
                )} / Teil`,
            }),
          ])
          : el('p', { class: 'sammelkauf__hinweis', text: 'Kein Sammelkauf gewählt.' }),
        wechseln,
      ]));
    }

    return [reihe(abschnitt({
      label: 'Preis',
      hinweis: '(optional)',
      feld: 'preis',
      fehler: fehlerJeFeld.preis,
      inhalt,
    }), istKleidung ? 11 : 9)];
  }

  async function waehleSammelkauf() {
    const vorhandene = sammelkaeufe(speicher.ausgaben());

    const wahl = await waehleAus({
      titel: 'Sammelkauf wählen',
      leerText: 'Noch kein Sammelkauf angelegt.',
      eintraege: vorhandene.map((ausgabe) => ({
        wert: ausgabe.id,
        titel: ausgabe.bezeichnung,
        hinweis: `${datumText(ausgabe.datum)} · ${ausgabe.anzahlTeile} Teile`,
        zusatz: formatEuro(ausgabe.betrag),
      })),
      weitereAktion: { text: 'Neuer Sammelkauf', wert: '__neu__' },
    });

    if (!wahl) return;

    if (wahl === '__neu__') {
      const angelegt = await frageNachSammelkauf();
      if (!angelegt) return;
      entwurf = { ...entwurf, preis: preisSammelkauf(angelegt.id) };
      neuZeichnen();
      return;
    }

    setze({ preis: preisSammelkauf(wahl) });
  }

  /* --- Felder Kleidung --------------------------------------------------- */

  function bauKleidungsfelder() {
    // Reihenfolge laut Design: Farbe und Merkmal stehen vor der Passform.
    return [
      bauKategorie(),
      bauArt(),
      bauGroesse(),
      bauJahreszeiten(),
      bauFarbe(),
      bauMerkmal(),
      bauPassform(),
      bauAnzahl(),
    ];
  }

  function bauKategorie() {
    return reihe(abschnitt({
      label: 'Kategorie',
      feld: 'kategorie',
      fehler: fehlerJeFeld.kategorie,
      inhalt: [wahlknoepfe({
        optionen: kleidungsKategorien().map((k) => ({ id: k.id, name: k.name })),
        wert: entwurf.kategorie,
        beiWahl: (kategorieId) => {
          const art = artNachKategoriewechsel(kategorieId, entwurf.art, entwurf.eigeneArt);
          setze({
            kategorie: kategorieId,
            art,
            groesse: groesseNachWechsel(kategorieId, art, entwurf.groesse),
          });
        },
      })],
    }), 3);
  }

  function bauArt() {
    const arten = artenVon(entwurf.kategorie);
    const optionen = arten.map((art) => ({ id: art, name: art }));
    // Eine eigene Art steht mit in der Reihe, damit sie sichtbar gewählt ist.
    if (entwurf.eigeneArt && entwurf.art) optionen.push({ id: entwurf.art, name: entwurf.art });

    const andere = el('button', { type: 'button', class: 'wahl__knopf wahl__knopf--neu' }, [
      el('span', { text: 'Andere …' }),
    ]);
    andere.addEventListener('click', async () => {
      const art = await frageNachText({
        titel: 'Eigene Art',
        label: 'Art des Teils',
        platzhalter: entwurf.typ === TYP.SPIELZEUG ? 'z. B. Murmelbahn' : 'z. B. Poncho',
        wert: entwurf.eigeneArt ? entwurf.art : '',
      });
      if (!art) return;
      entwurf = {
        ...entwurf,
        art,
        eigeneArt: !arten.includes(art),
        groesse: groesseNachWechsel(entwurf.kategorie, art, entwurf.groesse),
      };
      neuZeichnen();
    });

    const gruppe = wahlknoepfe({
      optionen,
      wert: entwurf.art || null,
      beiWahl: (art) => setze({
        art,
        eigeneArt: !arten.includes(art),
        groesse: groesseNachWechsel(entwurf.kategorie, art, entwurf.groesse),
      }),
    });
    gruppe.append(andere);

    return reihe(abschnitt({
      label: 'Art',
      feld: 'art',
      fehler: fehlerJeFeld.art,
      inhalt: [gruppe],
    }), istKleidung ? 4 : 3);
  }

  function bauGroesse() {
    const system = groessenSystemFuer(entwurf.kategorie, entwurf.art);

    if (!system) {
      return reihe(abschnitt({
        label: 'Größe',
        inhalt: [el('p', { class: 'abschnitt__leer', text: 'Erst eine Art wählen.' })],
      }), 5);
    }

    const werte = gaengigeGroessen(system);
    const gewaehlt = entwurf.groesse;
    const istEinzelwert = gewaehlt && gewaehlt.von === gewaehlt.bis && werte.includes(gewaehlt.von);

    const optionen = werte.map((wert) => ({ id: wert, name: String(wert) }));
    // Eine Größe außerhalb der Schnellauswahl erscheint als eigener Knopf.
    if (gewaehlt && !istEinzelwert) {
      optionen.push({ id: 'eigene', name: groesseText(gewaehlt) });
    }

    const gruppe = wahlknoepfe({
      optionen,
      wert: istEinzelwert ? gewaehlt.von : (gewaehlt ? 'eigene' : null),
      beiWahl: (wert) => {
        if (wert === 'eigene') { eigeneGroesse(system); return; }
        setze({ groesse: { system, von: wert, bis: wert } });
      },
    });

    const andere = el('button', { type: 'button', class: 'wahl__knopf wahl__knopf--neu' }, [
      el('span', { text: 'Andere …' }),
    ]);
    andere.addEventListener('click', () => eigeneGroesse(system));
    gruppe.append(andere);

    return reihe(abschnitt({
      label: 'Größe',
      hinweis: GROESSENSYSTEME[system].einheit ? `(${GROESSENSYSTEME[system].einheit})` : '',
      feld: 'groesse',
      fehler: fehlerJeFeld.groesse,
      inhalt: [gruppe],
    }), 5);
  }

  async function eigeneGroesse(system) {
    const gewaehlt = await frageNachGroesse(system, entwurf.groesse);
    if (!gewaehlt) return;
    entwurf = { ...entwurf, groesse: gewaehlt };
    neuZeichnen();
  }

  function bauJahreszeiten() {
    return reihe(abschnitt({
      label: 'Jahreszeit',
      hinweis: '(mehrere möglich)',
      feld: 'jahreszeiten',
      fehler: fehlerJeFeld.jahreszeiten,
      inhalt: [wahlknoepfe({
        optionen: JAHRESZEITEN.map((j) => ({ id: j.id, name: j.name, iconName: j.id })),
        wert: entwurf.jahreszeiten ?? [],
        mehrfach: true,
        klasse: 'wahl--jahreszeiten',
        beiWahl: (id) => {
          const gesetzt = new Set(entwurf.jahreszeiten ?? []);
          if (gesetzt.has(id)) gesetzt.delete(id); else gesetzt.add(id);
          // Immer in der Reihenfolge der Jahreszeiten speichern.
          setze({ jahreszeiten: JAHRESZEITEN.map((j) => j.id).filter((id_) => gesetzt.has(id_)) });
        },
      })],
    }), 6);
  }

  function bauPassform() {
    return reihe(abschnitt({
      label: 'Passform',
      feld: 'passform',
      fehler: fehlerJeFeld.passform,
      inhalt: [umschalter({
        label: 'Passform',
        optionen: PASSFORM,
        wert: entwurf.passform,
        beiWahl: (passform) => setze({ passform }),
      })],
    }), 9);
  }

  /* --- Felder Spielzeug -------------------------------------------------- */

  function bauSpielzeugfelder() {
    return [bauArt(), bauAlterAb(), bauFarbe(), bauMerkmal(), bauTags(), bauAnzahl()];
  }

  function bauAlterAb() {
    const optionen = ALTER_AB_VORGABEN.map((jahre) => ({ id: jahre, name: `ab ${jahre}` }));
    if (entwurf.alterAb !== null && entwurf.alterAb !== undefined
      && !ALTER_AB_VORGABEN.includes(entwurf.alterAb)) {
      optionen.push({ id: entwurf.alterAb, name: `ab ${entwurf.alterAb}` });
    }

    const gruppe = wahlknoepfe({
      optionen,
      wert: entwurf.alterAb ?? null,
      beiWahl: (jahre) => setze({ alterAb: jahre === entwurf.alterAb ? null : jahre }),
    });

    const andere = el('button', { type: 'button', class: 'wahl__knopf wahl__knopf--neu' }, [
      el('span', { text: 'Andere …' }),
    ]);
    andere.addEventListener('click', async () => {
      const text = await frageNachText({
        titel: 'Alter ab',
        label: 'Alter in Jahren',
        platzhalter: 'z. B. 5',
      });
      const jahre = Number.parseInt(text ?? '', 10);
      if (!Number.isInteger(jahre) || jahre < 0) return;
      entwurf = { ...entwurf, alterAb: jahre };
      neuZeichnen();
    });
    gruppe.append(andere);

    return reihe(abschnitt({
      label: 'Alter ab',
      hinweis: '(optional)',
      feld: 'alterAb',
      fehler: fehlerJeFeld.alterAb,
      inhalt: [gruppe],
    }), 4);
  }

  function bauTags() {
    const werte = entwurf.tags ?? [];

    const eingabe = el('input', {
      id: 'feld-tag',
      class: 'feld__eingabe',
      type: 'text',
      placeholder: 'z. B. Holz',
      autocomplete: 'off',
    });

    function hinzufuegen() {
      const wert = eingabe.value.trim();
      if (wert === '' || werte.includes(wert)) { eingabe.value = ''; return; }
      setze({ tags: [...werte, wert] });
    }

    eingabe.addEventListener('keydown', (ereignis) => {
      if (ereignis.key !== 'Enter') return;
      ereignis.preventDefault();
      hinzufuegen();
    });

    const hinzu = iconKnopf({ label: 'Merkmal hinzufügen', iconName: 'plus' });
    hinzu.addEventListener('click', hinzufuegen);

    return reihe(abschnitt({
      label: 'Freie Merkmale',
      hinweis: '(optional)',
      feld: 'tags',
      fehler: fehlerJeFeld.tags,
      inhalt: [
        el('div', { class: 'tageingabe' }, [eingabe, hinzu]),
        werte.length > 0
          ? chips({ werte, beiEntfernen: (wert) => setze({ tags: werte.filter((t) => t !== wert) }) })
          : null,
      ].filter(Boolean),
    }), 7);
  }

  /* --- Vorschau ---------------------------------------------------------- */

  function vorschauKarte() {
    const kategorieId = entwurf.typ === TYP.SPIELZEUG ? 'spielzeug' : entwurf.kategorie;
    const kategorieName = kategorieVon(kategorieId)?.name ?? '';

    const merkmale = [];
    merkmale.push(kategorieName);

    if (entwurf.typ === TYP.KLEIDUNG) {
      if (entwurf.art) merkmale.push(entwurf.art);
      if (entwurf.groesse) merkmale.push(`Gr. ${groesseText(entwurf.groesse)}`);
      const jahreszeiten = (entwurf.jahreszeiten ?? [])
        .map((id) => JAHRESZEITEN.find((j) => j.id === id)?.name)
        .filter(Boolean);
      if (jahreszeiten.length > 0) merkmale.push(jahreszeiten.join(' · '));
    } else {
      if (entwurf.art) merkmale.push(entwurf.art);
      if (entwurf.alterAb !== null && entwurf.alterAb !== undefined) {
        merkmale.push(`ab ${entwurf.alterAb}`);
      }
    }

    if (entwurf.merkmal === 'marke' && entwurf.marke) merkmale.push(entwurf.marke);
    else if (entwurf.merkmal) merkmale.push(MERKMAL.find((m) => m.id === entwurf.merkmal)?.name);
    if ((entwurf.anzahl ?? 1) > 1) merkmale.push(`${entwurf.anzahl} Stück`);

    const karte = el('div', { class: 'vorschaukarte', 'data-kategorie': kategorieId }, [
      el('div', { class: 'vorschaukarte__bild' }, [
        el('span', { class: 'vorschaukarte__kreis' }, [icon(kategorieId, 30)]),
      ]),
      el('div', { class: 'vorschaukarte__koerper' }, [
        el('p', {
          class: `vorschaukarte__name${entwurf.name ? '' : ' vorschaukarte__name--leer'}`,
          text: entwurf.name || '[Name des Teils]',
        }),
        el(
          'div',
          { class: 'vorschaukarte__chips' },
          merkmale.filter(Boolean).map((text) => el('span', { class: 'vorschauchip', text })),
        ),
      ]),
    ]);

    return karte;
  }

  /* --- Speichern --------------------------------------------------------- */

  function speichereTeil() {
    const teil = teilAusEntwurf(entwurf);
    const fehler = pruefeTeilAusfuehrlich(teil);

    fehlerJeFeld = {};
    for (const { feld, text } of fehler) {
      if (!fehlerJeFeld[feld]) fehlerJeFeld[feld] = text;
    }

    if (fehler.length > 0) {
      meldung = null;
      neuZeichnen();
      zeigeErstenFehler(fehler[0].feld);
      return;
    }

    try {
      if (modus === 'neu') speicher.teilAnlegen(teil);
      else speicher.teilAendern(teilId, teil);

      entwurf = null;
      window.location.hash = `#/teil/${encodeURIComponent(teil.id)}`;
    } catch (ausnahme) {
      meldung = {
        art: 'fehler',
        rolle: 'alert',
        text: 'Das Teil konnte nicht gespeichert werden.',
        zusatz: ausnahme instanceof SpeicherFehler
          ? ausnahme.message
          : String(ausnahme.message ?? ausnahme),
      };
      neuZeichnen();
    }
  }
}

/** Scrollt zum ersten Fehler und setzt den Fokus dorthin. */
function zeigeErstenFehler(feld) {
  // Nach dem Neuaufbau: erst im nächsten Bilddurchlauf suchen.
  requestAnimationFrame(() => {
    const stelle = document.querySelector(`[data-feld="${feld}"]`);
    if (!stelle) return;
    stelle.scrollIntoView({ block: 'center', behavior: 'smooth' });
    stelle.querySelector('input, textarea, button')?.focus({ preventScroll: true });
  });
}

/* --- Kleine Dialoge ------------------------------------------------------- */

/** Dialog mit einem Textfeld. Gibt den getrimmten Text oder null zurück. */
async function frageNachText({ titel, label, platzhalter, wert = '' }) {
  const id = `dialogfeld-${Math.random().toString(36).slice(2, 8)}`;
  const eingabe = el('input', {
    id,
    class: 'feld__eingabe',
    type: 'text',
    placeholder: platzhalter,
    autocomplete: 'off',
  });
  eingabe.value = wert;

  const bestaetigt = await frageNach({
    titel,
    inhalt: [el('div', { class: 'abschnitt' }, [
      el('label', { class: 'abschnitt__label', for: id, text: label }),
      eingabe,
    ])],
    bestaetigenText: 'Übernehmen',
  });

  const text = eingabe.value.trim();
  return bestaetigt && text !== '' ? text : null;
}

/** Dialog für eine eigene Größe: Einzelgröße oder Spanne von–bis. */
async function frageNachGroesse(system, vorhanden) {
  const werte = groessenWerte(system);
  const grenzen = GROESSENSYSTEME[system];

  function auswahl(id, label, wert) {
    const feld = el(
      'select',
      { id, class: 'feld__eingabe', 'aria-label': label },
      werte.map((w) => {
        const option = el('option', { value: String(w), text: String(w) });
        if (w === wert) option.selected = true;
        return option;
      }),
    );
    return feld;
  }

  const vonFeld = auswahl('groesse-von', 'Größe von', vorhanden?.von ?? werte[0]);
  const bisFeld = auswahl('groesse-bis', 'Größe bis', vorhanden?.bis ?? vorhanden?.von ?? werte[0]);

  const bestaetigt = await frageNach({
    titel: 'Eigene Größe',
    inhalt: [
      el('p', {
        class: 'dialog__hinweis',
        text: `${grenzen.name} von ${grenzen.von} bis ${grenzen.bis}. `
          + 'Für eine Einzelgröße beide Werte gleich lassen.',
      }),
      el('div', { class: 'groessenspanne' }, [
        el('div', { class: 'abschnitt' }, [
          el('label', { class: 'abschnitt__label', for: 'groesse-von', text: 'Von' }),
          vonFeld,
        ]),
        el('div', { class: 'abschnitt' }, [
          el('label', { class: 'abschnitt__label', for: 'groesse-bis', text: 'Bis' }),
          bisFeld,
        ]),
      ]),
    ],
    bestaetigenText: 'Übernehmen',
  });

  if (!bestaetigt) return null;

  const von = Number(vonFeld.value);
  const bis = Number(bisFeld.value);
  return { system, von: Math.min(von, bis), bis: Math.max(von, bis) };
}

/** Dialog für einen neuen Sammelkauf. Legt die Ausgabe an und gibt sie zurück. */
async function frageNachSammelkauf() {
  const ergebnis = await frageNachAusgabe({
    titel: 'Neuer Sammelkauf',
    bestaetigenText: 'Anlegen',
    // Ein Sammelkauf umfasst mehr als ein Teil – sonst ist es ein Einzelpreis.
    minTeile: 2,
    vorgabe: { anzahlTeile: 2 },
  });

  if (ergebnis?.aktion !== 'speichern') return null;
  return speicher.ausgabeAnlegen(ergebnis.werte);
}

/** "2026-09-12" wird zu "12.09.2026". */
function datumText(datum) {
  const teile = String(datum ?? '').slice(0, 10).split('-');
  return teile.length === 3 ? `${teile[2]}.${teile[1]}.${teile[0]}` : String(datum ?? '');
}
