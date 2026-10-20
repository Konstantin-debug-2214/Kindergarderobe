# Auftrag 10 – Installierbare Web-App (Manifest, Service Worker, Icons)

Stand: 20.10.2026

Lies zuerst `CLAUDE.md` vollständig. **Neu:** Hauptgerät ist jetzt ein Android-Smartphone (Chrome), das Tablet bleibt unterstützt. Ändere `CLAUDE.md` nicht selbst; nötige Änderungen schlägst du in der Zusammenfassung vor.

Ziel: Die App lässt sich über GitHub Pages in Chrome auf Android als App installieren, startet ohne Browserleiste und läuft vollständig offline. Die App-Icons liegen bereits in `icons/` (`icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`).

## 1. Manifest (`manifest.webmanifest`)

- `name` und `short_name` „Kindergarderobe“, `lang: "de"`, `start_url: "./"`, `scope: "./"`, `display: "standalone"`, `orientation: "any"` (Smartphone hoch, Tablet quer).
- `background_color` und `theme_color` aus den Tokens (Hintergrund `#F1F5F3`).
- Icons 192 und 512 jeweils mit `purpose: "any"` und `"maskable"`.
- In `index.html`: Link auf das Manifest, `apple-touch-icon`, `theme-color`, Favicon (beseitigt die 404-Meldung für `favicon.ico`).

## 2. Service Worker (`sw.js` im Hauptverzeichnis)

- Beim Installieren alle App-Dateien zwischenspeichern (HTML, CSS, JS-Module, Schriften, Icons, Manifest); danach „Cache zuerst“, damit die App ohne Netz startet.
- Cache-Name mit Versionsnummer; alte Caches beim Aktivieren löschen.
- **Dateiliste ohne Build:** Die Liste der zwischengespeicherten Dateien steht in `sw.js`. Ein Test in `tests/` prüft, dass jede Datei aus `css/`, `js/`, `fonts/` und `icons/` in der Liste steht und jeder Eintrag existiert – so fällt eine vergessene Datei sofort auf.
- **Neue Version:** Liegt eine neue Version bereit, erscheint ein Hinweis-Banner „Neue Version verfügbar“ mit Knopf „Neu laden“. Kein automatisches Neuladen, damit keine Eingaben verloren gehen.
- Alle Pfade relativ, damit es unter `https://konstantin-debug-2214.github.io/Kindergarderobe/` und lokal mit Live Server funktioniert.
- Registrierung in `js/app.js`; ohne Service-Worker-Unterstützung läuft die App wie bisher.

## 3. Smartphone-Priorität

- Alle Screens zusätzlich bei 412 × 915 (gängige Android-Größe) prüfen: kein waagerechtes Scrollen, Touch-Ziele ≥ 48 px, nichts verdeckt.
- Im installierten Vollbild (ohne Browserleiste) dürfen Navigationsleiste, Aktionsleiste und Nach-oben-Knopf nicht unter der Android-Gestenleiste liegen (`env(safe-area-inset-bottom)` bzw. passende Abstände).
- Backup-Export über das Teilen-Menü und Import über die Dateiauswahl müssen im installierten Zustand funktionieren.

## 4. README

Kurze Anleitung ergänzen: GitHub Pages einschalten (Settings → Pages → `main` / root), App auf Android installieren (Seite in Chrome öffnen → Menü → „App installieren“), Backup-Datei aufs Handy übertragen und einspielen, Updates (Hinweis „Neue Version verfügbar“).

## Fertig, wenn

- Chrome in den Entwicklertools (Anwendung → Manifest) keine Fehler meldet und die App als installierbar erkennt,
- die App nach einmaligem Laden im Offline-Modus der Entwicklertools vollständig funktioniert (alle 12 Routen, Schriften, Icons),
- eine geänderte Version den Hinweis „Neue Version verfügbar“ auslöst,
- `node --test` grün ist (inkl. Test der Dateiliste) und die Regression aller bisherigen Aufträge auf 390 × 844, 412 × 915 und 1194 × 834 grün bleibt,
- `git status` vor dem Commit keine Screenshots, JSON- oder CSV-Dateien enthält (`manifest.webmanifest` ist keine `.json`-Datei).

Danach committen, pushen und zusammenfassen, inklusive „Selbst gestaltet – bitte prüfen“ (mindestens: Update-Hinweis), einer Liste aller Entscheidungen, die du selbst treffen musstest, Vorschlägen für `CLAUDE.md` und einer kurzen Checkliste, was John auf dem echten Android-Gerät testen soll.
