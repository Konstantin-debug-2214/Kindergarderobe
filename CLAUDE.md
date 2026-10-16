# Kindergarderobe – Projektregeln für Claude Code

Stand: 13.10.2026 (nach Auftrag 07)

Inventar-App für Kleidung und Spielzeug eines Kindes. Eigenbedarf, ein Kind.
Hauptgerät: Tablet im Querformat (1194 × 834). Die App muss zusätzlich auf dem Smartphone (390 × 844) gut bedienbar sein.
Ziel: auf einen Blick sehen, was da ist, was passt, was fehlt und was es gekostet hat. Schwerpunkt: Kategorien, Jahreszeiten, Filter.

## Technik (verbindlich)

- Reines HTML, CSS und JavaScript (ES-Module, `<script type="module">`). **Kein Framework, keine Bibliothek, kein Build-Schritt, kein npm-Paket zur Laufzeit.**
- Keine Netzwerkzugriffe zur Laufzeit. Schriften liegen lokal unter `fonts/` als Variable Fonts (Fredoka und Nunito, woff2, Teilmenge „latin“, OFL-Lizenz mitgeliefert); genutzt werden Fredoka 500/600 und Nunito 400/600/700/800.
- Icons als Inline-SVG (Strich-Icons), keine Icon-Fonts, keine Emojis.
- Daten in `localStorage` über ein eigenes Modul `js/storage.js` (nie direkt aus anderen Modulen). Beim Start `navigator.storage.persist()` anfragen.
- Responsive: Layout für Tablet quer (Hauptziel) und Smartphone hoch; Umbruch per CSS (Grid/Flex, Media Queries), keine getrennten Seiten.
- Veröffentlichung über GitHub Pages aus dem `main`-Branch. Das Repository ist öffentlich: **niemals echte Daten, Backups (`*.json`), die alte CSV oder die Design-Screenshots committen.**
- Diagramme selbst zeichnen – als SVG oder aus HTML und CSS, keine Bibliothek. Antippbare Balken als echte Links mit `aria-label` (freigegeben).
- Später: `manifest.webmanifest` + Service Worker, damit die App vom Startbildschirm offline läuft.

## Ordnerstruktur

```
index.html
css/        tokens.css (Farben, Abstände, Schriften), base.css, components.css, screens.css
js/         app.js (Start, Router), router.js (Hash-Routing, siehe Routen)
            storage.js, model.js (Datenmodell, Konstanten, Validierung), filters.js (reine Filter-/Zählfunktionen)
            costs.js (reine Kostenberechnung), backup.js (Export, Import, Erinnerung), formular.js (reine Formular-Logik)
            ui/diagramme.js: Balken- und Säulendiagramme
            ui/ausgabeDialog.js: Ausgaben-Formular, einmal für Kosten-Ansicht, Bearbeiten und „Neuer Sammelkauf“
            screens/*.js (je Screen ein Modul; teilFormular.js für #/neu und Bearbeiten), ui/*.js (Bausteine)
fonts/
icons/      App-Icons für das Manifest
tests/        Tests der reinen Logik mit dem eingebauten Node-Testrunner (`node --test`), keine npm-Pakete
Claude-Code-Uebergabe/        Aufträge (*.md, werden committet)
Design-Preview-Screenshots/   Design-Screenshots (nur lokal, stehen in .gitignore)
```

Reine Logik (Filtern, Zählen, Größen vergleichen, Kosten rechnen, Backup prüfen) gehört in Module ohne DOM-Zugriff, damit sie isoliert testbar ist.

### Routen

| Route | Screen |
|---|---|
| `#/` | Übersicht |
| `#/?art=…`, `#/?groesse=…` | Trefferansicht der Übersicht mit Filter-Chip (aus der Statistik) |
| `#/kategorie/:id` | Kategorie mit Filtern |
| `#/jahreszeit/:id` | Nach Jahreszeit |
| `#/teil/:id` | Detail |
| `#/teil/:id/bearbeiten` | Teil bearbeiten |
| `#/neu` | Teil hinzufügen |
| `#/kosten` | Kosten |
| `#/statistik` | Statistik |
| `#/saisonwechsel` | Soll-Mengen & Saisonwechsel |
| `#/aussortiert` | Aussortiert |
| `#/einstellungen` | Einstellungen & Backup (auf dem Smartphone „Mehr“) |

