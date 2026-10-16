# Auftrag 07 – Statistik + Diagramme

Stand: 13.10.2026

Lies zuerst `CLAUDE.md` vollständig, besonders Screen 7, „Zählregeln“ und „Suche, Filter, Sortierung“. Vorlage sind die Screenshots „Statistik“ (Tablet) und „Statistik – Smartphone“. Bei Widersprüchen gilt `CLAUDE.md`. Ändere `CLAUDE.md` nicht selbst; nötige Änderungen schlägst du in der Zusammenfassung vor.

Alle Zählungen als reine Funktionen in `js/filters.js` (ohne DOM), geprüft mit `node --test`. Diagramme selbst als SVG bzw. HTML/CSS, keine Bibliothek.

## 1. Zählungen (nach Stück, ohne Aussortiertes)

- Gesamtzahl im Schrank (Kleidung und Spielzeug).
- Nach Kategorie: alle sechs Kategorien, auch mit 0.
- **Art der Kleidung:** die häufigsten 7 Arten, nur Kleidung.
- **Spielzeug nach Art:** die häufigsten 7 Spielzeug-Arten. *(neu, nicht im Design)*
- Nach Jahreszeit: nur Kleidung, ein Teil zählt in jeder seiner Jahreszeiten.
- **Nach Größe:** nur Teile im Größensystem Konfektion; nur vorkommende Größen, aufsteigend. Doppelgrößen und Spannen zählen bei jeder enthaltenen Größe (Hinweis unter dem Diagramm, wie bei den Jahreszeiten).
- Gleichstand bei „die häufigsten 7“: alphabetisch.

## 2. Screen `#/statistik`

- **Tablet** wie im Design: Zurück-Knopf, „Statistik“, Untertitel „n Teile im Schrank · Aussortiertes zählt nicht mit · Tippe auf einen Wert, um die Teile zu sehen“; rechts Knopf „Soll-Mengen & Saisonwechsel“ → `#/saisonwechsel`.
- Karten mit waagerechten Balken wie im Design (Primärfarbe, Zahl rechts): „Nach Kategorie“, „Art der Kleidung · die häufigsten 7“, „Nach Jahreszeit“ (mit Jahreszeiten-Icons und Hinweis „Ein Teil kann zu mehreren Jahreszeiten gehören.“), „Spielzeug nach Art · die häufigsten 7“; „Nach Größe“ als senkrechte Balken mit Zahl darüber wie im Design. Die fünfte Karte fügst du im Stil der übrigen ins Raster ein; die Seite darf senkrecht scrollen.
- Balkenlänge relativ zum größten Wert der jeweiligen Karte.
- **Smartphone** wie im Design: kein Zurück-Knopf, Navigationsleiste mit „Statistik“ aktiv, oben die Verweis-Karte „Soll-Mengen & Saisonwechsel“, darunter die Karten einspaltig.
- Das Etikett „n fehlen“ an der Verweis-Karte kommt erst mit Auftrag 08; bis dahin ohne Zahl.
- Leere Karten (z. B. kein Spielzeug) zeigen einen kurzen Hinweis statt leerer Fläche. *(nicht im Design)*

## 3. Antippen führt zu den Teilen

Jede Zeile bzw. Säule ist als Ganzes antippbar (mindestens 48 px hoch bzw. breit):

- Kategorie → `#/kategorie/:id`.
- Jahreszeit → `#/jahreszeit/:id`.
- Art der Kleidung, Spielzeug-Art und Größe → **Trefferansicht der Übersicht** mit gesetztem Filter, z. B. `#/?art=Pullover` oder `#/?groesse=110`. Die Trefferansicht zeigt den Filter als Chip („Art: Pullover ×“, „Größe 110 ×“) über den Karten; „×“ entfernt ihn und zeigt wieder die Kacheln. Größe 110 trifft auch Doppelgrößen wie 104/110. *(Chip nicht im Design)*

## Fertig, wenn

- alle Zählungen nach Stück rechnen, Aussortiertes ausschließen und Spielzeug nur in Gesamtzahl, Kategorie und „Spielzeug nach Art“ erscheint (Tests),
- jeder Balken zu den richtigen Teilen führt,
- `node --test` grün ist und beide Gerätegrößen (1194 × 834, 390 × 844) ohne waagerechtes Scrollen, mit Touch-Zielen ≥ 48 px und ohne Konsolenfehler funktionieren,
- `git status` vor dem Commit keine Screenshots, JSON- oder CSV-Dateien enthält.

Danach committen, pushen und zusammenfassen, inklusive „Selbst gestaltet – bitte prüfen“ (mindestens: Karte „Spielzeug nach Art“, Anordnung der fünf Karten, Filter-Chip in der Trefferansicht, leere Karten), einer Liste aller Entscheidungen, die du selbst treffen musstest, und Vorschlägen für `CLAUDE.md`.
