/**
 * dom.js – kleine Helfer zum Bauen von DOM-Elementen.
 * Bewusst minimal: kein Template-String-HTML, damit nichts versehentlich
 * als Markup interpretiert wird.
 */

/**
 * Erzeugt ein Element.
 * @param {string} tag
 * @param {Object} [attribute] z. B. { class: 'knopf', 'aria-label': 'Zurück' }
 * @param {Array<Node|string>|Node|string} [kinder]
 * @returns {HTMLElement}
 */
export function el(tag, attribute = {}, kinder = []) {
  const knoten = document.createElement(tag);

  for (const [name, wert] of Object.entries(attribute)) {
    if (wert === null || wert === undefined || wert === false) continue;
    if (name === 'text') {
      knoten.textContent = String(wert);
    } else if (wert === true) {
      knoten.setAttribute(name, '');
    } else {
      knoten.setAttribute(name, String(wert));
    }
  }

  for (const kind of [].concat(kinder)) {
    if (kind === null || kind === undefined || kind === false) continue;
    knoten.append(typeof kind === 'string' ? document.createTextNode(kind) : kind);
  }

  return knoten;
}

/** Leert ein Element. */
export function leeren(knoten) {
  knoten.replaceChildren();
  return knoten;
}