Unbekannte Routen führen zur Übersicht. Der Router liest Werte hinter `?` (z. B. `#/neu?kategorie=sets_sonstiges` belegt die Kategorie vor).

## Navigation (laut Design)

- **Tablet:** keine Leiste. Die Übersicht hat oben Suche, Knopf „Kosten“, Icon-Knöpfe Statistik, Aussortiert und Einstellungen sowie den Knopf „Teil hinzufügen“. Alle anderen Screens haben links oben einen runden Zurück-Knopf (Teil hinzufügen: Schließen-Knopf „×“ und „Abbrechen“). Die Statistik verlinkt auf „Soll-Mengen & Saisonwechsel“.
- **Smartphone:** untere Navigationsleiste mit fünf Einträgen: **Start** (`#/`), **Statistik** (`#/statistik`), **+** als runder Primär-Knopf in der Mitte (`#/neu`), **Aussortiert** (`#/aussortiert`), **Mehr** (`#/einstellungen`). Der aktive Eintrag ist in Primärfarbe hervorgehoben.
  - Die Leiste erscheint nur auf Übersicht, Statistik, Aussortiert und Einstellungen.
  - Statistik, Aussortiert und Einstellungen haben auf dem Smartphone keinen Zurück-Knopf (die Leiste navigiert).
  - Ohne Leiste (mit Zurück- bzw. Schließen-Knopf): Kategorie, Detail, Nach Jahreszeit, Teil hinzufügen/bearbeiten, Kosten, Soll-Mengen & Saisonwechsel. Das Detail hat unten eine eigene Aktionsleiste mit „Aussortieren“ und „Bearbeiten“.
  - Übersicht: Icon-Knopf „€“ oben rechts führt zu Kosten.
  - Statistik: Verweis-Karte „Soll-Mengen & Saisonwechsel“ mit Anzahl der Fehlenden oben.
  - „Mehr“ öffnet den Screen „Einstellungen“ mit Einträgen „Kosten“ (mit Jahressumme) und „Soll-Mengen & Saisonwechsel“, darunter Backup und Begrüßung.

## Datenmodell

### Gemeinsame Felder (Kleidung und Spielzeug)

| Feld | Typ | Pflicht | Hinweis |
|---|---|---|---|
| `id` | String | ja | `crypto.randomUUID()` |
| `typ` | Enum | ja | `kleidung`, `spielzeug` |
| `name` | String | ja | z. B. „Regenjacke gelb“ |
| `kategorie` | Enum | ja | siehe Kategorien; Spielzeug hat immer `spielzeug` |
| `art` | String | ja | Kleidung: aus der Artenliste der Kategorie; Spielzeug: aus der Liste der Spielzeug-Arten; jeweils oder eigene |
| `anzahl` | Zahl ≥ 1 | ja | Socken z. B. 10 (Paar) |
| `passform` | Enum | nur Kleidung | `passt_gut`, `bald_zu_klein`, `zu_klein` (Oberfläche: „Passt gut“, „Bald zu klein“, „Zu klein“); Spielzeug hat keine Passform |
| `aussortiert` | Boolean | ja | Standard `false`; aussortierte Teile landen im Papierkorb |
| `farbe` | String | nein | gelb, rot, blau, grün, grau, weiß, bunt (erweiterbar); reine Angabe zum Teil, bestimmt **nicht** die Kartenfarbe |
| `merkmal` | Enum | nein | `blanko`, `aufdruck`, `marke` |
| `marke` | String | nur bei `merkmal = marke` | Wert aus der pflegbaren Markenliste (z. B. Paw Patrol, Spider-Man) |
| `preis` | Objekt | nein | siehe Kosten |
| `notiz` | String | nein | erscheint im Detail als Untertitel unter dem Namen |
| `hinzugefuegtAm`, `geaendertAm` | ISO-Datum | automatisch | |
| `aussortiertAm` | ISO-Datum | automatisch | beim Aussortieren |
| `aussortiertGrund` | Enum | nein | `zu_klein`, `verschenkt`, `verkauft`, `kaputt`; wird beim Aussortieren abgefragt |

