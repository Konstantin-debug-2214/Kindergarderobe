# Auftrag 02 – Datenmodell, Speicher, Backup + Erinnerung

Stand: 13.10.2026

Lies zuerst `CLAUDE.md` vollständig, besonders „Datenmodell“, „Backup-Erinnerung“, „Zählregeln“ und Screen 10. Bei Widersprüchen zwischen Screenshots und `CLAUDE.md` gilt `CLAUDE.md`.

Ziel: Die App kann Daten dauerhaft speichern, sichern und wiederherstellen. Formulare, Kacheln mit Zahlen, Filter und Kosten-Ansicht kommen erst in späteren Aufträgen.

## 1. `js/model.js` (ohne DOM)

- Alle Konstanten aus `CLAUDE.md` an einer Stelle: Typen, Kategorien mit Arten und Größensystem, Spielzeug-Arten, Größensysteme mit Wertebereichen, Jahreszeiten mit Monaten und Farben-Token-Namen, Passform, Merkmal, Farben, Aussortier-Gründe (genau vier: `zu_klein`, `verschenkt`, `verkauft`, `kaputt`), Alter-ab-Vorgaben.
- Hilfsfunktion „aktuelle Jahreszeit aus Datum“.
- Fabrikfunktionen für ein neues Teil (Kleidung bzw. Spielzeug) mit Standardwerten (`anzahl: 1`, `aussortiert: false`, Zeitstempel).
- Validierung `pruefeTeil(teil)` → Liste von Fehlern in deutscher Sprache. Regeln laut Datenmodell, u. a.: Spielzeug hat keine Größe, keine Jahreszeiten, keine Passform; Kleidung braucht Größe passend zum Größensystem der Kategorie und mindestens eine Jahreszeit; `marke` nur bei `merkmal = marke`; `anzahl` ganze Zahl ≥ 1.

## 2. `js/storage.js` (einziger Zugriff auf `localStorage`)

- Ein Speicherschlüssel für den gesamten Zustand `{ version: 1, teile, ausgaben, marken, sollMengen, einstellungen }`. Beim ersten Start leerer Zustand mit Standardwerten.
- Lesefunktionen und Änderungsfunktionen für: Teile (anlegen, ändern, aussortieren mit Grund, zurückholen, „Aussortiert leeren“), Ausgaben (anlegen, ändern, löschen), Marken (anlegen, löschen), Soll-Mengen (setzen, löschen), Einstellungen (Name).
- Einzelpreis: Speichern eines Teils mit `preis.art = "einzeln"` legt bzw. aktualisiert automatisch die verknüpfte Ausgabe mit `anzahlTeile: 1` (siehe „Kosten“ in `CLAUDE.md`).
- „Aussortiert leeren“ löscht nur Teile, die verknüpften Ausgaben bleiben erhalten.
- **Jede** Änderung an Daten (auch Name, Marken, Soll-Mengen, Ausgaben) erhöht `einstellungen.aenderungenSeitBackup` um 1 und setzt `geaendertAm` am betroffenen Teil.
- Schreibfehler (z. B. Speicher voll) abfangen und als verständliche Meldung an die Oberfläche geben, nie still verschlucken.
- Einfacher Mechanismus, damit Screens bei Datenänderungen neu zeichnen (z. B. Ereignis nach jedem Speichern).

## 3. `js/backup.js`

- **Export:** JSON `{ app: "kindergarderobe", version: 1, erstelltAm, daten: { … } }`, Dateiname `kindergarderobe-backup-JJJJ-MM-TT.json`. Weitergabe über das Teilen-Menü (`navigator.share` mit Datei, wenn `navigator.canShare` sie erlaubt), sonst Download. Nach erfolgreichem Teilen bzw. Download: `letztesBackupAm` setzen, `aenderungenSeitBackup = 0`. Bricht der Nutzer das Teilen-Menü ab, ändert sich nichts.
- **Import prüfen (ohne DOM):** Datei lesen, Format und Version prüfen, Teile mit `pruefeTeil` validieren. Ergebnis ist entweder eine Fehlermeldung oder eine Vorschau: Dateiname, Erstelldatum, Anzahl Teile (Stück, ohne Aussortiertes), Aussortiert (Stück), Kosten (Anzahl Einträge und Summe), Marken (Anzahl).
- **Import ausführen:** erst nach Bestätigung; ersetzt alle aktuellen Daten vollständig.
- **Erinnerung:** reine Funktion `backupFaellig(einstellungen)` → `true`, sobald `aenderungenSeitBackup > 0`. Kein Zeitintervall, keine Auswahl „Erinnern nach“.

