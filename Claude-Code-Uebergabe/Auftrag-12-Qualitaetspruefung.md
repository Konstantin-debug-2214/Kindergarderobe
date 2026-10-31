# Auftrag 12 – Qualitätsprüfung (Code-Review und Fehlersuche)

Lies zuerst CLAUDE.md vollständig. Sie ist der Maßstab für diese Prüfung.

## Ziel

Die App ist funktional fertig (Aufträge 01–11). Prüfe den gesamten Code auf Fehler, Abweichungen von CLAUDE.md und Schwachstellen. **In Phase 1 änderst du keinen Code und machst keine Commits.**

## Phase 1 – Prüfen

Gehe jede Datei durch und prüfe die folgenden Punkte.

- Führe zuerst die vorhandenen Tests im Ordner `tests/` aus und berichte das Ergebnis.
- Wo reine Logik betroffen ist (`filters.js`, `costs.js`, `model.js`, `backup.js`) und die vorhandenen Tests einen Punkt nicht abdecken, schreibe temporäre Prüfskripte mit Node ohne Pakete **außerhalb des Repos** und führe sie aus. Sie werden nicht committet.

### 1. Technik-Regeln und Repo

- Kein Framework, keine Bibliothek, kein Netzwerkzugriff zur Laufzeit (auch keine externen Schriften, CDNs oder `fetch`-Aufrufe nach außen).
- `localStorage` wird ausschließlich über `js/storage.js` angesprochen. `navigator.storage.persist()` wird beim Start angefragt.
- `git ls-files` prüfen: keine `*.json`-Backups, keine CSV, keine Screenshots im Repo. `.gitignore` deckt `Design-Preview-Screenshots/`, `*.csv` und Backups ab. Ausnahme: `manifest.webmanifest` und ggf. Test-Fixtures mit erfundenen Daten – diese einzeln auflisten.
- Auch die Git-Historie prüfen (`git log --all --stat`), ob dort früher etwas davon committet wurde.
- OFL-Lizenz der Schriften liegt bei.
- Alle Pfade sind relativ, damit die App unter GitHub Pages im Unterordner (`/<repo-name>/`) funktioniert – auch im Manifest und in `sw.js`.

### 2. Sicherheit

- Jede Stelle, an der Nutzereingaben (Name, Notiz, Marke, Art, Tags, Bezeichnung einer Ausgabe, Name des Kindes) per `innerHTML` oder Template-String ins DOM gelangen: Wird escaped? Teste gedanklich mit `<img src=x onerror=alert(1)>`.
- Importierte Backups: Werden deren Inhalte genauso abgesichert wie Eingaben?

### 3. Datenmodell und Validierung

- Pflichtfelder laut CLAUDE.md werden geprüft; `anzahl` ≥ 1; `groesse.von` ≤ `groesse.bis`.
- Spielzeug hat nie `groesse`, `jahreszeiten` oder `passform` – auch nicht nach Umschalten Kleidung → Spielzeug im Formular (bleiben alte Werte hängen?).
- `marke` nur bei `merkmal = marke`; ein Wechsel des Merkmals entfernt die Marke.
- Gelöschte Marken bleiben an bestehenden Teilen erhalten.
- `geaendertAm`, `aussortiertAm` und `aussortiertGrund` werden korrekt gesetzt und beim Zurückholen sinnvoll behandelt.

### 4. Zählregeln

- Gezählt wird nach Stück (`anzahl`), nie nach Einträgen – in Übersicht, Kategorien, Jahreszeiten, Statistik und Soll-Mengen.
- Aussortierte Teile zählen nirgends mit; ihre Kosten bleiben in der Kostensumme.
- Jahreszeiten-Zahlen und -Filter enthalten nie Spielzeug.
- Soll-Mengen zählen nur „Passt gut“ in der gewählten Jahreszeit.
- Statistik Jahreszeit: Mehrfachzugehörigkeit korrekt und mit Hinweis.

### 5. Datum und Jahreszeiten

- Aktuelle Jahreszeit für jeden Monat korrekt (Dezember, Januar, Februar = Winter; Grenzen 1.3., 1.6., 1.9., 1.12.).
- Saisonbeginn-Text („ab 1. Dezember · in 7 Wochen“) auch über den Jahreswechsel korrekt, ebenso wenn die Saison gerade läuft.
- Zeitzonenfehler: Wird irgendwo `toISOString()` für ein Tagesdatum benutzt, sodass Einträge kurz nach Mitternacht auf den Vortag rutschen?
- Kosten werden dem Jahr ihres Ausgabe-Datums zugeordnet.

### 6. Kosten

- Ein Einzelpreis legt genau eine verknüpfte Ausgabe an. Was passiert beim Ändern des Preises, beim Wechsel Einzelpreis ↔ Sammelkauf, beim Entfernen des Preises und beim endgültigen Löschen („Aussortiert leeren“)? Entstehen verwaiste oder doppelte Ausgaben?
- Rechenfehler durch Gleitkomma (z. B. 0,1 + 0,2); Rundung bei Durchschnitt und „ca. x € / Teil“; deutsches Format (8,00 €); Eingabe mit Komma.
- Division durch null bei 0 Teilen.

