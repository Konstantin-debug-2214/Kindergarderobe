# Auftrag 09b – Nach-oben-Knopf

Stand: 16.10.2026

Lies zuerst `CLAUDE.md`, besonders den Punkt „Nach-oben-Knopf“ im Abschnitt „Design“. Ändere `CLAUDE.md` nicht selbst; nötige Änderungen schlägst du in der Zusammenfassung vor.

Anlass: Mit den echten Daten (über 300 Einträge) sind Listen lang, und der Weg zurück nach oben ist mühsam.

## Umsetzung

- Ein Baustein in `js/ui/` (z. B. `nachOben.js`), der auf **allen Screens** einen runden Knopf mit Pfeil-nach-oben-Icon (Strich-SVG) unten rechts zeigt, sobald mehr als eine Bildschirmhöhe nach unten gescrollt wurde. Darüber verschwindet er wieder.
- Tipp scrollt sanft nach oben; bei `prefers-reduced-motion` ohne Animation. Danach liegt der Fokus auf der Überschrift des Screens.
- Gestaltung im Stil der vorhandenen runden Icon-Knöpfe (weiß, Rahmen, mindestens 48 × 48 px), `aria-label="Nach oben"`.
- **Smartphone:** Der Knopf sitzt über der Navigationsleiste bzw. über der Aktionsleiste im Detail und verdeckt keine anderen Knöpfe (z. B. „+ Kosten“, Filter-Chips, Speichern).
- **Tablet-Detail:** Die scrollbare Teileliste links bekommt dasselbe Verhalten für ihren eigenen Scrollbereich (Knopf unten rechts in der Liste).
- Beim Wechsel des Screens startet jede Seite oben, der Knopf ist dann ausgeblendet.

## Fertig, wenn

- der Knopf auf langen Listen (Kategorie, Nach Jahreszeit, Trefferansicht, Aussortiert, Kosten, Statistik, Formular) erscheint und funktioniert, auf kurzen Seiten nie,
- er auf beiden Gerätegrößen (1194 × 834, 390 × 844) nichts verdeckt, Touch-Ziele ≥ 48 px, keine Konsolenfehler,
- `node --test` grün ist und die Regression der bisherigen Aufträge grün bleibt,
- `git status` vor dem Commit keine Screenshots, JSON- oder CSV-Dateien enthält.

Danach committen, pushen und zusammenfassen, inklusive „Selbst gestaltet – bitte prüfen“ und Vorschlägen für `CLAUDE.md`.
