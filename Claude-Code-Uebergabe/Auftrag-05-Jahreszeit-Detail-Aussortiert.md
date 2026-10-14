# Auftrag 05 – Nach Jahreszeit, Detail, Aussortiert

Stand: 13.10.2026

Lies zuerst `CLAUDE.md` vollständig, besonders Screens 3, 4 und 9, „Zählregeln“, „Suche, Filter, Sortierung“, „Farbregel für Teile“ und „Bekannte Fehler im Design“. Vorlage sind die Screenshots „Nach Jahreszeit“, „Detail“, „Aussortiert“ (Tablet) und die zugehörigen Smartphone-Ansichten. Bei Widersprüchen gilt `CLAUDE.md`. Ändere `CLAUDE.md` nicht selbst; nötige Änderungen schlägst du in der Zusammenfassung vor.

Reine Logik (Listen, Zählen, Reihenfolge, Preistexte) in Module ohne DOM, geprüft mit `node --test`.

## 1. Nach Jahreszeit (`#/jahreszeit/:id`)

- Kopf wie im Design: Zurück-Knopf, „Nach Jahreszeit“, darunter „n Teile für [Jahreszeit]“ (Stück, nur Kleidung, ohne Aussortiertes).
- Vier Jahreszeiten-Knöpfe wie im Design (Tablet mit Icon, Name und Monaten; Smartphone kompakt mit Icon und Name). Gewählter Knopf in der **Akzentfarbe** der Jahreszeit mit weißer Schrift, die anderen weiß mit Text in der Akzentfarbe. Wechsel aktualisiert die Route.
- Kategorie-Filter: „Alle“ plus die **fünf Kleidungs-Kategorien, ohne Spielzeug** (Design-Fehler). Einfachauswahl. Auf dem Smartphone darf die Reihe innerhalb ihrer Zeile waagerecht scrollen (wie im Design), die Seite selbst nicht.
- Karten **in der Kategoriefarbe** (Design-Fehler: Jahreszeitenfarbe) mit Kategorie-Icon, Name, Kategoriename und Größe als Chip; Anzahl-Etikett wie in Auftrag 04; alphabetisch; Tipp → Detail. Tablet vierspaltig, Smartphone zweispaltig.
- Leerer Zustand, wenn keine Teile passen. Unbekannte Jahreszeit → Übersicht.

## 2. Detail (`#/teil/:id`)

- **Tablet** wie im Design: Zurück-Knopf, Kategoriename als Titel, rechts „Aussortieren“ und „Bearbeiten“.
  - Links Liste „n TEILE“ aller nicht aussortierten Teile der Kategorie, alphabetisch: Icon in Kategoriefarbe, Name, darunter Größe (Spielzeug: Alter ab) und Preis („8,00 €“, „Sammelkauf“ oder „kein Preis“), Etikett „Bald zu klein“. Gewähltes Teil hervorgehoben. Tipp wechselt das Teil.
  - Rechts: Icon-Fläche in Kategoriefarbe, Name, darunter die **Notiz als Untertitel** (ohne Notiz kein Untertitel). Kacheln **Größe, Farbe, Merkmal, Preis** (Merkmal: „Blanko“, „Aufdruck“ oder der Markenname; Design-Fehler: fehlt auf dem Tablet). Preis bei Sammelkauf mit Hinweis „[Bezeichnung] · 25 € für 6 Teile“. Bei `anzahl > 1` zusätzlich eine Kachel „Anzahl“. *(nicht im Design)*
  - Jahreszeiten als Chips in den Jahreszeiten-Farben mit Icon; Passform als Umschalter zum Antippen; Notizfeld.
- **Smartphone** wie im Design: Zurück-Knopf, „[Kategorie] · 2 von 7“, Blättern mit ‹ › durch dieselbe Liste; Kacheln zweispaltig; unten feste Aktionsleiste „Aussortieren“ / „Bearbeiten“; keine Navigationsleiste.
- **Spielzeug:** Kachel „Alter ab“ statt Größe, Kachel „Art“, freie Merkmale als Chips; keine Jahreszeiten, keine Passform.
- **Passform antippen** speichert sofort. **Notiz** wird beim Verlassen des Feldes gespeichert und aktualisiert den Untertitel. Beides zählt als Änderung.
- **Bearbeiten** → `#/teil/:id/bearbeiten`.
- **Aussortieren:** Dialog „Warum wird das Teil aussortiert?“ mit den vier Gründen (zu klein, verschenkt, verkauft, kaputt) und „Abbrechen“; Tipp auf einen Grund sortiert aus. Danach zurück zur Kategorie-Ansicht mit kurzer Bestätigung „[Name] aussortiert“. *(Dialog nicht im Design)*
- Unbekannte ID → verständliche Meldung mit Weg zur Übersicht. Aussortiertes Teil → Hinweis „Dieses Teil ist aussortiert“ mit Link zu `#/aussortiert`.

## 3. Aussortiert (`#/aussortiert`)

- Kopf wie im Design: Titel, darunter „n Teile · zählen nicht in Übersicht und Statistik“ (Smartphone: „n Teile · zählen nicht mit“); rechts „Aussortiert leeren“ (Smartphone „Leeren“) mit rotem Rahmen. Die Rot-Werte leitest du aus dem Screenshot ab und nimmst sie in `tokens.css` auf.
- Liste, neueste Aussortierung zuerst: Icon in **Kategoriefarbe** (Design-Fehler: unterschiedliche Farben), Name, darunter „[Kategorie] · Gr. 92 · aussortiert am 05.10.2026 · zu klein“ (Spielzeug „ab 1“; Smartphone kurz „05.10. · zu klein“); rechts „Zurückholen“ (Smartphone „Zurück“).
- **Zurückholen** stellt das Teil mit seinen bisherigen Werten wieder her und zählt als Änderung.
- **Leeren:** Bestätigungsdialog „Aussortiert endgültig leeren?“ mit dem Hinweis, dass die Teile nur über ein älteres Backup wiederherstellbar sind und Kosten erhalten bleiben; Knöpfe „Abbrechen“ / „Endgültig löschen“. Der Knopf ist ausgeblendet oder gesperrt, wenn nichts aussortiert ist.
- Leerer Zustand mit Hinweis, dass hier aussortierte Teile landen und zurückgeholt werden können. *(nicht im Design)*
- Smartphone mit Navigationsleiste, „Aussortiert“ aktiv.

## Fertig, wenn

- Zahlen und Listen Aussortiertes korrekt ausschließen bzw. nur Aussortiertes zeigen (Tests),
- Jahreszeiten-Ansicht kein Spielzeug zeigt und alle Karten die Kategoriefarbe tragen,
- Detail Merkmal und Notiz-Untertitel zeigt, Passform und Notiz direkt speichern, Blättern auf dem Smartphone funktioniert,
- Aussortieren mit Grund, Zurückholen und Leeren funktionieren und die Kostensumme dabei unverändert bleibt,
- `node --test` grün ist und beide Gerätegrößen (1194 × 834, 390 × 844) ohne waagerechtes Seiten-Scrollen, mit Touch-Zielen ≥ 48 px und ohne Konsolenfehler funktionieren,
- `git status` vor dem Commit keine Screenshots, JSON- oder CSV-Dateien enthält.

Danach committen, pushen und zusammenfassen, inklusive „Selbst gestaltet – bitte prüfen“ (mindestens: Aussortieren-Dialog, Leeren-Dialog, leere Zustände, Kachel „Anzahl“, Detail für Spielzeug, Rot-Werte), einer Liste aller Entscheidungen, die du selbst treffen musstest, und Vorschlägen für `CLAUDE.md`.
