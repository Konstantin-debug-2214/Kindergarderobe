/**
 * nachOben.js – runder Knopf, der zurück an den Anfang bringt.
 *
 * Er erscheint, sobald mehr als eine Bildschirmhöhe nach unten gescrollt
 * wurde, und verschwindet darüber wieder.
 *
 * Zwei Fälle:
 *  - die Seite selbst (Übersicht, Statistik, Aussortiert, Smartphone überall),
 *  - ein eigener Scrollbereich. Auf dem Tablet scrollt bei mehreren Screens
 *    nicht die Seite, sondern eine Spalte (z. B. die Teileliste im Detail);
 *    solche Bereiche tragen `data-nach-oben` und bekommen ihren eigenen Knopf.
 */

import { el } from './dom.js';
import { icon } from './icons.js';

/** Der Knopf für die Seite – einmal angelegt, bleibt über Screens hinweg. */
let seitenKnopf = null;

/** Bereiche mit eigenem Scrollbalken samt ihrem Knopf und Aufräumer. */
let bereiche = [];

function bewegungReduziert() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Sanft nach oben, bei „Bewegung reduzieren“ ohne Animation. */
function scrolleNachOben(ziel) {
  const verhalten = bewegungReduziert() ? 'auto' : 'smooth';
  if (ziel === window) window.scrollTo({ top: 0, behavior: verhalten });
  else ziel.scrollTo({ top: 0, behavior: verhalten });
}

/** Nach dem Scrollen liegt der Fokus auf der Überschrift des Screens. */
function fokussiereUeberschrift() {
  const ueberschrift = [...document.querySelectorAll('#screen h1')]
    .find((kopf) => kopf.offsetParent !== null);
  if (!ueberschrift) return;
  // h1 ist nicht von sich aus fokussierbar, bleibt aber aus der Tabfolge.
  ueberschrift.tabIndex = -1;
  ueberschrift.focus({ preventScroll: true });
}

function baueKnopf(klasse) {
  return el('button', {
    type: 'button',
    class: `nachoben ${klasse}`,
    'aria-label': 'Nach oben',
    title: 'Nach oben',
    hidden: true,
  }, [icon('pfeil-oben', 22)]);
}

/* --- Knopf für die Seite --------------------------------------------------- */

/** Einmal beim Start aufrufen. */
export function richteNachObenEin() {
  if (seitenKnopf) return;

  seitenKnopf = baueKnopf('nachoben--seite');
  seitenKnopf.addEventListener('click', () => {
    scrolleNachOben(window);
    fokussiereUeberschrift();
  });
  document.body.append(seitenKnopf);

  window.addEventListener('scroll', pruefeSeite, { passive: true });
  window.addEventListener('resize', () => {
    setzeAbstand();
    pruefeSeite();
  });
}

function pruefeSeite() {
  if (!seitenKnopf) return;
  // Erst ab mehr als einer Bildschirmhöhe.
  seitenKnopf.hidden = window.scrollY <= window.innerHeight;
}

/**
 * Hält den Knopf über der unteren Leiste bzw. der Aktionsleiste im Detail,
 * damit er nichts verdeckt.
 */
function setzeAbstand() {
  if (!seitenKnopf) return;

  const sichtbar = (knoten) => knoten && knoten.offsetParent !== null && !knoten.hidden;
  const leiste = document.getElementById('leiste');
  const aktionsleiste = document.querySelector('.detail__aktionsleiste');

  let unten = 0;
  if (sichtbar(leiste)) unten = leiste.offsetHeight;
  else if (sichtbar(aktionsleiste)) unten = aktionsleiste.offsetHeight;

  seitenKnopf.style.setProperty('--leisten-hoehe', `${unten}px`);
}

/* --- Knöpfe für eigene Scrollbereiche -------------------------------------- */

/**
 * Nach jedem Zeichnen aufrufen: sucht Bereiche mit `data-nach-oben` und
 * hängt ihnen einen eigenen Knopf an.
 * @param {HTMLElement} wurzel der neu gezeichnete Screen
 */
export function aktualisiereNachOben(wurzel) {
  // Alte Beobachter lösen – die Elemente von eben gibt es nicht mehr.
  for (const bereich of bereiche) bereich.abmelden();
  bereiche = [];

  setzeAbstand();
  pruefeSeite();

  for (const behaelter of wurzel.querySelectorAll('[data-nach-oben]')) {
    bereiche.push(richteBereichEin(behaelter));
  }
}

function richteBereichEin(behaelter) {
  const knopf = baueKnopf('nachoben--bereich');
  knopf.addEventListener('click', () => {
    scrolleNachOben(behaelter);
    fokussiereUeberschrift();
  });

  // Klebt am unteren Rand des Scrollbereichs, ohne Platz zu beanspruchen.
  const halter = el('div', { class: 'nachoben-halter' }, [knopf]);
  behaelter.append(halter);

  function pruefe() {
    knopf.hidden = behaelter.scrollTop <= behaelter.clientHeight;
  }

  behaelter.addEventListener('scroll', pruefe, { passive: true });
  pruefe();

  return { abmelden: () => behaelter.removeEventListener('scroll', pruefe) };
}