### 7. Backup

- Der Export setzt `aenderungenSeitBackup` erst nach erfolgreichem Export zurück – nicht, wenn das Teilen-Menü abgebrochen wird.
- Import: kaputtes JSON, falsche oder fehlende `version`, fehlende Felder, fremde Datei, leere Datei. Gibt es eine verständliche Fehlermeldung, und bleiben die aktuellen Daten bei Fehlern unangetastet?
- Die Vorschau zeigt korrekte Zahlen; Daten werden erst nach Bestätigung ersetzt.
- Das Erinnerungs-Banner erscheint genau nach der Regel in CLAUDE.md. Berichte, wie „Erinnern nach“ aktuell umgesetzt ist, und ändere daran nichts.
- Speicher voll (`QuotaExceededError`) oder `localStorage` nicht verfügbar: Gehen Daten still verloren?

### 8. Router und Zustände

- Unbekannte Routen führen zur Übersicht. Prüfe `#/teil/<unbekannte-id>`, `#/teil/<aussortierte-id>`, `#/kategorie/<falsch>`, `#/jahreszeit/<falsch>`.
- Leere Zustände: keine Teile, keine Kosten, leere Kategorie, leerer Papierkorb.
- Werden Event-Listener bei jedem Neuzeichnen erneut angehängt (doppelte Aktionen, Speicherlecks)?
- Zurück-Knopf und Browser-Zurück verhalten sich gleich.
- Der Nach-oben-Knopf aus Auftrag 09b funktioniert auf allen langen Screens und verdeckt nichts (z. B. die Navigationsleiste oder die Aktionsleiste im Detail).

### 9. Oberfläche und Barrierefreiheit

- Layout bei 1194 × 834 und 390 × 844; sehr lange Namen, viele Teile.
- Navigation laut Abschnitt „Navigation“ in CLAUDE.md: Leiste nur auf den genannten Screens, aktiver Eintrag hervorgehoben.
- Farbregel: Jedes Teil ist überall in der Farbe seiner Kategorie. Keiner der „Bekannten Fehler im Design“ wurde übernommen.
- Touch-Ziele ≥ 48 × 48 px, keine Funktion nur per Hover, `<label>` an Eingaben, `aria-label` an Icon-Knöpfen, sichtbarer Fokus, Kontrast ≥ 4,5:1.
- Icons aus Auftrag 11: einheitlicher Strichstil, Inline-SVG, keine Emojis.

### 10. Offline und PWA

- `manifest.webmanifest` gültig, alle Icons in `icons/` vorhanden und korrekt referenziert.
- `sw.js` cacht alle nötigen Dateien (inkl. Schriften und aller Module unter `js/`).
- Cache-Versionierung: Kommt ein Update nach dem nächsten Deploy beim Nutzer an, oder bleibt die alte Version hängen?

### 11. Allgemeine Code-Qualität

- Tote Code-Stellen, doppelte Logik, `console.log`-Ausgaben, auskommentierter Code.
- Reine Logik-Module ohne DOM-Zugriff.
- README.md und CLAUDE.md stimmen mit dem tatsächlichen Stand überein (Ordnerstruktur, Routen).

## Ergebnis von Phase 1

Lege `Claude-Code-Uebergabe/Pruefbericht-12.md` an (noch nicht committen) mit einer Tabelle:

| Nr | Schwere | Datei:Zeile | Problem | So reproduzierbar | Vorschlag |
|---|---|---|---|---|---|

Schwere:

- **kritisch:** Datenverlust, Sicherheitslücke, App unbenutzbar
- **hoch:** falsche Zahlen, Regel aus CLAUDE.md verletzt
- **mittel:** Randfall, Bedienung
- **niedrig:** Aufräumen, Stil

Darunter:

- Ergebnis der vorhandenen Tests.
- Was du geprüft hast und unauffällig war.
- Welche Punkte du ohne echtes Gerät nicht prüfen konntest (die teste ich auf Tablet und Smartphone).

**Dann stoppen und auf meine Freigabe warten.**

## Phase 2 – Beheben (erst nach Freigabe)

- Nur die freigegebenen Nummern beheben, in der Reihenfolge kritisch → niedrig.
- Wo sinnvoll, zu einem behobenen Logikfehler einen Test in `tests/` ergänzen, der den Fehler vorher gezeigt hätte.
- Ein Commit pro Befund, deutsche Commit-Message mit Nummer (z. B. „Fix #3: Notiz wird beim Anzeigen escaped“).
- Keine neuen Funktionen, kein Umbau über den Befund hinaus.
- Vor jedem Commit `git status` prüfen (keine JSON-Backups, CSV, Screenshots).
- Den Prüfbericht um eine Spalte „Status“ ergänzen und mitcommitten.
- Am Ende: Zusammenfassung, was behoben ist, was offen bleibt, und wie ich jede Korrektur im Browser nachprüfe.