### Nur Kleidung

| Feld | Typ | Pflicht | Hinweis |
|---|---|---|---|
| `groesse` | Objekt | ja | `{ system, von, bis }`, siehe Größensysteme |
| `jahreszeiten` | Array | ja, min. 1 | `fruehling`, `sommer`, `herbst`, `winter`; kein Schnellknopf „Ganzjährig“ (entfällt, Entscheidung John) |

### Nur Spielzeug

| Feld | Typ | Pflicht | Hinweis |
|---|---|---|---|
| `alterAb` | Zahl | nein | Auswahl 0, 1, 2, 3, 4, 6, 8 oder eigene |
| `tags` | Array | nein | frei eingetragene Merkmale, z. B. „Holz“, „24 Teile“ |

Spielzeug hat **keine** Größe, **keine** Jahreszeiten und **keine** Passform.

### Kategorien und Arten (zweistufig, beide filterbar)

| Kategorie (`kategorie`) | Arten (Vorgabe, erweiterbar) | Größensystem |
|---|---|---|
| Oberteile `oberteile` | T-Shirt, Langarmshirt, Pullover, Strickjacke, Hemd, Weste, Jacke, Regenjacke, Winterjacke, Softshelljacke, Body, Unterhemd | Konfektion |
| Unterteile `unterteile` | Hose, Jeans, Jogginghose, Leggings, Shorts, Latzhose, Matschhose, Strumpfhose, Unterhose, Socken, Badehose | Konfektion; Socken in EU-Schuhgröße |
| Sets & Sonstiges `sets_sonstiges` | Set (Oberteil + Hose), Schlafanzug, Strampler, Overall, Schneeanzug, Softshellanzug, Schlafsack, Thermohose, Sonstiges | Konfektion |
| Schuhe `schuhe` | Sneaker, Sandalen, Gummistiefel, Winterstiefel, Hausschuhe | EU-Schuhgröße |
| Mützen & Co. `muetzen` | Mütze, Beanie, Cap, Sonnenhut, Regenmütze, Handschuhe, Fäustlinge, Schal, Halstuch | Kopfumfang (cm) bzw. Handschuhgröße |
| Spielzeug `spielzeug` | Brettspiel, Puzzle, Lego, Auto, Bastelkram, Kuscheltier, Buch | keine Größe |

„Sets & Sonstiges“ ist die Sammelkategorie: Alles, was sich nicht eindeutig zuordnen lässt, kommt dorthin. Die Zuordnung der Arten ist eine Konstante in `js/model.js` und muss leicht änderbar sein.

### Größensysteme

- `konfektion`: 50 … 164 in 6er-Schritten; Doppelgrößen wie 98/104 als `von: 98, bis: 104`.
- `schuh`: EU 17 … 40; Spannen wie 23–26 erlaubt.
- `kopf`: Kopfumfang in cm (35 … 58).
- `handschuh`: 0 … 6.
- Bei Einzelgröße gilt `von === bis`. Im Formular: Schnellauswahl der gängigen Größen plus „Andere …“ (Von/Bis über den vollen Bereich). Gängig (freigegeben): Konfektion 86–134, Schuh 22–34, Kopfumfang 48–55 cm, Handschuh 0–6.

### Jahreszeiten (nur Kleidung)

| Jahreszeit | Monate | Akzent | Fläche |
|---|---|---|---|
| Frühling `fruehling` | März – Mai | `#2F7A4E` | `#D9EBDF` |
| Sommer `sommer` | Juni – Aug. | `#9A6A0C` | `#F7E2B5` |
| Herbst `herbst` | Sept. – Nov. | `#9A4422` | `#F2D6CF` |
| Winter `winter` | Dez. – Feb. | `#5B4A9E` | `#E2DCF0` |

