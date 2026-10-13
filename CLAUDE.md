# Kindergarderobe – Projektregeln für Claude Code

Inventar-App für Kleidung und Spielzeug eines Kindes. Eigenbedarf, ein Kind.
Hauptgerät: Tablet im Querformat (1194 × 834). Die App muss zusätzlich auf dem Smartphone (390 × 844) gut bedienbar sein.
Ziel: auf einen Blick sehen, was da ist, was passt, was fehlt und was es gekostet hat. Schwerpunkt: Kategorien, Jahreszeiten, Filter.

## Technik (verbindlich)

- Reines HTML, CSS und JavaScript (ES-Module, `<script type="module">`). **Kein Framework, keine Bibliothek, kein Build-Schritt, kein npm-Paket zur Laufzeit.**
- Keine Netzwerkzugriffe zur Laufzeit. Schriften liegen lokal unter `fonts/` (Fredoka 500/600, Nunito 400/600/700/800, woff2, OFL-Lizenz mitliefern).
- Icons als Inline-SVG (Strich-Icons), keine Icon-Fonts, keine Emojis.
- Daten in `localStorage` über ein eigenes Modul `js/storage.js` (nie direkt aus anderen Modulen). Beim Start `navigator.storage.persist()` anfragen.
- Responsive: Layout für Tablet quer (Hauptziel) und Smartphone hoch; Umbruch per CSS (Grid/Flex, Media Queries), keine getrennten Seiten.
- Veröffentlichung über GitHub Pages aus dem `main`-Branch. Das Repository ist öffentlich: **niemals echte Daten, Backups (`*.json` außer `manifest.webmanifest`) oder die alte CSV committen.**
- Diagramme selbst als SVG zeichnen.
- Später: `manifest.webmanifest` + Service Worker, damit die App vom Startbildschirm offline läuft.

## Ordnerstruktur

```
index.html
css/        tokens.css (Farben, Abstände, Schriften), base.css, components.css, screens.css
js/         app.js (Start, Router), router.js (Hash-Routing: #/, #/kategorie/:id, #/jahreszeit/:id, #/teil/:id, #/neu, #/kosten, #/statistik, #/aussortiert, #/einstellungen)
            storage.js, model.js (Datenmodell, Konstanten, Validierung), filters.js (reine Filter-/Zählfunktionen)
            costs.js (reine Kostenberechnung), backup.js (Export, Import, Erinnerung), screens/*.js (je Screen ein Modul), ui/*.js (Bausteine)
fonts/
icons/      App-Icons für das Manifest
```

Reine Logik (Filtern, Zählen, Größen vergleichen, Kosten rechnen, Backup prüfen) gehört in Module ohne DOM-Zugriff, damit sie isoliert testbar ist.

## Datenmodell

### Gemeinsame Felder (Kleidung und Spielzeug)

| Feld | Typ | Pflicht | Hinweis |
|---|---|---|---|
| `id` | String | ja | `crypto.randomUUID()` |
| `typ` | Enum | ja | `kleidung`, `spielzeug` |
| `name` | String | ja | z. B. „Regenjacke gelb“ |
| `kategorie` | Enum | ja | siehe Kategorien |
| `art` | String | ja | aus der Liste der Kategorie oder eigene |
| `anzahl` | Zahl ≥ 1 | ja | Socken z. B. 10 (Paar) |
| `passform` | Enum | nur Kleidung | `passt_gut`, `bald_zu_klein`, `zu_klein` (Oberfläche: „Passt gut“, „Bald zu klein“, „Zu klein“); Spielzeug hat keine Passform |
| `aussortiert` | Boolean | ja | Standard `false`; aussortierte Teile landen im Papierkorb |
| `farbe` | String | nein | gelb, rot, blau, grün, grau, weiß, bunt (erweiterbar) |
| `merkmal` | Enum | nein | `blanko`, `aufdruck`, `marke` |
| `marke` | String | nur bei `merkmal = marke` | Wert aus der pflegbaren Markenliste (z. B. Paw Patrol, Spider-Man) |
| `preis` | Objekt | nein | siehe Kosten |
| `notiz` | String | nein | |
| `hinzugefuegtAm`, `geaendertAm` | ISO-Datum | automatisch | |
| `aussortiertAm` | ISO-Datum | automatisch | beim Aussortieren |
| `aussortiertGrund` | Enum | nein | `zu_klein`, `verschenkt`, `verkauft`, `kaputt`, `sonstiges`; wird beim Aussortieren abgefragt |

