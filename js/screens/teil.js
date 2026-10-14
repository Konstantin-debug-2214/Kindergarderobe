/**
 * teil.js – Screen "Detail" (#/teil/:id).
 *
 * Noch ein Platzhalter (Auftrag 05). Er zeigt aber schon Name, Kategorie, Art
 * und Anzahl des gespeicherten Teils, damit sich das Speichern prüfen lässt.
 */

import { el } from '../ui/dom.js';
import { knopf } from '../ui/knoepfe.js';
import { banner } from '../ui/banner.js';
import { kopfzeile } from '../ui/kopfzeile.js';
import { speicher } from '../storage.js';
import { JAHRESZEITEN, MERKMAL, PASSFORM, TYP, kategorie } from '../model.js';
import { groesseText } from '../formular.js';
import { formatEuro } from '../costs.js';
import { platzhalterScreen, testlinks } from './platzhalter.js';

export function teilScreen({ teilId }) {
  const teil = speicher.teil(teilId);

  if (!teil) {
    return el('div', { class: 'inhalt' }, [
      kopfzeile({ titel: 'Teil', zurueckZu: '#/' }),
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

  return platzhalterScreen({
    titel: teil.name,
    unterzeile: `${kategorie(teil.kategorie)?.name ?? ''} · ${teil.art}`,
    zurueckZu: '#/',
    beschreibung:
      'Hier stehen später die Teile der Kategorie links und rechts die Details mit '
      + 'Passform zum Antippen und den Knöpfen "Bearbeiten" und "Aussortieren".',
    werte: werteVon(teil),
    weiteres: [
      testlinks('Testlinks (vorläufig)', [
        knopf({
          text: 'Bearbeiten',
          href: `#/teil/${encodeURIComponent(teil.id)}/bearbeiten`,
          iconName: 'stift',
          variante: 'primaer',
        }),
      ]),
    ],
  });
}

/** Die gespeicherten Werte als Liste für den Platzhalter. */
function werteVon(teil) {
  const werte = [
    { name: 'Name', wert: teil.name },
    { name: 'Kategorie', wert: kategorie(teil.kategorie)?.name ?? teil.kategorie },
    { name: 'Art', wert: teil.art },
    { name: 'Anzahl', wert: String(teil.anzahl) },
  ];

  if (teil.typ === TYP.KLEIDUNG) {
    if (teil.groesse) werte.push({ name: 'Größe', wert: groesseText(teil.groesse) });
    const jahreszeiten = (teil.jahreszeiten ?? [])
      .map((id) => JAHRESZEITEN.find((j) => j.id === id)?.name)
      .filter(Boolean);
    if (jahreszeiten.length > 0) {
      werte.push({ name: 'Jahreszeit', wert: jahreszeiten.join(' · ') });
    }
    const passform = PASSFORM.find((p) => p.id === teil.passform);
    if (passform) werte.push({ name: 'Passform', wert: passform.name });
  } else if (teil.alterAb !== null && teil.alterAb !== undefined) {
    werte.push({ name: 'Alter ab', wert: `${teil.alterAb}` });
  }

  if (teil.farbe) werte.push({ name: 'Farbe', wert: teil.farbe });

  if (teil.merkmal === 'marke' && teil.marke) {
    werte.push({ name: 'Marke', wert: teil.marke });
  } else if (teil.merkmal) {
    werte.push({
      name: 'Merkmal',
      wert: MERKMAL.find((m) => m.id === teil.merkmal)?.name ?? teil.merkmal,
    });
  }

  if (teil.tags?.length > 0) {
    werte.push({ name: 'Freie Merkmale', wert: teil.tags.join(' · ') });
  }

  if (teil.preis?.art === 'einzeln') {
    werte.push({ name: 'Preis', wert: formatEuro(teil.preis.betrag) });
  } else if (teil.preis?.art === 'sammelkauf') {
    const ausgabe = speicher.ausgaben().find((a) => a.id === teil.preis.ausgabeId);
    werte.push({
      name: 'Preis',
      wert: ausgabe
        ? `Sammelkauf: ${ausgabe.bezeichnung} · ${formatEuro(ausgabe.betrag)} für `
          + `${ausgabe.anzahlTeile} Teile`
        : 'Sammelkauf',
    });
  }

  if (teil.notiz) werte.push({ name: 'Notiz', wert: teil.notiz });

  return werte;
}
