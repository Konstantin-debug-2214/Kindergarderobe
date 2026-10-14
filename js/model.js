/**
 * model.js – Datenmodell: Konstanten, Fabriken und Validierung.
 *
 * Reine Logik ohne DOM-Zugriff, damit sie isoliert testbar ist.
 * Alle Konstanten aus CLAUDE.md stehen hier an einer Stelle und sind leicht
 * änderbar.
 *
 * Geldbeträge sind durchgehend ganze Zahlen in Cent (8,00 € = 800).
 */

export const SCHEMA_VERSION = 1;

/* --- Typ ------------------------------------------------------------------ */

export const TYP = {
  KLEIDUNG: 'kleidung',
  SPIELZEUG: 'spielzeug',
};

/* --- Größensysteme -------------------------------------------------------- */

export const GROESSENSYSTEM = {
  KONFEKTION: 'konfektion',
  SCHUH: 'schuh',
  KOPF: 'kopf',
  HANDSCHUH: 'handschuh',
};

export const GROESSENSYSTEME = {
  konfektion: { name: 'Konfektionsgröße', von: 50, bis: 164, schritt: 6, einheit: '' },
  schuh: { name: 'EU-Schuhgröße', von: 17, bis: 40, schritt: 1, einheit: '' },
  kopf: { name: 'Kopfumfang', von: 35, bis: 58, schritt: 1, einheit: 'cm' },
  handschuh: { name: 'Handschuhgröße', von: 0, bis: 6, schritt: 1, einheit: '' },
};

/** Alle gängigen Werte eines Größensystems, z. B. 50, 56, 62 … 164. */
export function groessenWerte(system) {
  const s = GROESSENSYSTEME[system];
  if (!s) return [];
  const werte = [];
  for (let wert = s.von; wert <= s.bis; wert += s.schritt) werte.push(wert);
  return werte;
}

/* --- Kategorien und Arten ------------------------------------------------- */

export const KATEGORIEN = [
  {
    id: 'oberteile',
    name: 'Oberteile',
    groessenSystem: GROESSENSYSTEM.KONFEKTION,
    arten: ['T-Shirt', 'Langarmshirt', 'Pullover', 'Strickjacke', 'Hemd', 'Weste',
      'Jacke', 'Regenjacke', 'Winterjacke', 'Softshelljacke', 'Body', 'Unterhemd'],
  },
  {
    id: 'unterteile',
    name: 'Unterteile',
    groessenSystem: GROESSENSYSTEM.KONFEKTION,
    arten: ['Hose', 'Jeans', 'Jogginghose', 'Leggings', 'Shorts', 'Latzhose',
      'Matschhose', 'Strumpfhose', 'Unterhose', 'Socken', 'Badehose'],
  },
  {
    id: 'sets_sonstiges',
    name: 'Sets & Sonstiges',
    groessenSystem: GROESSENSYSTEM.KONFEKTION,
    arten: ['Set (Oberteil + Hose)', 'Schlafanzug', 'Strampler', 'Overall',
      'Schneeanzug', 'Softshellanzug', 'Schlafsack', 'Sonstiges'],
  },
  {
    id: 'schuhe',
    name: 'Schuhe',
    groessenSystem: GROESSENSYSTEM.SCHUH,
    arten: ['Sneaker', 'Sandalen', 'Gummistiefel', 'Winterstiefel', 'Hausschuhe'],
  },
  {
    id: 'muetzen',
    name: 'Mützen & Co.',
    groessenSystem: GROESSENSYSTEM.KOPF,
    arten: ['Mütze', 'Beanie', 'Cap', 'Sonnenhut', 'Regenmütze', 'Handschuhe',
      'Fäustlinge', 'Schal', 'Halstuch'],
  },
  {
    id: 'spielzeug',
    name: 'Spielzeug',
    groessenSystem: null,
    arten: ['Brettspiel', 'Puzzle', 'Lego', 'Auto', 'Bastelkram', 'Kuscheltier', 'Buch'],
  },
];

/** Die Kategorie, zu der Spielzeug immer gehört. */
export const KATEGORIE_SPIELZEUG = 'spielzeug';