### Nur Kleidung

| Feld | Typ | Pflicht | Hinweis |
|---|---|---|---|
| `groesse` | Objekt | ja | `{ system, von, bis }`, siehe Größensysteme |
| `jahreszeiten` | Array | ja, min. 1 | `fruehling`, `sommer`, `herbst`, `winter`; Schnellknopf „Ganzjährig“ setzt alle vier |
| `herkunft` | Enum | nein | `gekauft`, `geschenkt`, `second_hand` |

### Nur Spielzeug

| Feld | Typ | Pflicht | Hinweis |
|---|---|---|---|
| `alterAb` | Zahl | nein | Auswahl 0, 1, 2, 3, 4, 6, 8 oder eigene |
| `spielzeugArt` | String | ja | Brettspiel, Puzzle, Lego, Auto, Bastelkram, Kuscheltier, Buch oder eigene |
| `tags` | Array | nein | frei eingetragene Merkmale, z. B. „Holz“, „24 Teile“ |

### Kategorien und Arten (zweistufig, beide filterbar)

| Kategorie (`kategorie`) | Arten (Vorgabe, erweiterbar) | Größensystem |
|---|---|---|
| Oberteile `oberteile` | T-Shirt, Langarmshirt, Pullover, Strickjacke, Hemd, Weste, Jacke, Regenjacke, Winterjacke, Softshelljacke, Body, Unterhemd | Konfektion |
| Unterteile `unterteile` | Hose, Jeans, Jogginghose, Leggings, Shorts, Latzhose, Matschhose, Strumpfhose, Unterhose, Socken, Badehose | Konfektion; Socken in EU-Schuhgröße |
| Sets & Sonstiges `sets_sonstiges` | Set (Oberteil + Hose), Schlafanzug, Strampler, Overall, Schneeanzug, Softshellanzug, Schlafsack, Sonstiges | Konfektion |
| Schuhe `schuhe` | Sneaker, Sandalen, Gummistiefel, Winterstiefel, Hausschuhe | EU-Schuhgröße |
| Mützen & Co. `muetzen` | Mütze, Beanie, Cap, Sonnenhut, Regenmütze, Handschuhe, Fäustlinge, Schal, Halstuch | Kopfumfang (cm) bzw. Handschuhgröße |
| Spielzeug `spielzeug` | siehe `spielzeugArt` | keine Größe |

„Sets & Sonstiges“ ist die Sammelkategorie: Alles, was sich nicht eindeutig zuordnen lässt, kommt dorthin. Die Zuordnung der Arten ist eine Konstante in `js/model.js` und muss leicht änderbar sein.

### Größensysteme

- `konfektion`: 50 … 164 in 6er-Schritten; Doppelgrößen wie 98/104 als `von: 98, bis: 104`.
- `schuh`: EU 17 … 40; Spannen wie 23–26 erlaubt.
- `kopf`: Kopfumfang in cm (35 … 58).
- `handschuh`: 0 … 6.
- Bei Einzelgröße gilt `von === bis`. Im Formular: Schnellauswahl der gängigen Größen plus „Andere …“.

### Jahreszeiten

| Jahreszeit | Monate | Akzent | Fläche |
|---|---|---|---|
| Frühling `fruehling` | März – Mai | `#2F7A4E` | `#D9EBDF` |
| Sommer `sommer` | Juni – Aug. | `#9A6A0C` | `#F7E2B5` |
| Herbst `herbst` | Sept. – Nov. | `#9A4422` | `#F2D6CF` |
| Winter `winter` | Dez. – Feb. | `#5B4A9E` | `#E2DCF0` |

Die aktuelle Jahreszeit wird aus dem Datum bestimmt und mit „Jetzt“ markiert. Keine Temperaturen, keine Wetterdaten.

### Kosten

