# Kindergarderobe

Inventar-App für die Kleidung und das Spielzeug eines Kindes. Sie zeigt auf einen
Blick, was da ist, was passt, was fehlt und was es gekostet hat. Schwerpunkt sind
Kategorien, Jahreszeiten und Filter.

Die App ist für den Eigenbedarf gedacht. Hauptgerät ist ein Tablet im Querformat
(1194 × 834); auf dem Smartphone (390 × 844) ist sie ebenso bedienbar.

## Technik

Reines HTML, CSS und JavaScript (ES-Module) – kein Framework, keine Bibliothek,
kein Build-Schritt. Zur Laufzeit gibt es keine Netzwerkzugriffe: die Schriften
(Fredoka, Nunito) liegen lokal unter `fonts/`, Icons sind Inline-SVG. Die Daten
liegen später im `localStorage` des Browsers.

## Lokal starten

ES-Module laden nicht über `file://`. Die `index.html` lässt sich deshalb nicht
per Doppelklick öffnen – es braucht einen kleinen lokalen Server:

**Mit VS Code (empfohlen)**

1. Erweiterung **Live Server** (Ritwick Dey) installieren.
2. Im Projektordner mit der rechten Maustaste auf `index.html` klicken.
3. **Open with Live Server** wählen. Der Browser öffnet z. B.
   `http://127.0.0.1:5500/index.html`.

**Ohne VS Code**

Im Projektordner ein Terminal öffnen und einen der Befehle ausführen:

```
python -m http.server 8000
```

```
npx serve .
```

Danach `http://localhost:8000` im Browser aufrufen.

**Tablet und Smartphone prüfen**

In den Entwicklertools des Browsers (F12) die Gerätesimulation einschalten
(Strg + Umschalt + M) und als eigene Größen `1194 × 834` (Tablet quer) und
`390 × 844` (Smartphone) eintragen.

## Veröffentlichung über GitHub Pages

Die App wird direkt aus dem `main`-Branch veröffentlicht, ein Build-Schritt ist
nicht nötig:

1. Im Repository auf **Settings → Pages** gehen.
2. Unter **Build and deployment** als Source **Deploy from a branch** wählen.
3. Branch `main` und Ordner `/ (root)` auswählen, dann **Save**.
4. Nach ein bis zwei Minuten ist die App unter
   `https://<benutzername>.github.io/<repository>/` erreichbar.

Jeder Push auf `main` aktualisiert die veröffentlichte Version.

## Hinweis zum Datenschutz

Das Repository ist öffentlich. Es gehören **niemals** echte Daten hinein:
keine Backups (`*.json`), keine CSV-Dateien. Die `.gitignore` schließt diese
Dateitypen aus. Ausgenommen ist das spätere `manifest.webmanifest`, das nicht
auf `.json` endet.

## Tests

Die reine Logik (Datenmodell, Speicher, Backup, Kosten) ist mit dem in Node
eingebauten Testrunner geprüft – ohne npm-Pakete. Im Projektordner:

```
node --test
```

## Ordnerstruktur

```
index.html
css/      tokens.css, base.css, components.css, screens.css
js/       app.js, router.js, model.js, storage.js, backup.js, costs.js,
          filters.js, formular.js, saison.js, screens/*.js, ui/*.js
tests/    Tests der reinen Logik (node --test)
fonts/    Fredoka und Nunito (woff2) samt OFL-Lizenz
icons/    App-Icons für das spätere Manifest
```

Alle Daten liegen unter einem Schlüssel im `localStorage` des Browsers. Darauf
greift ausschließlich `js/storage.js` zu. Geldbeträge sind durchgehend ganze
Zahlen in Cent (8,00 € wird als `800` gespeichert), damit beim Rechnen keine
Fließkomma-Fehler entstehen.

## Stand

- **Auftrag 01 – Grundgerüst:** Ordnerstruktur, Design-Tokens, Hash-Router und
  Navigation.
- **Auftrag 02 – Daten, Speicher, Backup:** Datenmodell mit Validierung,
  Speicher, Backup (Export über das Teilen-Menü, Import mit Vorschau und
  Rückfrage), Erinnerung an fällige Backups, Einstellungen-Screen und
  Begrüßung auf der Übersicht.
- **Auftrag 03 – Teil hinzufügen / bearbeiten:** gemeinsames Formular für
  Kleidung und Spielzeug mit Live-Vorschau in der Kategorie-Farbe, eigener Art
  und Größe, Markenliste, Anzahl, Einzelpreis und Sammelkauf.
- **Auftrag 04 – Übersicht und Kategorie-Ansicht:** Kategorie- und
  Jahreszeiten-Kacheln mit Stückzahlen, Suche über alle Teile, Kategorie-Ansicht
  mit Karten, Filterspalte (Tablet) bzw. Filterblatt (Smartphone).
- **Auftrag 05 – Nach Jahreszeit, Detail, Aussortiert:** Jahreszeiten-Ansicht
  mit Kategorie-Filter, Detailansicht mit Passform und Notiz zum sofortigen
  Speichern, Aussortieren mit Grund, Papierkorb mit Zurückholen und Leeren.
- **Auftrag 06 – Kosten:** Summe, Teile und Durchschnitt je Jahr mit
  Jahr-Umschalter, Kosten hinzufügen, Einträge mit Preis pro Teil bei
  Sammelkäufen, Bearbeiten und Löschen.
- **Auftrag 07 – Statistik:** fünf Diagramm-Karten (Kategorie, Art der
  Kleidung, Jahreszeit, Größe, Spielzeug nach Art), selbst gebaut aus HTML
  und CSS; jeder Balken führt zu den Teilen.
- **Auftrag 08 – Soll-Mengen & Saisonwechsel:** Soll je Art und Jahreszeit,
  Saisonwechsel-Check mit „ist da / passt / fehlt", Besorgen-Liste zum
  Abhaken und „Wird bald zu klein".

Damit sind alle Screens aus Version 1 gebaut. Offen: `manifest.webmanifest`
und Service Worker für den Betrieb vom Startbildschirm.