/** Arten, die vom Größensystem ihrer Kategorie abweichen (siehe CLAUDE.md). */
const GROESSEN_SONDERFAELLE = {
  unterteile: { Socken: GROESSENSYSTEM.SCHUH },
  muetzen: { Handschuhe: GROESSENSYSTEM.HANDSCHUH, Fäustlinge: GROESSENSYSTEM.HANDSCHUH },
};

export function kategorie(id) {
  return KATEGORIEN.find((k) => k.id === id) || null;
}

/** Die fünf Kleidungs-Kategorien (alles außer Spielzeug). */
export function kleidungsKategorien() {
  return KATEGORIEN.filter((k) => k.id !== KATEGORIE_SPIELZEUG);
}

export function istKleidungsKategorie(id) {
  return Boolean(kategorie(id)) && id !== KATEGORIE_SPIELZEUG;
}

/** Arten einer Kategorie. */
export function artenVon(kategorieId) {
  return kategorie(kategorieId)?.arten ?? [];
}

/**
 * Größensystem für Kategorie und Art – beachtet die Sonderfälle aus CLAUDE.md
 * (Socken in EU-Schuhgröße, Handschuhe und Fäustlinge in Handschuhgröße).
 */
export function groessenSystemFuer(kategorieId, art) {
  const k = kategorie(kategorieId);
  if (!k) return null;
  return GROESSEN_SONDERFAELLE[kategorieId]?.[art] ?? k.groessenSystem;
}

/* --- Jahreszeiten (nur Kleidung) ------------------------------------------ */

export const JAHRESZEITEN = [
  { id: 'fruehling', name: 'Frühling', monate: [3, 4, 5], monateKurz: 'März – Mai' },
  { id: 'sommer', name: 'Sommer', monate: [6, 7, 8], monateKurz: 'Juni – Aug.' },
  { id: 'herbst', name: 'Herbst', monate: [9, 10, 11], monateKurz: 'Sept. – Nov.' },
  { id: 'winter', name: 'Winter', monate: [12, 1, 2], monateKurz: 'Dez. – Feb.' },
];

export function jahreszeit(id) {
  return JAHRESZEITEN.find((j) => j.id === id) || null;
}

/** Die Jahreszeit zu einem Datum (für die "Jetzt"-Markierung). */
export function aktuelleJahreszeit(datum = new Date()) {
  const monat = datum.getMonth() + 1;
  return JAHRESZEITEN.find((j) => j.monate.includes(monat)).id;
}

/* --- Weitere Auswahllisten ------------------------------------------------ */

export const PASSFORM = [
  { id: 'passt_gut', name: 'Passt gut' },
  { id: 'bald_zu_klein', name: 'Bald zu klein' },
  { id: 'zu_klein', name: 'Zu klein' },
];

export const MERKMAL = [
  { id: 'blanko', name: 'Blanko' },
  { id: 'aufdruck', name: 'Aufdruck' },
  { id: 'marke', name: 'Marke' },
];

export const FARBEN = ['gelb', 'rot', 'blau', 'grün', 'grau', 'weiß', 'bunt'];

export const AUSSORTIER_GRUENDE = [
  { id: 'zu_klein', name: 'Zu klein' },
  { id: 'verschenkt', name: 'Verschenkt' },
  { id: 'verkauft', name: 'Verkauft' },
  { id: 'kaputt', name: 'Kaputt' },
];

export const ALTER_AB_VORGABEN = [0, 1, 2, 3, 4, 6, 8];

export const PREIS_ART = { EINZELN: 'einzeln', SAMMELKAUF: 'sammelkauf' };

/* --- Fabriken ------------------------------------------------------------- */

function neueId() {
  return globalThis.crypto.randomUUID();
}

function jetzt() {
  return new Date().toISOString();
}

/**
 * Neues Kleidungsteil mit Standardwerten.
 * @param {Object} [werte] überschreibt einzelne Felder
 */
