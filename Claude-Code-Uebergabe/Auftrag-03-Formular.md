# Auftrag 03 – Teil hinzufügen / bearbeiten

Stand: 13.10.2026

Lies zuerst `CLAUDE.md` vollständig, besonders Screen 5, „Datenmodell“, „Kosten“, „Farbregel für Teile“ und „Bekannte Fehler im Design“. Vorlage sind die Screenshots „Teil hinzufügen“ (Tablet) und „Teil hinzufügen – Smartphone“. Bei Widersprüchen gilt `CLAUDE.md`.

Ziel: Teile (Kleidung und Spielzeug) können angelegt und bearbeitet werden. Speichern nur über die Funktionen aus `js/storage.js`, Prüfung über `pruefeTeil` aus `js/model.js`.

## 1. Screen `#/neu` und `#/teil/:id/bearbeiten` (ein gemeinsames Modul)

- Kopf wie im Design: Schließen-Knopf „×“, Titel „Neues Teil“ bzw. „Teil bearbeiten“, Umschalter Kleidung / Spielzeug, „Abbrechen“ und „Speichern“ (Tablet); auf dem Smartphone „×“, Titel und „Speichern“, Umschalter darunter.
- Layout Tablet wie im Design: links Vorschau, Name, Preis, Notiz; rechts scrollbar die übrigen Felder. Smartphone: eine Spalte, Vorschau als kompakte Zeile oben.
- **Live-Vorschau** der Karte in der **Farbe der Kategorie** (nicht in der gewählten Teil-Farbe, siehe „Bekannte Fehler im Design“), mit Name, Kategorie, Größe, Jahreszeiten und Marke bzw. Merkmal. Spielzeug: weiße Karte mit Rahmen, Alter ab statt Größe.

## 2. Felder Kleidung (Reihenfolge laut `CLAUDE.md`)

- **Name** (Pflicht).
- **Kategorie:** nur die fünf Kleidungs-Kategorien.
- **Art** direkt nach der Kategorie: Auswahl aus der Artenliste der gewählten Kategorie plus „Andere …“ für eine eigene Art. Beim Wechsel der Kategorie wird eine nicht mehr passende Art zurückgesetzt. *(nicht im Design)*
- **Größe** passend zum Größensystem der Kategorie bzw. Art (Socken in Schuhgröße, Handschuhe/Fäustlinge in Handschuhgröße): Schnellauswahl gängiger Größen wie im Design plus „Andere …“ für den vollen Wertebereich und Doppelgrößen bzw. Spannen (von–bis). Welche Werte du als „gängig“ wählst, nennst du in der Zusammenfassung.
- **Jahreszeiten** (mehrere möglich, mindestens eine) wie im Design. **Kein** Schnellknopf „Ganzjährig“.
- **Passform:** Passt gut / Bald zu klein / Zu klein, Standard „Passt gut“.
- **Farbe:** Farbtupfer wie im Design (gelb, rot, blau, grün, grau, weiß, bunt), optional. Färbt **nicht** die Vorschau.
- **Merkmal:** Blanko / Aufdruck / Marke, optional. Bei „Marke“ die Markenliste als Auswahl, „+ Neue Marke“ und „Bearbeiten“ (Marken löschen; gelöschte Marken bleiben an bestehenden Teilen erhalten).
- **Anzahl:** Zähler − / +, Standard 1, Minimum 1, wie „Anzahl Teile“ in der Kosten-Ansicht gestaltet. *(nicht im Design)*
- **Preis** (optional): Umschalter „Einzelpreis“ / „Sammelkauf“ wie im Design.
  - Einzelpreis: Betrag in Euro mit Komma, intern in Cent; die verknüpfte Ausgabe legt `storage.js` an bzw. aktualisiert sie.
  - Sammelkauf: vorhandenen Sammelkauf auswählen (Bezeichnung, Datum, Betrag, Anzahl Teile) oder neuen anlegen (Wofür?, Datum, Gesamtbetrag, Anzahl Teile). *(Auswahl/Neu nicht im Design)*
  - Preis entfernen muss möglich sein.
- **Notiz** (optional).

## 3. Felder Spielzeug

Name, Art (Spielzeug-Arten plus „Andere …“), Alter ab (0, 1, 2, 3, 4, 6, 8 oder eigene), Farbe (optional), Merkmal (wie oben), freie Merkmale (Tags hinzufügen und entfernen), Anzahl, Preis, Notiz. Keine Kategorie-Auswahl (immer `spielzeug`), keine Größe, keine Jahreszeiten, keine Passform.

## 4. Verhalten

- **Speichern:** `pruefeTeil` ausführen; Fehler direkt am jeweiligen Feld anzeigen und zum ersten Fehler scrollen. Bei Erfolg speichern und zum Detail des Teils (`#/teil/:id`) wechseln.
- **Bearbeiten:** Formular mit den gespeicherten Werten füllen. Der Umschalter Kleidung / Spielzeug ist beim Bearbeiten gesperrt.
- **Abbrechen / ×:** ohne Änderungen sofort zurück; mit ungespeicherten Änderungen Rückfrage „Änderungen verwerfen?“.
- Unbekannte ID bei `#/teil/:id/bearbeiten` → verständliche Meldung und Weg zurück zur Übersicht.
- Der Detail-Screen bleibt ein Platzhalter (Auftrag 05), soll aber Name, Kategorie, Art und Anzahl des gespeicherten Teils anzeigen, damit das Speichern prüfbar ist.

## 5. Tests

Neue reine Logik (z. B. Umrechnung „12,50“ → 1250, Größen-Schnellauswahl je Größensystem, Zurücksetzen der Art beim Kategoriewechsel) in Module ohne DOM und mit `node --test` in `tests/` prüfen.

## Fertig, wenn

- Kleidung und Spielzeug angelegt und bearbeitet werden können, inklusive Einzelpreis, neuem und vorhandenem Sammelkauf, Marke anlegen/löschen, eigener Art und eigener Größe,
- Pflichtfeld-Fehler verständlich am Feld erscheinen,
- jede Speicherung den Backup-Banner auf der Übersicht auslöst,
- die Vorschau immer in der Kategorie-Farbe erscheint,
- `node --test` grün ist und beide Gerätegrößen (1194 × 834, 390 × 844) ohne waagerechtes Scrollen, mit Touch-Zielen ≥ 48 px und ohne Konsolenfehler funktionieren,
- `git status` vor dem Commit keine Screenshots, JSON- oder CSV-Dateien enthält.

Danach committen, pushen und zusammenfassen, inklusive „Selbst gestaltet – bitte prüfen“ (mindestens: Art, Anzahl, Sammelkauf-Auswahl/-Neu, „Andere …“-Größe, Rückfrage-Dialog) und einer Liste aller Entscheidungen, die du selbst treffen musstest.