Die aktuelle Jahreszeit wird aus dem Datum bestimmt und mit „Jetzt“ markiert. Keine Temperaturen, keine Wetterdaten. Spielzeug erscheint in keiner Jahreszeiten-Ansicht und in keinem Jahreszeiten-Filter.

### Kosten

- `ausgaben`: Liste `{ id, bezeichnung, datum, betrag, anzahlTeile }`. Ein Eintrag mit `anzahlTeile > 1` ist ein **Sammelkauf** (z. B. „Flohmarkt Kita, 25 € für 6 Teile“); Einzelpreise müssen dabei nicht bekannt sein.
- `preis` am Teil: `{ art: "einzeln", betrag }` oder `{ art: "sammelkauf", ausgabeId }`. Ein Einzelpreis legt automatisch eine verknüpfte Ausgabe mit `anzahlTeile: 1` an, damit alle Summen nur aus `ausgaben` berechnet werden.
- Teile können einem Sammelkauf auch nachträglich zugeordnet werden.
- **Alle Beträge intern in Cent als ganze Zahlen** (8,00 € = `800`), auch in `ausgaben`, `preis` und im Backup. Anzeige nur über `formatEuro` aus `js/costs.js`; Eingaben mit Komma werden in Cent umgerechnet.
- Kostenansicht: Summe je Jahr, Anzahl Teile, Durchschnitt pro Teil, Einträge neueste zuerst; bei Sammelkäufen „ca. x € / Teil“. Beträge in Euro, deutsches Format (8,00 €).

### Weitere gespeicherte Daten

- `marken`: pflegbare Liste (anlegen, löschen). Gelöschte Marken bleiben an bestehenden Teilen erhalten.
- `sollMengen`: Liste `{ id, art, jahreszeit, soll }` – Soll je Art **und** Jahreszeit, optional, nur Kleidung. Gezählt werden nur Teile mit Passform „Passt gut“ in der Jahreszeit; „Bald zu klein“ zählt **nicht** mit. Unterschrittenes Soll wird als Lücke angezeigt.
- `einstellungen`: `{ name, letztesBackupAm, aenderungenSeitBackup }`. `name` ist der Name des Kindes und erscheint in der Begrüßung „Hallo, [Name]!“.
- Schema-Version `version: 1` für spätere Migrationen. Speicherschlüssel `kindergarderobe`.
- Backup-Datei: `{ app: "kindergarderobe", version: 1, erstelltAm, daten }`, Dateiname `kindergarderobe-backup-JJJJ-MM-TT.json`. Aus `einstellungen` wird nur `name` gesichert. Nach dem Einspielen gilt: `letztesBackupAm` = Erstelldatum der Datei, `aenderungenSeitBackup = 0`.

### Backup-Erinnerung

- Die Erinnerung erscheint, **sobald seit dem letzten Backup etwas hinzugefügt, bearbeitet oder geändert wurde** (`aenderungenSeitBackup > 0`). Ein regelmäßiges, zeitgesteuertes Backup ist nicht vorgesehen.
- Nach einem erfolgreichen Export (Teilen abgeschlossen oder Download) wird `aenderungenSeitBackup` auf 0 gesetzt und `letztesBackupAm` gespeichert. Ein abgebrochenes Teilen-Menü ändert nichts.
- **Ausblenden-Knopf:** blendet den Banner aus, bis die nächste Änderung erfolgt – auch über Neuladen und App-Neustart hinweg. Dafür wird der Zählerstand beim Ausblenden unter einem eigenen Schlüssel gemerkt (Oberflächen-Zustand, zählt nicht als Datenänderung, gehört nicht ins Backup). Der Banner erscheint wieder, sobald `aenderungenSeitBackup` diesen Stand übersteigt.
- Texte: Banner „Das letzte Backup ist n Tage alt. Zeit, die Daten zu sichern.“ bzw. ohne Backup „Es gibt noch kein Backup. Zeit, die Daten zu sichern.“ Status in den Einstellungen „vor n Tagen – es gibt Änderungen seitdem, ein neues Backup ist fällig“ bzw. „heute – alle Änderungen sind gesichert“ (freigegeben).
- Es gibt **keine** Einstellung für ein Erinnerungsintervall. Die Auswahl „Erinnern nach“ aus dem Design entfällt (Entscheidung John, 13.10.2026).