export function neuesKleidungsteil(werte = {}) {
  const zeit = jetzt();
  return {
    id: neueId(),
    typ: TYP.KLEIDUNG,
    name: '',
    kategorie: 'oberteile',
    art: '',
    anzahl: 1,
    groesse: null,
    jahreszeiten: [],
    passform: 'passt_gut',
    aussortiert: false,
    farbe: null,
    merkmal: null,
    marke: null,
    preis: null,
    notiz: '',
    hinzugefuegtAm: zeit,
    geaendertAm: zeit,
    ...werte,
  };
}

/**
 * Neues Spielzeug mit Standardwerten.
 * Spielzeug hat keine Größe, keine Jahreszeiten und keine Passform.
 */
export function neuesSpielzeug(werte = {}) {
  const zeit = jetzt();
  return {
    id: neueId(),
    typ: TYP.SPIELZEUG,
    name: '',
    kategorie: KATEGORIE_SPIELZEUG,
    art: '',
    anzahl: 1,
    alterAb: null,
    tags: [],
    aussortiert: false,
    farbe: null,
    merkmal: null,
    marke: null,
    preis: null,
    notiz: '',
    hinzugefuegtAm: zeit,
    geaendertAm: zeit,
    ...werte,
  };
}

/** Größe für ein Kleidungsstück. Bei Einzelgröße gilt von === bis. */
export function groesse(system, von, bis = von) {
  return { system, von, bis };
}

/* --- Validierung ---------------------------------------------------------- */

function istGanzeZahl(wert) {
  return typeof wert === 'number' && Number.isInteger(wert);
}

function pruefeGroesse(teil, melde) {
  const erwartet = groessenSystemFuer(teil.kategorie, teil.art);

  if (!teil.groesse || typeof teil.groesse !== 'object') {
    melde('groesse', 'Größe fehlt.');
    return;
  }

  const { system, von, bis } = teil.groesse;

  if (!GROESSENSYSTEME[system]) {
    melde('groesse', 'Unbekanntes Größensystem.');
    return;
  }

  if (erwartet && system !== erwartet) {
    melde('groesse',
      `Größensystem passt nicht zur Kategorie: erwartet ${GROESSENSYSTEME[erwartet].name}.`);
  }

  if (typeof von !== 'number' || typeof bis !== 'number') {
    melde('groesse', 'Größe braucht die Werte von und bis als Zahl.');
    return;
  }

  if (von > bis) {
    melde('groesse', 'Größe: von darf nicht größer als bis sein.');
  }

  const grenzen = GROESSENSYSTEME[system];
  if (von < grenzen.von || bis > grenzen.bis) {
    melde('groesse',
      `Größe liegt außerhalb von ${grenzen.name} (${grenzen.von} bis ${grenzen.bis}).`);
  }
}

/**
 * Prüft ein Teil gegen das Datenmodell und nennt zu jedem Fehler das Feld.
 * Das Formular zeigt die Meldung damit direkt am betroffenen Feld an.
 *
 * @param {Object} teil
 * @returns {Array<{feld: string, text: string}>} leer, wenn alles passt
 */
