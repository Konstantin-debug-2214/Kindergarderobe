/**
 * storage.js – der einzige Zugriff auf localStorage.
 *
 * Der gesamte Zustand liegt unter einem Schlüssel:
 *   { version, teile, ausgaben, marken, sollMengen, einstellungen }
 *
 * Jede Änderung an Daten erhöht einstellungen.aenderungenSeitBackup um 1 und
 * löst das Ereignis "aenderung" aus, damit Screens neu zeichnen können.
 *
 * Für Tests lässt sich ein eigener Hintergrundspeicher übergeben
 * (erstelleSpeicher), damit kein echtes localStorage nötig ist.
 */

import { SCHEMA_VERSION } from './model.js';

export const SPEICHER_SCHLUESSEL = 'kindergarderobe';

/**
 * Zweiter Schlüssel nur für Oberflächen-Zustand (z. B. ein ausgeblendeter
 * Hinweis). Bewusst getrennt von den Daten: zählt nicht als Änderung und
 * gehört nicht ins Backup.
 */
export const OBERFLAECHE_SCHLUESSEL = 'kindergarderobe-oberflaeche';

/** Fehler beim Schreiben – trägt eine Meldung für die Oberfläche. */
export class SpeicherFehler extends Error {
  constructor(meldung, ursache) {
    super(meldung);
    this.name = 'SpeicherFehler';
    this.cause = ursache;
  }
}

/** Leerer Zustand beim ersten Start. */
export function leererZustand() {
  return {
    version: SCHEMA_VERSION,
    teile: [],
    ausgaben: [],
    marken: [],
    sollMengen: [],
    einstellungen: {
      name: '',
      letztesBackupAm: null,
      aenderungenSeitBackup: 0,
    },
  };
}

/** Einfacher Speicher im Arbeitsspeicher – Rückfall und Grundlage für Tests. */
export function speicherImArbeitsspeicher() {
  const werte = new Map();
  return {
    getItem: (schluessel) => (werte.has(schluessel) ? werte.get(schluessel) : null),
    setItem: (schluessel, wert) => { werte.set(schluessel, String(wert)); },
    removeItem: (schluessel) => { werte.delete(schluessel); },
  };
}

function standardHintergrund() {
  try {
    if (globalThis.localStorage) {
      // Zugriff einmal testen: im privaten Modus kann er werfen.
      globalThis.localStorage.getItem(SPEICHER_SCHLUESSEL);
      return globalThis.localStorage;
    }
  } catch {
    // Kein nutzbares localStorage: im Arbeitsspeicher weiterarbeiten.
  }
  return speicherImArbeitsspeicher();
}

function neueId() {
  return globalThis.crypto.randomUUID();
}

function jetzt() {
  return new Date().toISOString();
}

/**
 * Baut eine Speicher-Schnittstelle über einem Hintergrundspeicher.
 * @param {{getItem: Function, setItem: Function, removeItem: Function}} [hintergrund]
 */