## Zählregeln

- Es wird immer nach **Stück** gezählt (Feld `anzahl`), nie nach Einträgen; bei Schuhen „Paar“.
- Teile mit `aussortiert: true` zählen nirgends mit und erscheinen nur im Bereich „Aussortiert“.
- Aussortiert ist ein Papierkorb: Teile lassen sich zurückholen; „Aussortiert leeren“ löscht endgültig, nur nach Sicherheitsabfrage.
- Kosten aussortierter Teile bleiben in der Kostensumme erhalten.
- Jahreszeiten-Zahlen zählen nur Kleidung.
- Auch die Teileliste im Detail („n TEILE“) und die Kopfzahl in „Nach Jahreszeit“ zählen nach Stück. Die Kopfzahl in „Nach Jahreszeit“ gilt für die ganze Jahreszeit, unabhängig vom Kategorie-Filter. Die Position beim Blättern („2 von 7“) zählt Einträge.
- Die Teilezahl der Kosten-Ansicht ist die Summe der `anzahlTeile` aller Ausgaben des Jahres, nicht die Zahl der Teile im Schrank. Dadurch bleiben Kosten aussortierter und gelöschter Teile erhalten. Durchschnitt und Preis pro Teil werden kaufmännisch auf Cent gerundet.
- Im Größen-Diagramm zählt eine Doppelgröße bei jeder enthaltenen Größe; die Summe der Balken ist deshalb größer als die Zahl der Teile.

## Suche, Filter, Sortierung (freigegeben)

- Suche auf der Übersicht: Treffer ersetzen beim Tippen die Kacheln (Karten in Kategoriefarbe, Tipp → Detail); gesucht wird in Name, Art, Marke, Notiz und freien Merkmalen, ohne Groß-/Kleinschreibung; Aussortiertes wird nicht gefunden.
- Filterlogik: innerhalb einer Gruppe ODER, zwischen Gruppen UND; Standard ohne Filter (alle Teile sichtbar). Doppelgrößen und Spannen passen auf jede enthaltene Größe.
- Karten sortiert alphabetisch nach Name. Bei `anzahl > 1` wird die Anzahl auf der Karte angezeigt.
- Filter und Suchbegriff einer Kategorie bleiben beim Wechsel ins Detail und zurück erhalten; beim Zurück zur Übersicht werden sie zurückgesetzt.

## Screens in Version 1

1. **Übersicht:** Datum und Begrüßung, Suche, Knopf „Kosten“, Icon-Knöpfe für Statistik, Aussortiert und Einstellungen, Knopf „Teil hinzufügen“ (Smartphone siehe Navigation); Backup-Hinweis als Banner („Das letzte Backup ist 59 Tage alt. Zeit, die Daten zu sichern.“) mit „Jetzt sichern“ und Ausblenden-Knopf, Anzeige nach der Regel unter „Backup-Erinnerung“; sechs Kategorie-Kacheln mit Stückzahl; vier Jahreszeiten-Kacheln mit Monaten, Stückzahl und „Jetzt“-Markierung.
2. **Kategorie mit Filtern:** Suche; Karten mit Name, Größe (bzw. Alter ab), Jahreszeiten, Merkmal bzw. Marke. Filterspalte (scrollbar):
   - Kleidungs-Kategorien: Jahreszeit, Größe, Merkmal (Blanko / Aufdruck / Marke, bei Marke Auswahlliste), Passform, Art.
   - Kategorie Spielzeug: eigener Filter mit Art, Alter ab und Merkmal; kein Jahreszeit-, Größen- oder Passform-Filter.
