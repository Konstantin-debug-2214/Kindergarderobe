# Auftrag 01 – Grundgerüst

Stand: 13.10.2026

Lies zuerst `CLAUDE.md` im Projektordner vollständig. Die Design-Screenshots liegen in `Claude-Code-Uebergabe/`. Bei Widersprüchen gilt `CLAUDE.md`.

Baue das Grundgerüst der App. Noch keine fachlichen Funktionen.

1. **Struktur und Git-Regeln:** Lege die Ordnerstruktur aus `CLAUDE.md` an. Erstelle **als Erstes** eine `.gitignore` mit mindestens:
   ```
   *.json
   *.csv
   Claude-Code-Uebergabe/*.png
   Claude-Code-Uebergabe/*.jpg
   .DS_Store
   Thumbs.db
   ```
   Das Manifest heißt später `manifest.webmanifest` und ist davon nicht betroffen. Die vorhandene `README.md` ergänzt du um Zweck, lokales Starten und GitHub Pages.
2. **`index.html`** mit `lang="de"`, Viewport `width=device-width, initial-scale=1`, lädt `css/*.css` und `js/app.js` als Modul.
3. **`css/tokens.css`** mit allen Farben (allgemein, Kategorien, Jahreszeiten Akzent + Fläche, Banner), Schriften und Radien aus `CLAUDE.md` als CSS-Variablen. Die Abstände leitest du als Skala aus den Screenshots ab. Schriften Fredoka (500/600) und Nunito (400/600/700/800) als woff2 nach `fonts/` legen (inkl. OFL-Lizenzdatei) und per `@font-face` einbinden.
4. **`js/router.js`:** Hash-Router für alle Routen aus der Tabelle in `CLAUDE.md`, einschließlich `#/teil/:id/bearbeiten` und `#/saisonwechsel`. Unbekannte Routen führen zur Übersicht. Jede Route zeigt vorerst einen Platzhalter-Screen mit Titel.
5. **`js/app.js`:** startet den Router und ruft `navigator.storage.persist()` auf.
6. **Navigation genau nach dem Abschnitt „Navigation“ in `CLAUDE.md`:**
   - Tablet: Übersicht-Platzhalter mit den Kopf-Knöpfen (Suche nur als Feld ohne Funktion, Kosten, Statistik, Aussortiert, Einstellungen, Teil hinzufügen). Alle anderen Platzhalter mit rundem Zurück-Knopf, „Teil hinzufügen“ mit Schließen-Knopf.
   - Smartphone: untere Leiste Start · Statistik · + · Aussortiert · Mehr, nur auf den in `CLAUDE.md` genannten Screens; aktiver Eintrag hervorgehoben. Übersicht mit „€“-Knopf zu Kosten. „Mehr“ öffnet Einstellungen mit Einträgen zu Kosten und Soll-Mengen & Saisonwechsel.
   - Damit alle Routen erreichbar sind: Der Übersicht-Platzhalter bekommt einfache Testlinks zu je einer Kategorie, einer Jahreszeit und einem Teil (Beispiel-ID); der Detail-Platzhalter einen Link zu „Bearbeiten“; der Statistik-Platzhalter einen Link zu „Soll-Mengen & Saisonwechsel“. Diese Testlinks werden in späteren Aufträgen durch die echten Kacheln ersetzt.
   - Alle Touch-Ziele mindestens 48 × 48 px, Icon-Knöpfe mit `aria-label`.
7. **Grundlayout responsive:** Tablet quer (1194 × 834) als Hauptziel, Smartphone hoch (390 × 844) mit eigenem Breakpoint (Wert in der Zusammenfassung nennen). Die Platzhalter müssen in beiden Größen ohne waagerechtes Scrollen funktionieren.

Lokal testen: Weil ES-Module über `file://` nicht laden, beschreibe in der README einen einfachen lokalen Server (z. B. die VS-Code-Erweiterung „Live Server“).

**Fertig, wenn:**
- alle Routen per Tipp erreichbar sind, auch in der Gerätesimulation der Browser-Entwicklertools für Tablet (1194 × 834) und Smartphone (390 × 844),
- die Smartphone-Leiste nur auf den vorgesehenen Screens erscheint,
- Schriften ohne Internet laden,
- die Browser-Konsole keine Fehler zeigt,
- `git status` vor dem Commit keine Screenshots, JSON- oder CSV-Dateien enthält.

Danach committen und kurz zusammenfassen, inklusive Abschnitt „Selbst gestaltet – bitte prüfen“ (z. B. Abstands-Skala, Breakpoint, Platzhalter-Gestaltung).