- `ausgaben`: Liste `{ id, bezeichnung, datum, betrag, anzahlTeile }`. Ein Eintrag mit `anzahlTeile > 1` ist ein **Sammelkauf** (z. B. „Flohmarkt Kita, 25 € für 6 Teile“); Einzelpreise müssen dabei nicht bekannt sein.
- `preis` am Teil: `{ art: "einzeln", betrag }` oder `{ art: "sammelkauf", ausgabeId }`. Ein Einzelpreis legt automatisch eine verknüpfte Ausgabe mit `anzahlTeile: 1` an, damit alle Summen nur aus `ausgaben` berechnet werden.
- Teile können einem Sammelkauf auch nachträglich zugeordnet werden.
- Kostenansicht: Summe je Jahr, Anzahl Teile, Durchschnitt pro Teil, Einträge neueste zuerst; bei Sammelkäufen „ca. x € / Teil“. Beträge in Euro, deutsches Format (8,00 €).

### Weitere gespeicherte Daten

- `marken`: pflegbare Liste (anlegen, löschen). Gelöschte Marken bleiben an bestehenden Teilen erhalten.
- `sollMengen`: Liste `{ id, art, jahreszeit, soll }` – Soll je Art **und** Jahreszeit, optional. Gezählt werden nur passende Teile (Passform „Passt gut“) der Jahreszeit; unterschrittenes Soll wird als Lücke angezeigt.
- `einstellungen`: `{ name, letztesBackupAm, aenderungenSeitBackup, backupErinnerungTage }`. `name` ist der Name des Kindes und erscheint in der Begrüßung „Hallo, [Name]!“. `backupErinnerungTage`: `14` (Standard), `30`, `60` oder `null` (nie erinnern).
- Schema-Version `version: 1` für spätere Migrationen.

## Zählregeln

- Es wird immer nach **Stück** gezählt (Feld `anzahl`), nie nach Einträgen; bei Schuhen „Paar“.
- Teile mit `aussortiert: true` zählen nirgends mit und erscheinen nur im Bereich „Aussortiert“.
- Aussortiert ist ein Papierkorb: Teile lassen sich zurückholen; „Aussortiert leeren“ löscht endgültig, nur nach Sicherheitsabfrage.
- Kosten aussortierter Teile bleiben in der Kostensumme erhalten.

## Screens in Version 1

1. **Übersicht:** Datum und Begrüßung, Suche, Knopf „Kosten“, Icon-Knöpfe für Statistik, Aussortiert und Einstellungen, Knopf „Teil hinzufügen“; Backup-Hinweis als Banner („Das letzte Backup ist 59 Tage alt …“) mit „Jetzt sichern“ und Ausblenden-Knopf; sechs Kategorie-Kacheln mit Stückzahl; vier Jahreszeiten-Kacheln mit Monaten, Stückzahl und „Jetzt“-Markierung.
2. **Kategorie mit Filtern:** Filterspalte mit Jahreszeit, Größe, Art, Merkmal (Blanko / Aufdruck / Marke, bei Marke Auswahlliste), Passform; Suche; Karten mit Name, Größe, Jahreszeiten, Merkmal bzw. Marke.
3. **Detail:** Liste der Teile der Kategorie links (mit Größe, Preis und Hinweis „Bald zu klein“), Details rechts: Größe, Farbe, Preis (bei Sammelkauf mit Hinweis), Jahreszeiten, Passform zum Antippen, Notiz; Knöpfe „Bearbeiten“ und „Aussortieren“ (fragt den Grund ab).
4. **Nach Jahreszeit:** vier Jahreszeiten-Knöpfe, Filter nach Kategorie, Karten mit Kategorie und Größe.
5. **Teil hinzufügen / bearbeiten:** Umschalter Kleidung / Spielzeug, Live-Vorschau der Karte. Kleidung: Name, Kategorie, Art, Größe, Jahreszeiten, Passform, Farbe, Merkmal (+ Marke, Markenliste anlegen/löschen), Preis (Einzelpreis oder Sammelkauf auswählen / neu), Notiz. Spielzeug: Name, Art, Alter ab, Farbe (optional), freie Merkmale, Preis, Notiz.
6. **Kosten:** Summe des Jahres, Teile, Durchschnitt; Formular „Kosten hinzufügen“ (Wofür?, Gesamtbetrag, Anzahl Teile); Einträge neueste zuerst.
7. **Statistik:** Gesamtzahl im Schrank (ohne Aussortiertes); Balkendiagramme nach Kategorie, Art (die häufigsten 7), Jahreszeit (Hinweis: ein Teil kann zu mehreren gehören) und Größe; jeder Balken führt per Tipp zu den Teilen; Link zu „Soll-Mengen & Saisonwechsel“.
8. **Soll-Mengen & Saisonwechsel:** Umschalter für die vier Jahreszeiten. Links Tabelle „Art · Passend · Soll (− / +) · Stand“ mit Stand „kein Soll“, „noch n fehlen“ oder „vollständig“. Rechts Saisonwechsel-Check mit Saisonbeginn („ab 1. Dezember · in 7 Wochen“), Summen „ist da / passt / fehlt“, Liste „Besorgen“ (Art + Anzahl) und Liste „Wird bald zu klein“.
9. **Aussortiert:** Liste mit Name, Kategorie, Größe bzw. Alter, Datum und Grund; „Zurückholen“ je Teil; „Aussortiert leeren“ mit Bestätigungsdialog (endgültig, nur über ein älteres Backup wiederherstellbar); leerer Zustand mit Hinweis.
10. **Einstellungen & Backup:** Name des Kindes mit Live-Vorschau der Begrüßung; Backup-Erinnerung (2 Wochen / 30 Tage / 60 Tage / Nie erinnern); Backup-Status (letztes Backup, fällig oder gesichert); „Backup exportieren“ (Teilen-Menü, JSON); „Backup einspielen“ mit Vorschau (Dateiname, Erstelldatum, Anzahl Teile, Aussortiert, Kosten, Marken), Warnung, dass alle aktuellen Daten ersetzt werden, und Bestätigung.

