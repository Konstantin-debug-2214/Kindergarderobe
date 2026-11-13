# Auftrag 13 – Teile nach Art zusammenfassen + Trefferzahl hervorheben

Stand: 11.11.2026

Lies zuerst `CLAUDE.md`, besonders „Suche, Filter, Sortierung“ (neu: „Zusammenfassen nach Art“ und „Zählzeile“), „Farbregel für Teile“ und „Veröffentlichen“. Ändere `CLAUDE.md` nicht selbst; nötige Änderungen schlägst du in der Zusammenfassung vor.

Anlass: Rückmeldungen aus der Testphase. Mit über 300 echten Einträgen sind die Kartenlisten unübersichtlich (z. B. drei einzelne Badehosen in verschiedenen Größen), und die Trefferzahl wird auf dem Smartphone übersehen.

## 1. Zusammenfassen nach Art

- Reine Funktion in `js/filters.js`: gruppiert eine (bereits gefilterte) Teileliste nach **Kategorie + Art**. Je Gruppe: Art, Kategorie, Stückzahl (Summe `anzahl`), Liste der vorhandenen Größen (aufsteigend, Doppelgrößen wie „98/104“ als eigener Eintrag) mit der jeweils besten Passform. Spielzeug: „ab n J.“-Werte statt Größen. Gruppen alphabetisch nach Art.
- **Gruppenkarte** im Stil der vorhandenen Karten, in der **Kategoriefarbe**: Kategorie-Icon, Art als Name, „n Teile“, darunter die Größen als Chips. Chips mit „Passt gut“ hervorgehoben, „Bald zu klein“ mit kleinem Hinweis, „Zu klein“ blass. Viele Größen umbrechen in mehrere Zeilen. *(nicht im Design)*
- Eine Art mit nur **einem** Eintrag erscheint als normale Einzelkarte.
- **Gilt in:** Trefferansicht der Übersicht (Suche und `#/?art=…` / `#/?groesse=…`), Kategorie-Ansicht, „Nach Jahreszeit“. Alle Filter und die Suche wirken vor dem Gruppieren; die Zählzeile bleibt die Stückzahl aller Ergebnisse.
- **Tipp auf eine Gruppe** → Kategorie-Ansicht dieser Kategorie mit vorgesetztem Art-Filter, Einzelansicht und – falls aus „Nach Jahreszeit“ kommend – vorgesetztem Jahreszeit-Filter (z. B. `#/kategorie/unterteile?art=Badehose&ansicht=einzeln`). „Zurück“ führt zur vorherigen gruppierten Ansicht.
- Gehören **alle Ergebnisse zu einer einzigen Art**, wird direkt einzeln angezeigt.
- **Umschalter** „Zusammengefasst / Einzeln“ (zwei Segmente wie der Umschalter Kleidung/Spielzeug) über der Kartenliste in allen drei Ansichten. Standard „Zusammengefasst“; die Wahl wird im Oberflächen-Zustand `kindergarderobe-oberflaeche` gemerkt (keine Datenänderung, nicht im Backup). Ein `?ansicht=`-Parameter in der Adresse hat Vorrang.

## 2. Zählzeile hervorheben

- **Trefferansicht:** Überschrift „175 Treffer“ (bzw. „1 Treffer“) in der Überschriftenschrift statt „Treffer“ plus kleinem grauem „175 Teile gefunden“. Auf dem Smartphone steht sie direkt unter dem Suchfeld.
- **Kategorie-Ansicht:** „x von y Teilen“ und **Nach Jahreszeit:** „n Teile für [Jahreszeit]“ ebenso deutlich – größer, in Textfarbe statt gedämpft.
- Zahlen bleiben Stückzahlen (Zählregeln unverändert).

## 3. Sonstiges

- `VERSION` in `sw.js` hochzählen.
- Neue reine Funktionen mit `node --test` prüfen (Gruppieren, Größen-Chips, Passform je Größe, Sonderfälle: eine Gruppe, ein Eintrag, Spielzeug, Doppelgrößen).

## Fertig, wenn

- die Suche nach „Hose“ Gruppenkarten zeigt (u. a. eine Karte „Badehose“ mit allen Größen) und die Trefferzahl groß in der Überschrift steht,
- Tipp auf eine Gruppe die richtigen Einzelteile zeigt und „Zurück“ zur Gruppenansicht führt,
- der Umschalter in allen drei Ansichten funktioniert und die Wahl nach Neustart erhalten bleibt,
- alle Karten die Kategoriefarbe tragen,
- `node --test` und die Regression auf 390 × 844, 412 × 915 und 1194 × 834 grün sind (ohne waagerechtes Scrollen, Touch-Ziele ≥ 48 px, keine Konsolenfehler),
- `git status` vor dem Commit keine Screenshots, JSON- oder CSV-Dateien enthält.

Danach committen, pushen und zusammenfassen, inklusive „Selbst gestaltet – bitte prüfen“ (mindestens: Gruppenkarte, Größen-Chips mit Passform, Umschalter, neue Zählzeile), einer Liste aller Entscheidungen, die du selbst treffen musstest, und Vorschlägen für `CLAUDE.md`.