3. **Detail:** Tablet: Liste der Teile der Kategorie links (mit Größe, Preis und Hinweis „Bald zu klein“), Details rechts. Smartphone: Blättern mit „‹ ›“ und „2 von 7“, Aktionsleiste unten. Details: Name, darunter die **Notiz als Untertitel**; Kacheln Größe, Farbe, **Merkmal** (Blanko / Aufdruck / Markenname) und Preis (bei Sammelkauf mit Hinweis); Jahreszeiten; Passform zum Antippen; Notizfeld zum Bearbeiten. Knöpfe „Bearbeiten“ und „Aussortieren“ (fragt den Grund ab). Bei Spielzeug: Alter ab statt Größe, keine Jahreszeiten, keine Passform.
4. **Nach Jahreszeit:** vier Jahreszeiten-Knöpfe (gewählter Knopf in der Akzentfarbe der Jahreszeit), Filter nach Kategorie **ohne Spielzeug**, Karten mit Kategorie und Größe in der Farbe ihrer Kategorie.
5. **Teil hinzufügen / bearbeiten:** Umschalter Kleidung / Spielzeug, Live-Vorschau der Karte (in der Farbe der Kategorie).
   - Kleidung: Name, Kategorie (nur die fünf Kleidungs-Kategorien), **Art** (direkt nach der Kategorie, Auswahl aus der Artenliste der Kategorie plus „Andere …“), Größe, Jahreszeiten, Farbe, Merkmal (+ Marke, Markenliste anlegen/löschen), Passform, **Anzahl** (Zähler − / +, Standard 1), Preis (Einzelpreis oder Sammelkauf auswählen / neu), Notiz.
   - Spielzeug: Name, Art, Alter ab, Farbe (optional), Merkmal, freie Merkmale, **Anzahl**, Preis, Notiz.
   - Reihenfolge der Felder wie im Design (Farbe und Merkmal vor Passform). Tablet: links Vorschau, Name, Preis, Notiz, rechts die übrigen Felder in dieser Reihenfolge. Smartphone: eine Spalte in der oben genannten Reihenfolge.
   - Art und Anzahl fehlen im Design und werden im Stil der übrigen Felder gestaltet.
6. **Kosten:** Summe des Jahres, Teile, Durchschnitt; Formular „Kosten hinzufügen“ (Wofür?, Gesamtbetrag, Anzahl Teile); Einträge neueste zuerst. Smartphone: Knopf „+ Kosten“ statt dauerhaft sichtbarem Formular. Freigegeben (nicht im Design): Jahr-Umschalter ‹ › an der Summenkarte (nur bei Ausgaben in anderen Jahren), Datumsfeld (Standard heute), Tipp auf Einzelteil → Detail des Teils, Tipp auf Sammelkauf → Dialog zum Ändern/Löschen mit zugeordneten Teilen; Löschen nur nach Rückfrage, zugeordnete Teile verlieren ihren Preis. Beim Speichern wechselt die Ansicht in das Jahr der neuen Ausgabe.
7. **Statistik:** Gesamtzahl im Schrank (ohne Aussortiertes); Balkendiagramme nach Kategorie, **Art der Kleidung** (die häufigsten 7), **Spielzeug nach Art** (neu, nicht im Design), Jahreszeit (Hinweis: ein Teil kann zu mehreren gehören) und Größe; jeder Balken führt per Tipp zu den Teilen; Link zu „Soll-Mengen & Saisonwechsel“. Freigegeben: Kategorie → Kategorie-Ansicht, Jahreszeit → Jahreszeiten-Ansicht, Art, Spielzeug-Art und Größe → Trefferansicht der Übersicht mit Filter-Chip (`#/?art=…`, `#/?groesse=…`). Größen-Diagramm nur Konfektion; Doppelgrößen zählen bei jeder enthaltenen Größe (mit Hinweis). „Spielzeug nach Art“ als fünfte Karte im Raster. Etikett „n fehlen“ an der Soll-Mengen-Verweiskarte ab Auftrag 08.
8. **Soll-Mengen & Saisonwechsel:** Umschalter für die vier Jahreszeiten (gewählter Knopf in der Akzentfarbe der Jahreszeit). Links Tabelle „Art · Passend · Soll (− / +) · Stand“ mit Stand „kein Soll“, „noch n fehlen“ oder „vollständig“. Rechts Saisonwechsel-Check mit Saisonbeginn („ab 1. Dezember · in 7 Wochen“), Summen „ist da / passt / fehlt“, Liste „Besorgen“ (Art + Anzahl) und Liste „Wird bald zu klein“. Nur Kleidung. Freigegeben: „ist da“ = Passt gut + Bald zu klein, „passt“ = Passt gut, „fehlt“ = Summe der Fehlenden – jeweils nur über Arten mit Soll, „Zu klein“ zählt nicht. Tabelle zeigt alle Arten mit Soll oder mit passenden bzw. bald zu kleinen Teilen der Jahreszeit; weitere Arten über „+ Art“; Soll 0 entfernt das Soll. „Besorgen“-Häkchen sind eine Merkhilfe im Oberflächen-Zustand (keine Datenänderung, nicht im Backup) und verschwinden, sobald nichts mehr fehlt. Beim Öffnen ist die kommende Jahreszeit gewählt; für die laufende „läuft · noch n Wochen“. Etikett „n fehlen“ in der Statistik = Fehlende der kommenden Jahreszeit, bei 0 kein Etikett.
9. **Aussortiert:** Liste mit Name, Kategorie, Größe bzw. Alter, Datum und Grund (zu klein, verschenkt, verkauft, kaputt); „Zurückholen“ je Teil; „Aussortiert leeren“ mit Bestätigungsdialog (endgültig, nur über ein älteres Backup wiederherstellbar); leerer Zustand mit Hinweis.
10. **Einstellungen & Backup:** Name des Kindes mit Live-Vorschau der Begrüßung; Backup-Status (letztes Backup, fällig oder gesichert); „Backup exportieren“ (Teilen-Menü, JSON); „Backup einspielen“ mit Vorschau (Dateiname, Erstelldatum, Anzahl Teile, Aussortiert, Kosten, Marken), Warnung, dass alle aktuellen Daten ersetzt werden, und Bestätigung. Keine Auswahl „Erinnern nach“. Smartphone zusätzlich: Einträge „Kosten“ und „Soll-Mengen & Saisonwechsel“.