export function pruefeTeilAusfuehrlich(teil) {
  const fehler = [];
  const melde = (feld, text) => fehler.push({ feld, text });

  if (!teil || typeof teil !== 'object') {
    return [{ feld: 'teil', text: 'Teil fehlt oder ist kein Objekt.' }];
  }

  if (typeof teil.id !== 'string' || teil.id === '') {
    melde('id', 'Das Teil hat keine id.');
  }

  const istKleidung = teil.typ === TYP.KLEIDUNG;
  const istSpielzeug = teil.typ === TYP.SPIELZEUG;
  if (!istKleidung && !istSpielzeug) {
    melde('typ', 'Typ muss kleidung oder spielzeug sein.');
  }

  if (typeof teil.name !== 'string' || teil.name.trim() === '') {
    melde('name', 'Name fehlt.');
  }

  if (!kategorie(teil.kategorie)) {
    melde('kategorie', 'Unbekannte Kategorie.');
  } else if (istSpielzeug && teil.kategorie !== KATEGORIE_SPIELZEUG) {
    melde('kategorie', 'Spielzeug gehört immer zur Kategorie Spielzeug.');
  } else if (istKleidung && teil.kategorie === KATEGORIE_SPIELZEUG) {
    melde('kategorie', 'Kleidung gehört nicht zur Kategorie Spielzeug.');
  }

  if (typeof teil.art !== 'string' || teil.art.trim() === '') {
    melde('art', 'Art fehlt.');
  }

  if (!istGanzeZahl(teil.anzahl) || teil.anzahl < 1) {
    melde('anzahl', 'Anzahl muss eine ganze Zahl ab 1 sein.');
  }

  if (typeof teil.aussortiert !== 'boolean') {
    melde('aussortiert', 'Das Feld aussortiert muss wahr oder falsch sein.');
  }

  if (istKleidung) {
    pruefeGroesse(teil, melde);

    if (!Array.isArray(teil.jahreszeiten) || teil.jahreszeiten.length === 0) {
      melde('jahreszeiten', 'Mindestens eine Jahreszeit angeben.');
    } else if (teil.jahreszeiten.some((id) => !jahreszeit(id))) {
      melde('jahreszeiten', 'Unbekannte Jahreszeit.');
    }

    if (!PASSFORM.some((p) => p.id === teil.passform)) {
      melde('passform', 'Passform fehlt oder ist unbekannt.');
    }
  }

  if (istSpielzeug) {
    if (teil.groesse) melde('groesse', 'Spielzeug hat keine Größe.');
    if (Array.isArray(teil.jahreszeiten) && teil.jahreszeiten.length > 0) {
      melde('jahreszeiten', 'Spielzeug hat keine Jahreszeiten.');
    }
    if (teil.passform) melde('passform', 'Spielzeug hat keine Passform.');
    if (teil.alterAb !== null && teil.alterAb !== undefined
      && (!istGanzeZahl(teil.alterAb) || teil.alterAb < 0)) {
      melde('alterAb', 'Alter ab muss eine ganze Zahl ab 0 sein.');
    }
    if (teil.tags !== undefined && !Array.isArray(teil.tags)) {
      melde('tags', 'Die freien Merkmale müssen eine Liste sein.');
    }
  }

  if (teil.merkmal && !MERKMAL.some((m) => m.id === teil.merkmal)) {
    melde('merkmal', 'Unbekanntes Merkmal.');
  }

  if (teil.merkmal === 'marke') {
    if (typeof teil.marke !== 'string' || teil.marke.trim() === '') {
      melde('marke', 'Bei Merkmal Marke muss eine Marke angegeben sein.');
    }
  } else if (teil.marke) {
    melde('marke', 'Eine Marke ist nur bei Merkmal Marke erlaubt.');
  }

  if (teil.aussortiert && teil.aussortiertGrund
    && !AUSSORTIER_GRUENDE.some((g) => g.id === teil.aussortiertGrund)) {
    melde('aussortiertGrund', 'Unbekannter Grund fürs Aussortieren.');
  }

  if (teil.preis) {
    if (teil.preis.art === PREIS_ART.EINZELN) {
      if (!istGanzeZahl(teil.preis.betrag) || teil.preis.betrag < 0) {
        melde('preis', 'Preis muss ein Betrag in Cent als ganze Zahl ab 0 sein.');
      }
    } else if (teil.preis.art === PREIS_ART.SAMMELKAUF) {
      if (typeof teil.preis.ausgabeId !== 'string' || teil.preis.ausgabeId === '') {
        melde('preis', 'Beim Sammelkauf fehlt die Verknüpfung zur Ausgabe.');
      }
    } else {
      melde('preis', 'Preis muss einzeln oder sammelkauf sein.');
    }
  }

  return fehler;
}

/**
 * Prüft ein Teil und gibt nur die Meldungen zurück.
 * @param {Object} teil
 * @returns {Array<string>} Fehlermeldungen auf Deutsch, leer wenn alles passt
 */
export function pruefeTeil(teil) {
  return pruefeTeilAusfuehrlich(teil).map((fehler) => fehler.text);
}