## 4. `js/costs.js` (ohne DOM, erster Teil)

- `jahressumme(ausgaben, jahr)`: Summe aller Ausgaben mit Datum im angegebenen Jahr, berechnet nur aus `ausgaben` (inkl. Ausgaben aussortierter Teile).
- `formatEuro(betrag)`: deutsches Format „8,00 €“.
- Rechne mit Cent als ganzen Zahlen oder runde sauber, damit keine Fließkomma-Fehler sichtbar werden.
- Die übrige Kostenlogik (Durchschnitt, Sammelkäufe, Ansicht) folgt in Auftrag 06.

## 5. Oberfläche (nur dieser Umfang)

- **Einstellungen (`#/einstellungen`)** nach Screen 10 und den Screenshots „Einstellungen & Backup“ (Tablet) bzw. „Einstellungen – Smartphone“:
  - Karte „Begrüßung“: Name des Kindes mit Live-Vorschau „Hallo, [Name]!“, wird gespeichert.
  - Karte „Backup“: Status (letztes Backup mit Datum und Alter in Tagen; Banner-Farbe „fällig“ oder „gesichert“ laut `CLAUDE.md`), Knöpfe „Backup exportieren“ und „Backup einspielen“.
  - Import: Dateiauswahl → Vorschau mit Warnung „Alle aktuellen Daten werden ersetzt“ → Bestätigen oder Abbrechen; danach Erfolgsmeldung.
  - **Keine** Karte „Backup-Erinnerung“ / Auswahl „Erinnern nach“ (Design-Fehler, siehe `CLAUDE.md`).
  - Smartphone: Einträge „Kosten“ (mit Jahressumme des aktuellen Jahres, z. B. „78,50 €“) und „Soll-Mengen & Saisonwechsel“ oben wie im Design.
- **Übersicht (`#/`)**: Datum und Begrüßung mit dem gespeicherten Namen (ohne Namen: „Hallo!“) sowie der Backup-Banner nach Screen 1: erscheint, wenn `backupFaellig` wahr ist; Text wie im Design („Das letzte Backup ist 59 Tage alt. Zeit, die Daten zu sichern.“ mit echter Tageszahl); gibt es noch kein Backup, einen passenden Text selbst formulieren. „Jetzt sichern“ startet den Export. Der Ausblenden-Knopf blendet den Banner aus, bis die nächste Änderung erfolgt. Die übrigen Inhalte der Übersicht bleiben Platzhalter.

## 6. Tests

- Tests für `model.js`, die reinen Teile von `storage.js` und `backup.js` (Validierung, Einzelpreis → Ausgabe, Änderungszähler, Leeren behält Ausgaben, Import-Prüfung mit gültiger, beschädigter und fremder Datei, `backupFaellig`, `jahressumme`, `formatEuro`) in `tests/`, ausführbar mit `node --test`. `localStorage` für die Tests durch einen einfachen Ersatz im Speicher simulieren.
- Testdateien für den Import dürfen **keine** `.json`-Dateien im Repo sein (`.gitignore`); Testdaten direkt im Testcode erzeugen.

## Fertig, wenn

- `node --test` grün ist,
- im Browser: Name speichern → Begrüßung in Übersicht und Einstellungen aktualisiert sich, Banner erscheint; Export setzt den Banner zurück; Import einer zuvor exportierten Datei zeigt eine korrekte Vorschau und stellt die Daten nach Bestätigung wieder her; beschädigte Datei → verständliche Fehlermeldung,
- beides in der Gerätesimulation für Tablet (1194 × 834) und Smartphone (390 × 844) funktioniert, ohne waagerechtes Scrollen und ohne Konsolenfehler,
- `git status` vor dem Commit keine Screenshots, JSON- oder CSV-Dateien enthält.

Danach committen, pushen und zusammenfassen, inklusive „Selbst gestaltet – bitte prüfen“ (z. B. Import-Vorschau, Erfolgs-/Fehlermeldungen, Banner-Text ohne vorhandenes Backup) und einer Liste aller Entscheidungen, die du selbst treffen musstest.