Backup: JSON-Export per Knopf (über das Teilen-Menü, Fallback Download), Import mit Vorschau und Rückfrage. Kein automatisches Backup, kein CSV-Export, kein CSV-Import.

Nicht in V1: Anlässe, Fotos, mehrere Kinder, Sync, Wetterdaten/Temperaturen, Größenwarnung, Wachstumsverlauf, „Heute anziehen“, Herkunft (gekauft/geschenkt/Second-Hand).

## Design

- Vorlage: Design-Canvas „Kindergarderobe“ (Tablet 1194 × 834, Smartphone 390 × 844). Screenshots liegen unter `Design-Preview-Screenshots/` (nur lokal). **Bei Widersprüchen zwischen Screenshot und dieser Datei gilt CLAUDE.md.**
- Farben und Schriften in `css/tokens.css`:
  Hintergrund `#F1F5F3`, Text `#1E2B2F`, gedämpft `#55636A`, Text auf Kachel `#3E4C52`, Primär `#1F6F8B` (gedrückt: `--farbe-primaer-dunkel` `#195A71`), Rahmen `#DCE5E1`, Karten weiß.
  Kategorie-Farben: Oberteile `#CFE3EA`, Unterteile `#D9EBDF`, Sets & Sonstiges `#F7E2B5`, Schuhe `#F2D6CF`, Mützen & Co. `#E2DCF0`, Spielzeug weiß mit Rahmen.
  Jahreszeiten-Farben siehe oben. Überschriften Fredoka 600, Text Nunito.
