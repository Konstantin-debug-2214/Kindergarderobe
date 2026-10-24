# Auftrag 11 – Icons Zahnrad und Schaukelpferd

Stand: 20.10.2026

Lies zuerst `CLAUDE.md`, besonders „Technik“ (Icons) und „Veröffentlichen“. Ändere `CLAUDE.md` nicht selbst; nötige Änderungen schlägst du in der Zusammenfassung vor.

Wunsch John, abweichend vom Design:

1. **Einstellungen:** Das Sonnen-Icon wird durch ein **Zahnrad** ersetzt – überall, wo es für Einstellungen steht: Icon-Knopf auf der Übersicht (Tablet) und Eintrag „Mehr“ in der unteren Leiste (Smartphone).
2. **Spielzeug:** Der Teddykopf wird durch ein **Schaukelpferd** ersetzt – überall, wo er für Spielzeug steht: Kategorie-Kachel, Karten, Listen-Icons im Detail und in Aussortiert, Umschalter Kleidung/Spielzeug im Formular, Vorschau, Statistik und alle übrigen Stellen.

Umsetzung:

- Beide Icons **selbst als Inline-SVG zeichnen**, im Stil der vorhandenen Strich-Icons (gleiche Strichstärke, runde Enden, `currentColor`). John hat zwei PNG-Vorlagen gezeigt; sie dienen nur als Motiv-Idee. **Keine fremden Bilddateien ins Repo übernehmen.**
- Zahnrad: Kranz mit 8 Zähnen und Kreis in der Mitte. Schaukelpferd: Pferd mit Mähne, Schweif und Sattel auf einer gebogenen Kufe. Beide müssen auch klein (24 px) klar erkennbar sein.
- Das **Sonnen-Icon für die Jahreszeit Sommer** bleibt unverändert. Das App-Icon in `icons/` bleibt unverändert.
- `VERSION` in `sw.js` hochzählen (siehe „Veröffentlichen“), damit das Update die installierte App erreicht.

## Fertig, wenn

- an keiner Stelle mehr Sonne für Einstellungen oder Teddy für Spielzeug erscheint (Suche im Code nach den alten Icon-Namen),
- beide Icons bei 24 px und in den Kacheln sauber aussehen, auf 390 × 844, 412 × 915 und 1194 × 834,
- `node --test` und die Regression grün sind,
- `git status` vor dem Commit keine Screenshots, JSON-, CSV- oder fremden PNG-Dateien enthält.

Danach committen, pushen und zusammenfassen, mit einem Screenshot-Hinweis, wo die neuen Icons zu sehen sind.
