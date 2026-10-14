# Auftrag 06 – Kosten-Ansicht + Sammelkäufe

Stand: 13.10.2026

Lies zuerst `CLAUDE.md` vollständig, besonders „Kosten“, Screen 6, „Zählregeln“ und „Farbregel für Teile“. Vorlage sind die Screenshots „Kosten“ (Tablet) und „Kosten – Smartphone“. Bei Widersprüchen gilt `CLAUDE.md`. Ändere `CLAUDE.md` nicht selbst; nötige Änderungen schlägst du in der Zusammenfassung vor.

Alle Berechnungen in `js/costs.js` (ohne DOM, Beträge in Cent), geprüft mit `node --test`.

## 1. Berechnungen (`js/costs.js`, Erweiterung)

- Für ein Jahr: Summe, Anzahl Teile (Summe `anzahlTeile` der Ausgaben des Jahres), Durchschnitt pro Teil (Summe ÷ Teile, kaufmännisch gerundet auf Cent).
- Je Sammelkauf: „ca. x € / Teil“ (Betrag ÷ `anzahlTeile`, gerundet).
- Liste der Jahre, in denen Ausgaben vorkommen.
- Ausgaben aussortierter oder gelöschter Teile bleiben in allen Summen.

## 2. Screen `#/kosten`

- **Tablet** wie im Design: Zurück-Knopf, „Kosten“.
  - Links oben die Summenkarte in Primärfarbe: „AUSGABEN [Jahr]“, Summe, darunter „n Teile · Ø x € pro Teil“. Mit **Jahr-Umschalter** ‹ › an der Karte, standardmäßig das aktuelle Jahr; ‹ › nur, wenn es Ausgaben in anderen Jahren gibt. *(Umschalter nicht im Design)*
  - Links darunter „Kosten hinzufügen“: Wofür?, **Datum** (Standard heute) *(nicht im Design)*, Gesamtbetrag, Anzahl Teile (− / +, Standard 1), Hinweistext wie im Design, „Speichern“. Prüfung: Wofür? und Betrag > 0 sind Pflicht.
  - Rechts „Einträge · neueste zuerst“ für das gewählte Jahr: Icon, Bezeichnung, darunter „12.09.2026 · Sammelkauf · 6 Teile“ bzw. „28.08.2026 · Einzelteil“, rechts Betrag und bei Sammelkäufen „ca. 4,17 € / Teil“.
  - Icons: Sammelkauf mit Tüten-Icon auf `#F7E2B5` wie im Design; Einzelteil mit dem Kategorie-Icon in der **Kategoriefarbe des verknüpften Teils**; Ausgabe ohne verknüpftes Teil mit neutralem Icon.
- **Smartphone** wie im Design: Summenkarte, darunter die Einträge; Knopf „+ Kosten“ oben rechts öffnet das Formular als Dialog bzw. Blatt von unten. Keine Navigationsleiste.
- Leerer Zustand für ein Jahr ohne Ausgaben. *(nicht im Design)*

## 3. Einträge bearbeiten und löschen *(nicht im Design)*

- Tipp auf einen **Einzelteil-Eintrag** mit verknüpftem Teil → Detail dieses Teils (Preis ändert man dort über „Bearbeiten“).
- Tipp auf einen **Sammelkauf** oder einen Eintrag ohne Teil → Dialog mit Wofür?, Datum, Gesamtbetrag, Anzahl Teile, darunter die Namen der zugeordneten Teile („3 von 6 Teilen zugeordnet“); Knöpfe „Löschen“, „Abbrechen“, „Speichern“.
- **Löschen** nur nach Rückfrage. Teile, die diesem Sammelkauf zugeordnet waren, verlieren ihren Preis („kein Preis“); die Rückfrage nennt ihre Anzahl.
- Jede Änderung zählt für die Backup-Erinnerung.

## 4. Übrige Stellen

- Die Jahressumme in den Einstellungen (Smartphone, Eintrag „Kosten“) nutzt dieselbe Berechnung.
- Neu angelegte Sammelkäufe erscheinen sofort in der Sammelkauf-Auswahl des Formulars.

## Fertig, wenn

- Summe, Teile und Durchschnitt mit den Beispielwerten des Designs übereinstimmen (25,00 € / 6 Teile, 15,00 €, 18,50 € / 4 Teile, 12,00 €, 8,00 € → 78,50 €, 13 Teile, Ø 6,04 €; ca. 4,17 € und ca. 4,63 € / Teil) – als Test,
- Jahr-Umschalter, Hinzufügen, Bearbeiten und Löschen funktionieren und Kosten aussortierter Teile erhalten bleiben,
- `node --test` grün ist und beide Gerätegrößen (1194 × 834, 390 × 844) ohne waagerechtes Scrollen, mit Touch-Zielen ≥ 48 px und ohne Konsolenfehler funktionieren,
- `git status` vor dem Commit keine Screenshots, JSON- oder CSV-Dateien enthält.

Danach committen, pushen und zusammenfassen, inklusive „Selbst gestaltet – bitte prüfen“ (mindestens: Jahr-Umschalter, Datumsfeld, Bearbeiten-Dialog, Löschen-Rückfrage, Formular auf dem Smartphone, leerer Zustand), einer Liste aller Entscheidungen, die du selbst treffen musstest, und Vorschlägen für `CLAUDE.md`.
