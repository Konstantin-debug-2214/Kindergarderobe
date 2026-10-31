/**
 * router.js – Hash-Router.
 *
 * Reine Logik ohne DOM-Zugriff (außer location/history), damit das Zuordnen
 * von Pfad zu Route isoliert testbar bleibt. Was gezeichnet wird, entscheidet
 * app.js über den Rückruf `beiWechsel`.
 */

/** Alle Routen der App. Reihenfolge: die genauere Route steht zuerst. */
export const ROUTEN = [
  { muster: '/', screen: 'uebersicht' },
  { muster: '/kategorie/:kategorieId', screen: 'kategorie' },
  { muster: '/jahreszeit/:jahreszeitId', screen: 'jahreszeit' },
  { muster: '/teil/:teilId/bearbeiten', screen: 'teilBearbeiten' },
  { muster: '/teil/:teilId', screen: 'teil' },
  { muster: '/neu', screen: 'neu' },
  { muster: '/kosten', screen: 'kosten' },
  { muster: '/statistik', screen: 'statistik' },
  { muster: '/saisonwechsel', screen: 'saisonwechsel' },
  { muster: '/aussortiert', screen: 'aussortiert' },
  { muster: '/einstellungen', screen: 'einstellungen' },
];

/** Route, auf die unbekannte Adressen führen. */
export const STANDARD_HASH = '#/';

/**
 * Tiefe des aktuellen Verlaufseintrags innerhalb der App: 0 ist der Einstieg
 * (Startbildschirm, Link), jeder neue Eintrag zählt eins weiter. Die Tiefe
 * steht zusätzlich in history.state und ist damit auch nach der Zurück-Geste
 * und nach dem Neuladen richtig.
 */
let tiefe = 0;

/** Ist der Router schon gestartet? Vorher gibt es keinen Eintrag davor. */
let gestartet = false;

/** Gesetzt von ersetzeRoute: Der nächste Eintrag ersetzt den aktuellen. */
let ersetztGerade = false;

/**
 * Tiefe eines Verlaufseintrags. Rein, damit testbar.
 * @param {*} state history.state des Eintrags
 * @param {number|null} bisher Tiefe des vorigen Eintrags, null beim Start
 * @param {boolean} ersetzt wurde der vorige Eintrag ersetzt statt ergänzt?
 * @returns {number}
 */
export function tiefeFuer(state, bisher, ersetzt) {
  // Zurück, vor oder neu geladen: der Eintrag kennt seine Tiefe.
  if (Number.isInteger(state?.tiefe)) return state.tiefe;
  if (bisher === null) return 0;
  return ersetzt ? bisher : bisher + 1;
}

/**
 * Gibt es innerhalb der App eine Seite davor? Dann führt history.back()
 * dorthin; sonst würde es die App verlassen.
 */
export function hatVorgaenger() {
  return tiefe > 0;
}

/**
 * Wechselt die Route, ohne einen Verlaufseintrag hinzuzufügen – etwa nach
 * dem Speichern oder beim Blättern, damit „Zurück“ nicht jeden Zwischenschritt
 * wiederholt.
 * @param {string} hash z. B. '#/teil/abc'
 */
export function ersetzeRoute(hash) {
  if (window.location.hash === hash) return;
  ersetztGerade = true;
  window.location.replace(`${window.location.pathname}${window.location.search}${hash}`);
}

/**
 * Zurück wie mit der Zurück-Geste. Gibt es in der App keine Seite davor
 * (Einstieg über Startbildschirm oder Link), geht es zur logischen
 * Elternseite – nie aus der App heraus.
 * @param {string} elternZiel z. B. '#/kategorie/schuhe'
 */
export function zurueck(elternZiel) {
  if (hatVorgaenger()) window.history.back();
  else ersetzeRoute(elternZiel);
}

/**
 * Macht aus einem Hash einen normalisierten Pfad.
 * '#/kategorie/schuhe/' -> '/kategorie/schuhe'
 * Ein Abfrageteil hinter dem Fragezeichen bleibt außen vor.
 * @param {string} hash
 * @returns {string}
 */
export function pfadAusHash(hash) {
  const roh = String(hash || '').replace(/^#/, '').split('?')[0];
  const ohneEndSchraegstrich = roh.replace(/\/+$/, '');
  if (ohneEndSchraegstrich === '') return '/';
  return ohneEndSchraegstrich.startsWith('/')
    ? ohneEndSchraegstrich
    : `/${ohneEndSchraegstrich}`;
}

/**
 * Die Werte hinter dem Fragezeichen, z. B. '#/neu?kategorie=schuhe'.
 * Damit lässt sich ein Screen vorbelegen, ohne eine eigene Route zu brauchen.
 * @param {string} hash
 * @returns {Object<string, string>}
 */
export function abfrageAusHash(hash) {
  const roh = String(hash || '').replace(/^#/, '');
  const fragezeichen = roh.indexOf('?');
  if (fragezeichen === -1) return {};
  return Object.fromEntries(new URLSearchParams(roh.slice(fragezeichen + 1)));
}

/**
 * Sucht die passende Route zu einem Pfad.
 * @param {string} pfad z. B. '/teil/abc/bearbeiten'
 * @returns {{ screen: string, muster: string, parameter: Object }|null}
 */
export function findeRoute(pfad) {
  const teile = pfad.split('/').filter(Boolean);

  for (const route of ROUTEN) {
    const musterTeile = route.muster.split('/').filter(Boolean);
    if (musterTeile.length !== teile.length) continue;

    const parameter = {};
    let passt = true;

    for (let i = 0; i < musterTeile.length; i += 1) {
      const musterTeil = musterTeile[i];
      if (musterTeil.startsWith(':')) {
        const wert = decodeURIComponent(teile[i]);
        if (wert === '') { passt = false; break; }
        parameter[musterTeil.slice(1)] = wert;
      } else if (musterTeil !== teile[i]) {
        passt = false;
        break;
      }
    }

    if (passt) return { screen: route.screen, muster: route.muster, parameter };
  }

  return null;
}

/**
 * Startet den Router: zeichnet die aktuelle Route und reagiert auf
 * Adressänderungen. Unbekannte Adressen führen zur Übersicht.
 * @param {{ beiWechsel: (route: { screen: string, parameter: Object }) => void }} optionen
 * @returns {() => void} Funktion zum Beenden
 */
export function starteRouter({ beiWechsel }) {
  function zeichne() {
    const pfad = pfadAusHash(window.location.hash);
    const route = findeRoute(pfad);

    if (!route) {
      // Unbekannte Route: ohne neuen History-Eintrag zur Übersicht.
      ersetzeRoute(STANDARD_HASH);
      return;
    }

    tiefe = tiefeFuer(window.history.state, gestartet ? tiefe : null, ersetztGerade);
    ersetztGerade = false;
    gestartet = true;
    if (window.history.state?.tiefe !== tiefe) {
      window.history.replaceState({ ...(window.history.state ?? {}), tiefe }, '');
    }

    // Werte aus der Adresse ergänzen die Werte aus dem Pfad.
    beiWechsel({
      ...route,
      parameter: { ...abfrageAusHash(window.location.hash), ...route.parameter },
    });
  }

  window.addEventListener('hashchange', zeichne);
  zeichne();

  return () => window.removeEventListener('hashchange', zeichne);
}
