# Auftrag 04 – Übersicht + Kategorie-Ansicht mit Filtern und Suche

Stand: 13.10.2026

Lies zuerst `CLAUDE.md` vollständig, besonders Screens 1 und 2, „Zählregeln“, „Farbregel für Teile“ und „Bekannte Fehler im Design“. Vorlage sind die Screenshots „Übersicht“, „Kategorie mit Filtern“ (Tablet) und „Übersicht / Kategorie – Smartphone“. Bei Widersprüchen gilt `CLAUDE.md`.

Zählen und Filtern gehören als reine Funktionen in `js/filters.js` (ohne DOM) und werden mit `node --test` geprüft.

## 1. Übersicht (`#/`)

- Kopf, Begrüßung und Backup-Banner bleiben wie in Auftrag 02.
- **Kategorien:** sechs Kacheln in Kategoriefarbe mit Icon, Name und Stückzahl (Summe `anzahl`, ohne Aussortiertes); Einheit „Teile“, bei Schuhen „Paar“. Rechts neben der Überschrift „n Teile insgesamt“. Tipp → `#/kategorie/:id`.
- **Nach Jahreszeit:** vier Kacheln mit Icon, Name, Monaten und Stückzahl (nur Kleidung, ohne Aussortiertes; ein Teil kann in mehreren Jahreszeiten zählen). Die aktuelle Jahreszeit wie im Design mit Fläche, Rahmen in Akzentfarbe und Marke „Jetzt“. Tipp → `#/jahreszeit/:id`.
- **Suche:** Beim Tippen ersetzen die Treffer die Kacheln: Karten aller passenden Teile (Kleidung und Spielzeug, ohne Aussortiertes) in Kategoriefarbe; gesucht wird in Name, Art, Marke, Notiz und freien Merkmalen, ohne Groß-/Kleinschreibung. Leeres Feld → Kacheln wieder sichtbar. Ohne Treffer ein leerer Zustand. Tipp auf Karte → `#/teil/:id`. *(Ergebnisdarstellung nicht im Design)*
- Smartphone wie im Design: Kacheln zweispaltig, Suche über volle Breite, „€“-Knopf oben rechts.
- Die Testlinks aus Auftrag 01 entfallen.

## 2. Kategorie-Ansicht (`#/kategorie/:id`)

- Kopf wie im Design: Zurück-Knopf, Kategoriename, darunter „x von y Teilen“ (Stück nach Filter / Stück gesamt), rechts Suche „In [Kategorie] suchen“.
- **Karten** wie im Design, aber **immer in der Kategoriefarbe** (Design-Fehler: unterschiedliche Farben je Teil): Kategorie-Icon, Marke bzw. Merkmal als Etikett oben rechts, Name, Größe als Chip (Spielzeug: „ab n J.“), Jahreszeiten als Text (Spielzeug: Art). Bei `anzahl > 1` die Anzahl sichtbar machen. Tablet dreispaltig, Smartphone zweispaltig. Tipp → `#/teil/:id`.
- Sortierung: alphabetisch nach Name.
- **Filterspalte** (Tablet links, scrollbar) mit „Zurücksetzen“:
  - Kleidungs-Kategorien: Jahreszeit, Größe (nur die in dieser Kategorie vorkommenden Größen), Merkmal (Blanko / Aufdruck / Marke; bei Marke Auswahl der vorkommenden Marken), Passform, Art (nur vorkommende Arten).
  - Spielzeug: Art, Alter ab, Merkmal. Kein Jahreszeit-, Größen- oder Passform-Filter.
  - Logik: innerhalb einer Gruppe ODER, zwischen Gruppen UND. Ohne Auswahl in einer Gruppe filtert sie nicht. Standard: keine Filter gesetzt, alle Teile sichtbar.
  - Doppelgrößen und Spannen (z. B. 98/104) passen auf jede enthaltene Größe.
- **Smartphone** wie im Design: Knopf „Filter (n)“ öffnet die Filter (als Blatt von unten oder Vollbild-Ebene, deine Wahl), gesetzte Filter erscheinen als Chips mit „×“ zum Entfernen.
- Filter und Suchbegriff bleiben erhalten, wenn man ins Detail geht und zurückkommt; beim Zurück zur Übersicht werden sie zurückgesetzt.
- Leerer Zustand: Kategorie ohne Teile („Noch keine Teile. Teil hinzufügen“ mit Link zu `#/neu`) bzw. keine Treffer („Keine Teile passen zu den Filtern“ mit „Filter zurücksetzen“). *(nicht im Design)*
- Unbekannte Kategorie-ID → Übersicht.
- „Teil hinzufügen“ aus einer Kategorie heraus darf die Kategorie im Formular vorbelegen.

## Fertig, wenn

- Zahlen in Kacheln, „insgesamt“ und „x von y“ mit `anzahl` rechnen und Aussortiertes ausschließen (Tests),
- alle Filter einzeln und kombiniert korrekt wirken (Tests), Spielzeug nur seine drei Filter zeigt,
- alle Karten und Kacheln die Kategoriefarbe tragen,
- die Suche auf Übersicht und in der Kategorie funktioniert,
- `node --test` grün ist und beide Gerätegrößen (1194 × 834, 390 × 844) ohne waagerechtes Scrollen, mit Touch-Zielen ≥ 48 px und ohne Konsolenfehler funktionieren,
- `git status` vor dem Commit keine Screenshots, JSON- oder CSV-Dateien enthält.

Danach committen, pushen und zusammenfassen, inklusive „Selbst gestaltet – bitte prüfen“ (mindestens: Suchergebnisse auf der Übersicht, Filter auf dem Smartphone, leere Zustände, Anzeige der Anzahl auf Karten) und einer Liste aller Entscheidungen, die du selbst treffen musstest.
