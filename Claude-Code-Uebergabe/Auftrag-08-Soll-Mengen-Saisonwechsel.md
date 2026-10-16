# Auftrag 08 – Soll-Mengen + Saisonwechsel-Check

Stand: 13.10.2026

Lies zuerst `CLAUDE.md` vollständig, besonders Screen 8, „Weitere gespeicherte Daten“ (`sollMengen`), „Zählregeln“ und „Bekannte Fehler im Design“. Vorlage sind die Screenshots „Soll-Mengen & Saisonwechsel“ (Tablet) und „Soll-Mengen – Smartphone“. Bei Widersprüchen gilt `CLAUDE.md`. Ändere `CLAUDE.md` nicht selbst; nötige Änderungen schlägst du in der Zusammenfassung vor.

Nur Kleidung. Vorab: Ergänze in `model.js` die Art „Thermohose“ in der Kategorie Sets & Sonstiges (vor „Sonstiges“), wie in `CLAUDE.md`. Alle Berechnungen als reine Funktionen (z. B. `js/saison.js`, ohne DOM), geprüft mit `node --test`.

## 1. Berechnungen (je Jahreszeit, nach Stück, ohne Aussortiertes)

- **Passend je Art:** Teile der Art mit dieser Jahreszeit und Passform „Passt gut“.
- **Fehlt je Art:** `max(0, Soll − Passend)`. Stand: „kein Soll“ (kein Eintrag), „noch n fehlen“ / „noch 1 fehlt“, „vollständig“.
- **Check-Summen** über alle Arten **mit Soll**: „ist da“ = Passt gut + Bald zu klein, „passt“ = Passt gut, „fehlt“ = Summe der Fehlenden. „Zu klein“ zählt nirgends. (Abgeleitet aus dem Design: 9 ist da / 7 passt / 6 fehlt.)
- **Besorgen:** alle Arten mit Fehlenden, Art + „noch n“.
- **Wird bald zu klein:** alle Kleidungsteile der Jahreszeit mit „Bald zu klein“ (unabhängig vom Soll), mit Größe.
- **Saisonbeginn:** 1. März / 1. Juni / 1. September / 1. Dezember; „ab 1. Dezember · in 7 Wochen“ (bzw. „in n Tagen“ unter 2 Wochen). Für die laufende Jahreszeit: „läuft · noch n Wochen“.
- **Kommende Jahreszeit:** die nächste nach der aktuellen.

## 2. Screen `#/saisonwechsel`

- Beim Öffnen ist die **kommende Jahreszeit** gewählt (wie im Design: Winter im Oktober). Vier Jahreszeiten-Knöpfe; gewählter Knopf in der **Akzentfarbe der Jahreszeit** (Design-Fehler: Primärfarbe).
- **Tablet** wie im Design: links „Soll-Mengen [Jahreszeit]“ mit „optional · nur passende Teile zählen“ und Tabelle Art · Passend · Soll (− / +) · Stand; rechts „Saisonwechsel-Check“ mit Saisonbeginn, den drei Summen-Kacheln, „Besorgen“ und „Wird bald zu klein“ (Größe als dunkles Etikett).
- **Smartphone** wie im Design: Zurück-Knopf, „Saisonwechsel“ mit Untertitel „Soll-Mengen & Check“, keine Navigationsleiste; zuerst der Check, darunter „Soll-Mengen optional“ als Karten je Art (Name, Stand, „n passend“, Soll − / +).
- **Zeilen der Tabelle:** alle Arten, die in dieser Jahreszeit ein Soll haben **oder** passende bzw. bald zu kleine Teile; sortiert nach der Reihenfolge der Kategorien und Arten in `model.js`.
- **Soll ändern:** − / + speichert sofort (zählt als Änderung). Soll auf 0 entfernt den Eintrag („kein Soll“).
- **Art hinzufügen:** Knopf „+ Art“ unter der Tabelle öffnet eine Auswahl aller Kleidungs-Arten (nach Kategorie gruppiert, plus eigene Arten aus dem Bestand), die noch keine Zeile haben; die gewählte Art erscheint mit Soll 1. *(nicht im Design)*
- **Besorgen abhaken:** Häkchen streicht die Zeile durch. Der Haken liegt im Oberflächen-Zustand (wie der Banner, nicht im Backup, keine Datenänderung) und verschwindet von selbst, sobald für diese Art nichts mehr fehlt.
- Leere Zustände: keine Zeilen („Noch keine Soll-Mengen für [Jahreszeit]. Lege mit „+ Art“ fest, wie viele Teile du brauchst.“), nichts zu besorgen („Alles da.“), nichts bald zu klein. *(nicht im Design)*

## 3. Statistik

- Die Verweis-Karte auf dem Smartphone bekommt das Etikett „n fehlen“ (bzw. „1 fehlt“): Summe der Fehlenden der **kommenden Jahreszeit**. Bei 0 kein Etikett.

## Fertig, wenn

- die Design-Beispielwerte als Test nachgerechnet sind (Winterjacke 1/1 vollständig, Pullover 3/5 noch 2, Thermohose 1/2, Mütze 2/1 vollständig, Handschuhe 0/2, Winterstiefel 0/1 → passt 7, fehlt 6; mit 2 bald zu kleinen Teilen ist da 9),
- „Bald zu klein“ und „Zu klein“ nicht als passend zählen und Spielzeug nirgends erscheint,
- Soll ändern, Art hinzufügen, Abhaken und das Statistik-Etikett funktionieren,
- `node --test` grün ist und beide Gerätegrößen (1194 × 834, 390 × 844) ohne waagerechtes Scrollen, mit Touch-Zielen ≥ 48 px und ohne Konsolenfehler funktionieren,
- `git status` vor dem Commit keine Screenshots, JSON- oder CSV-Dateien enthält.

Danach committen, pushen und zusammenfassen, inklusive „Selbst gestaltet – bitte prüfen“ (mindestens: „+ Art“-Auswahl, Abhaken, leere Zustände, Text für die laufende Jahreszeit), einer Liste aller Entscheidungen, die du selbst treffen musstest, und Vorschlägen für `CLAUDE.md`.