export function erstelleSpeicher(hintergrund = standardHintergrund()) {
  const ereignisse = new EventTarget();

  /* --- Lesen und Schreiben ------------------------------------------------ */

  function lies() {
    let roh = null;
    try {
      roh = hintergrund.getItem(SPEICHER_SCHLUESSEL);
    } catch (ursache) {
      throw new SpeicherFehler('Die Daten konnten nicht gelesen werden.', ursache);
    }

    if (!roh) return leererZustand();

    try {
      const zustand = JSON.parse(roh);
      // Fehlende Felder ergänzen, damit ältere Stände weiter funktionieren.
      return { ...leererZustand(), ...zustand, einstellungen: {
        ...leererZustand().einstellungen,
        ...(zustand.einstellungen || {}),
      } };
    } catch (ursache) {
      throw new SpeicherFehler(
        'Die gespeicherten Daten sind beschädigt und konnten nicht gelesen werden.',
        ursache,
      );
    }
  }

  function schreibe(zustand) {
    try {
      hintergrund.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(zustand));
    } catch (ursache) {
      const voll = ursache?.name === 'QuotaExceededError'
        || ursache?.name === 'NS_ERROR_DOM_QUOTA_REACHED';
      throw new SpeicherFehler(
        voll
          ? 'Der Speicher des Browsers ist voll. Bitte ein Backup sichern und Platz schaffen.'
          : 'Die Änderung konnte nicht gespeichert werden.',
        ursache,
      );
    }
  }

  function melde(art) {
    ereignisse.dispatchEvent(new CustomEvent('aenderung', { detail: { art } }));
  }

  /**
   * Führt eine Änderung aus: liest, ändert, zählt den Änderungszähler hoch,
   * schreibt und meldet. Der Rückgabewert von aendere wird durchgereicht.
   */
  function aendere(art, aendere_, { zaehlen = true } = {}) {
    const zustand = lies();
    const ergebnis = aendere_(zustand);
    if (zaehlen) {
      zustand.einstellungen.aenderungenSeitBackup += 1;
    }
    schreibe(zustand);
    melde(art);
    return ergebnis;
  }

  function findeTeil(zustand, id) {
    const teil = zustand.teile.find((t) => t.id === id);
    if (!teil) throw new SpeicherFehler('Das Teil wurde nicht gefunden.');
    return teil;
  }

  /* --- Oberflächen-Zustand ------------------------------------------------ */

  /**
   * Eigener Schlüssel, eigene Fehlerbehandlung: Geht hier etwas schief, ist
   * das kein Grund, die App anzuhalten – es wird höchstens ein Hinweis
   * wieder eingeblendet.
   */
  function liesOberflaeche() {
    try {
      const roh = hintergrund.getItem(OBERFLAECHE_SCHLUESSEL);
      const werte = roh ? JSON.parse(roh) : null;
      return werte && typeof werte === 'object' ? werte : {};
    } catch {
      return {};
    }
  }

  function schreibeOberflaeche(werte) {
    try {
      hintergrund.setItem(OBERFLAECHE_SCHLUESSEL, JSON.stringify(werte));
    } catch {
      // Oberflächen-Zustand ist entbehrlich.
    }
  }

  /** Hebt ein Ausblenden auf, damit der Hinweis wieder erscheinen kann. */
  function vergissBannerAusblenden() {
    const werte = liesOberflaeche();
    delete werte.bannerAusgeblendetBei;
    schreibeOberflaeche(werte);
  }

  return {
    /** Für Tests und Fehlersuche: der rohe Hintergrundspeicher. */
    hintergrund,

    /** Ereignisziel: auf "aenderung" hören, um neu zu zeichnen. */
    ereignisse,

    /** Meldet eine Funktion an, die nach jeder Änderung läuft. */
    beiAenderung(rueckruf) {
      ereignisse.addEventListener('aenderung', rueckruf);
      return () => ereignisse.removeEventListener('aenderung', rueckruf);
    },

    /* --- Lesen ------------------------------------------------------------ */

    zustand: lies,
    teile: () => lies().teile,
    /** Teile im Schrank (ohne Aussortiertes). */
    teileImSchrank: () => lies().teile.filter((t) => !t.aussortiert),
    aussortierteTeile: () => lies().teile.filter((t) => t.aussortiert),
    teil: (id) => lies().teile.find((t) => t.id === id) || null,
    ausgaben: () => lies().ausgaben,
    marken: () => lies().marken,
    sollMengen: () => lies().sollMengen,
    einstellungen: () => lies().einstellungen,

    /* --- Teile ------------------------------------------------------------ */

    /** Legt ein Teil an. Einzelpreis erzeugt automatisch eine Ausgabe. */
    teilAnlegen(teil) {
      return aendere('teilAnlegen', (zustand) => {
        const neu = { ...teil, geaendertAm: jetzt() };
        verknuepfeEinzelpreis(zustand, neu);
        zustand.teile.push(neu);
        return neu;
      });
    },

    /** Ändert ein Teil. Felder in aenderungen überschreiben die alten. */
    teilAendern(id, aenderungen) {
      return aendere('teilAendern', (zustand) => {
        const teil = findeTeil(zustand, id);
        Object.assign(teil, aenderungen, { geaendertAm: jetzt() });
        verknuepfeEinzelpreis(zustand, teil);
        return teil;
      });
    },

    /** Legt ein Teil in den Papierkorb und hält den Grund fest. */
    teilAussortieren(id, grund) {
      return aendere('teilAussortieren', (zustand) => {
        const teil = findeTeil(zustand, id);
        teil.aussortiert = true;
        teil.aussortiertAm = jetzt();
        teil.aussortiertGrund = grund ?? null;
        teil.geaendertAm = jetzt();
        return teil;
      });
    },

    /** Holt ein Teil aus dem Papierkorb zurück. */
    teilZurueckholen(id) {
      return aendere('teilZurueckholen', (zustand) => {
        const teil = findeTeil(zustand, id);
        teil.aussortiert = false;
        teil.aussortiertAm = null;
        teil.aussortiertGrund = null;
        teil.geaendertAm = jetzt();
        return teil;
      });
    },

    /**
     * Löscht alle aussortierten Teile endgültig.
     * Die verknüpften Ausgaben bleiben erhalten (Kosten zählen weiter).
     * @returns {number} Anzahl gelöschter Einträge
     */
    aussortiertLeeren() {
      return aendere('aussortiertLeeren', (zustand) => {
        const vorher = zustand.teile.length;
        zustand.teile = zustand.teile.filter((t) => !t.aussortiert);
        return vorher - zustand.teile.length;
      });
    },

    /* --- Ausgaben --------------------------------------------------------- */

    ausgabeAnlegen({ bezeichnung, datum, betrag, anzahlTeile = 1 }) {
      return aendere('ausgabeAnlegen', (zustand) => {
        const ausgabe = {
          id: neueId(),
          bezeichnung,
          datum: datum ?? jetzt().slice(0, 10),
          betrag,
          anzahlTeile,
        };
        zustand.ausgaben.push(ausgabe);
        return ausgabe;
      });
    },

    ausgabeAendern(id, aenderungen) {
      return aendere('ausgabeAendern', (zustand) => {
        const ausgabe = zustand.ausgaben.find((a) => a.id === id);
        if (!ausgabe) throw new SpeicherFehler('Die Ausgabe wurde nicht gefunden.');
        Object.assign(ausgabe, aenderungen);
        return ausgabe;
      });
    },

    /** Löscht eine Ausgabe und löst die Verknüpfung an den Teilen. */
    ausgabeLoeschen(id) {
      return aendere('ausgabeLoeschen', (zustand) => {
        zustand.ausgaben = zustand.ausgaben.filter((a) => a.id !== id);
        for (const teil of zustand.teile) {
          if (teil.preis?.ausgabeId === id) teil.preis = null;
        }
      });
    },

    /* --- Marken ----------------------------------------------------------- */

    markeAnlegen(name) {
      return aendere('markeAnlegen', (zustand) => {
        const sauber = String(name).trim();
        if (sauber === '') throw new SpeicherFehler('Die Marke braucht einen Namen.');
        if (!zustand.marken.includes(sauber)) zustand.marken.push(sauber);
        return sauber;
      });
    },

    /** Löscht eine Marke aus der Liste. An bestehenden Teilen bleibt sie stehen. */
    markeLoeschen(name) {
      return aendere('markeLoeschen', (zustand) => {
        zustand.marken = zustand.marken.filter((m) => m !== name);
      });
    },

    /* --- Soll-Mengen ------------------------------------------------------ */

    sollMengeSetzen(art, jahreszeit, soll) {
      return aendere('sollMengeSetzen', (zustand) => {
        const vorhanden = zustand.sollMengen.find(
          (s) => s.art === art && s.jahreszeit === jahreszeit,
        );
        if (vorhanden) {
          vorhanden.soll = soll;
          return vorhanden;
        }
        const neu = { id: neueId(), art, jahreszeit, soll };
        zustand.sollMengen.push(neu);
        return neu;
      });
    },

    sollMengeLoeschen(art, jahreszeit) {
      return aendere('sollMengeLoeschen', (zustand) => {
        zustand.sollMengen = zustand.sollMengen.filter(
          (s) => !(s.art === art && s.jahreszeit === jahreszeit),
        );
      });
    },

    /* --- Oberflächen-Zustand ---------------------------------------------- */

    /**
     * Zählerstand, bei dem der Backup-Hinweis ausgeblendet wurde,
     * oder null, wenn er sichtbar sein soll.
     * @returns {number|null}
     */
    bannerAusgeblendetBei() {
      const wert = liesOberflaeche().bannerAusgeblendetBei;
      return Number.isInteger(wert) ? wert : null;
    },

    /**
     * Blendet den Backup-Hinweis bis zur nächsten Änderung aus.
     * Keine Datenänderung: der Zähler bleibt, das Backup unberührt.
     * @param {number} stand aktueller Wert von aenderungenSeitBackup
     */
    bannerAusblenden(stand) {
      schreibeOberflaeche({ ...liesOberflaeche(), bannerAusgeblendetBei: stand });
    },

    /** Hebt das Ausblenden auf – nach Export und Import. */
    bannerWiederZeigen: vergissBannerAusblenden,

    /**
     * Abgehakte Einträge der Besorgen-Liste. Reine Merkhilfe: zählt nicht als
     * Datenänderung und gehört nicht ins Backup.
     * @returns {Array<string>} Schlüssel der Form "winter|Pullover"
     */
    besorgtHaken() {
      const werte = liesOberflaeche().besorgt;
      return Array.isArray(werte) ? werte : [];
    },

    /** Setzt oder entfernt einen Haken. */
    besorgtSetzen(schluessel, gesetzt) {
      const werte = new Set(this.besorgtHaken());
      if (gesetzt) werte.add(schluessel); else werte.delete(schluessel);
      schreibeOberflaeche({ ...liesOberflaeche(), besorgt: [...werte] });
    },

    /** Entfernt Haken, für die es nichts mehr zu besorgen gibt. */
    besorgtAufraeumen(noetigeSchluessel) {
      const noetig = new Set(noetigeSchluessel);
      const werte = this.besorgtHaken().filter((schluessel) => noetig.has(schluessel));
      if (werte.length === this.besorgtHaken().length) return;
      schreibeOberflaeche({ ...liesOberflaeche(), besorgt: werte });
    },

    /* --- Einstellungen ---------------------------------------------------- */

    nameSetzen(name) {
      return aendere('nameSetzen', (zustand) => {
        zustand.einstellungen.name = String(name);
        return zustand.einstellungen.name;
      });
    },

    /**
     * Hält ein erfolgreiches Backup fest: Zeitpunkt merken, Zähler auf 0.
     * Das ist keine Datenänderung und zählt deshalb nicht mit.
     */
    backupNotieren(zeitpunkt = jetzt()) {
      // Der Zähler beginnt von vorn, deshalb gilt auch ein früheres
      // Ausblenden des Hinweises nicht mehr.
      vergissBannerAusblenden();
      return aendere('backupNotieren', (zustand) => {
        zustand.einstellungen.letztesBackupAm = zeitpunkt;
        zustand.einstellungen.aenderungenSeitBackup = 0;
      }, { zaehlen: false });
    },

    /**
     * Ersetzt alle Daten (Backup einspielen). Der Zustand entspricht danach
     * genau dem Backup, deshalb steht der Änderungszähler auf 0.
     */
    allesErsetzen(daten, { letztesBackupAm = jetzt() } = {}) {
      vergissBannerAusblenden();
      return aendere('allesErsetzen', (zustand) => {
        const frisch = leererZustand();
        zustand.version = SCHEMA_VERSION;
        zustand.teile = daten.teile ?? frisch.teile;
        zustand.ausgaben = daten.ausgaben ?? frisch.ausgaben;
        zustand.marken = daten.marken ?? frisch.marken;
        zustand.sollMengen = daten.sollMengen ?? frisch.sollMengen;
        zustand.einstellungen = {
          ...frisch.einstellungen,
          name: daten.einstellungen?.name ?? '',
          letztesBackupAm,
          aenderungenSeitBackup: 0,
        };
      }, { zaehlen: false });
    },

    /** Löscht alles (nur für Tests und Fehlersuche). */
    allesLoeschen() {
      hintergrund.removeItem(SPEICHER_SCHLUESSEL);
      hintergrund.removeItem(OBERFLAECHE_SCHLUESSEL);
      melde('allesLoeschen');
    },
  };
}

/**
 * Sorgt dafür, dass zu einem Einzelpreis genau eine Ausgabe mit
 * anzahlTeile: 1 gehört – angelegt oder aktualisiert. So lassen sich alle
 * Summen allein aus ausgaben berechnen (siehe CLAUDE.md, Abschnitt Kosten).
 */
function verknuepfeEinzelpreis(zustand, teil) {
  if (teil.preis?.art !== 'einzeln') return;

  const betrag = teil.preis.betrag;
  const vorhanden = teil.preis.ausgabeId
    ? zustand.ausgaben.find((a) => a.id === teil.preis.ausgabeId)
    : null;

  if (vorhanden) {
    vorhanden.bezeichnung = teil.name;
    vorhanden.betrag = betrag;
    vorhanden.anzahlTeile = 1;
    return;
  }

  const ausgabe = {
    id: neueId(),
    bezeichnung: teil.name,
    datum: jetzt().slice(0, 10),
    betrag,
    anzahlTeile: 1,
  };
  zustand.ausgaben.push(ausgabe);
  teil.preis = { art: 'einzeln', betrag, ausgabeId: ausgabe.id };
}

/** Die Instanz, mit der die App arbeitet. */
export const speicher = erstelleSpeicher();