Backup: JSON-Export per Knopf (über das Teilen-Menü, Fallback Download), Import mit Vorschau und Rückfrage, Erinnerung nach 14 Tagen oder vielen Änderungen. Kein automatisches Backup, kein CSV-Export, kein CSV-Import.

Nicht in V1: Anlässe, Fotos, mehrere Kinder, Sync, Wetterdaten/Temperaturen, Größenwarnung, Wachstumsverlauf, „Heute anziehen“.

## Design

- Vorlage: Design-Canvas „Kindergarderobe“ (Tablet 1194 × 834, Smartphone 390 × 844). Farben und Schriften in `css/tokens.css`:
  Hintergrund `#F1F5F3`, Text `#1E2B2F`, gedämpft `#55636A`, Text auf Kachel `#3E4C52`, Primär `#1F6F8B`, Rahmen `#DCE5E1`, Karten weiß.
  Kategorie-Kacheln: Oberteile `#CFE3EA`, Unterteile `#D9EBDF`, Sets & Sonstiges `#F7E2B5`, Schuhe `#F2D6CF`, Mützen & Co. `#E2DCF0`, Spielzeug weiß mit Rahmen.
  Jahreszeiten-Farben siehe oben. Überschriften Fredoka 600, Text Nunito.
- Radien: Kacheln 28 px, Karten 24 px, Knöpfe und Eingaben rund (Höhe/2).
- Smartphone: Kacheln zweispaltig, Icon-Knöpfe für Kosten und Hinzufügen, Suche über volle Breite. Statistik, Aussortiert und Einstellungen müssen auch auf dem Smartphone erreichbar sein (z. B. über ein Menü), auch wenn die Canvas das noch nicht zeigt.
- Hinweis-Banner (Backup): Fläche `#FBEFD5`, Text `#6B4A0E`; Erfolg: Fläche `#DDEFE3`, Text `#2F6B45`.
- Touch: jedes Bedienelement mindestens 48 × 48 px, keine Funktion nur per Hover, keine Doppeltipps.
- Echte `<button>`, `<a>`, `<input>` mit `<label>`; `aria-label` an reinen Icon-Knöpfen; Kontrast mindestens 4,5:1.
- Oberflächentexte auf Deutsch, Code und Kommentare dürfen Englisch sein.
- Passform in der Oberfläche: „Passt gut“, „Bald zu klein“, „Zu klein“. Aussortieren ist eine eigene Aktion, keine Passform.

## Arbeitsweise

- Arbeite nur den Auftrag ab, den du bekommst. Neue Funktionen nicht eigenmächtig hinzufügen.
- Kleine, nachvollziehbare Commits mit deutschen Commit-Messages.
- Am Ende jedes Auftrags: kurze Zusammenfassung, was gebaut wurde, was offen ist und wie man es im Browser testet.