- Abstände: Skala in `tokens.css` mit 4-px-Basis, `--abstand-1` (4 px) bis `--abstand-10` (64 px); z. B. 20 px zwischen Kacheln, 32 px Innenabstand der Inhaltsfläche.
- Breakpoint: bis 767 px Breite Smartphone-Layout (mit unterer Leiste), darüber Tablet-Layout. Hilfsklassen `.nur-tablet` / `.nur-smartphone`.
- Radien: Kacheln 28 px, Karten 24 px, Knöpfe und Eingaben rund (Höhe/2).
- Smartphone: Kacheln zweispaltig, Suche über volle Breite, Navigation siehe oben.
- Hinweis-Banner (Backup): Fläche `#FBEFD5`, Text `#6B4A0E`; Erfolg: Fläche `#DDEFE3`, Text `#2F6B45`.
- Endgültiges Löschen: Rahmen und Icon `#B3261E` (`--farbe-warnung`), Text `#8C1D18` (`--farbe-warnung-text`).
- Kurze Bestätigung: Nach Aktionen wie Aussortieren, Zurückholen und Leeren erscheint unten eine kurze Bestätigung in den Erfolgsfarben; sie verschwindet nach etwa 3 Sekunden von selbst (Baustein `ui/hinweis.js`).
- Touch: jedes Bedienelement mindestens 48 × 48 px, keine Funktion nur per Hover, keine Doppeltipps.
- Echte `<button>`, `<a>`, `<input>` mit `<label>`; `aria-label` an reinen Icon-Knöpfen; Kontrast mindestens 4,5:1.
- Oberflächentexte auf Deutsch, Code und Kommentare dürfen Englisch sein.
- Passform in der Oberfläche: „Passt gut“, „Bald zu klein“, „Zu klein“. Aussortieren ist eine eigene Aktion, keine Passform.

### Farbregel für Teile (verbindlich)

Jedes Teil wird **überall in der Farbe seiner Kategorie** dargestellt: Karten, Listen-Icons im Detail, Aussortiert-Liste, Vorschau im Formular, Karten in „Nach Jahreszeit“. Ein Oberteil ist also immer pastellblau, ein Unterteil immer pastellgrün usw. Die Jahreszeiten-Knöpfe und -Kacheln haben ihre eigenen Farben, die Teile behalten trotzdem ihre Kategorie-Farbe. Das Feld `farbe` färbt keine Karte.

### Bekannte Fehler im Design (nicht übernehmen)

- Karten in der Kategorie-Ansicht und Icons in Detail/Aussortiert haben unterschiedliche Farben je Teil → Kategorie-Farbe verwenden.
- Karten in „Nach Jahreszeit“ in der Jahreszeiten-Farbe → Kategorie-Farbe verwenden.
- Vorschau in „Teil hinzufügen“ in der gewählten Teil-Farbe (gelb) → Kategorie-Farbe verwenden.
- „Spielzeug“ als Kategorie im Kleidungs-Formular (Tablet) → nur die fünf Kleidungs-Kategorien anzeigen.
- „Spielzeug“ im Kategorie-Filter von „Nach Jahreszeit“ → entfällt.
- Gewählter Jahreszeiten-Knopf in Soll-Mengen in Primärfarbe → Akzentfarbe der Jahreszeit.
- Detail (Tablet) ohne Merkmal → Merkmal-Kachel ergänzen.
- Einstellungen mit Auswahl „Erinnern nach“ bzw. Karte „Backup-Erinnerung“ → entfällt.

## Arbeitsweise

- Arbeite nur den Auftrag ab, den du bekommst. Neue Funktionen nicht eigenmächtig hinzufügen. Bei Unklarheiten nachfragen statt selbst entscheiden.
- Elemente, die nicht im Design vorkommen (z. B. Dialoge für Aussortieren, „Aussortiert leeren“, Import-Vorschau, leere Zustände, Felder Art und Anzahl, Statistik „Spielzeug nach Art“), gestaltest du selbst im Stil der vorhandenen Screens. **Liste sie in der Zusammenfassung unter „Selbst gestaltet – bitte prüfen“ auf**, damit John sie im Design nachziehen kann.
- Kleine, nachvollziehbare Commits mit deutschen Commit-Messages. Vor jedem Commit mit `git status` prüfen, dass keine Screenshots, JSON-Backups oder CSV-Dateien dabei sind.
- Am Ende jedes Auftrags: kurze Zusammenfassung, was gebaut wurde, was offen ist und wie man es im Browser testet.
