# Auftrag 14 – Größe in Sets & Sonstiges optional + Größen-Treffer aus der Statistik

Stand: 25.11.2026

Lies zuerst `CLAUDE.md`, besonders „Nur Kleidung“ (Feld `groesse`), „Größensysteme“ (neu: Teile ohne Größe), Screen 5 „Teil hinzufügen / bearbeiten“, Screen 7 „Statistik“ und „Veröffentlichen“. Ändere `CLAUDE.md` nicht selbst; nötige Änderungen schlägst du in der Zusammenfassung vor.

## 1. Größe in „Sets & Sonstiges“ optional (Rückmeldung John)

Anlass: Für Teile wie Bettwäsche gibt es keine Konfektionsgröße. Bisher lässt sich so ein Teil in „Sets & Sonstiges“ nicht speichern, weil die Größe Pflicht ist.

- **Datenmodell (`js/model.js`):** In der Kategorie `sets_sonstiges` darf `groesse` bei Kleidung `null` sein. Ist eine Größe angegeben, wird sie wie bisher geprüft (System passend zu Kategorie und Art, Wertebereich, von ≤ bis). In allen anderen Kleidungs-Kategorien bleibt die Größe Pflicht. Die Regel steht als Konstante neben den Kategorien, damit sie leicht änderbar ist.
- **Backup:** Der Import nutzt `pruefeTeil` und nimmt solche Teile damit automatisch an. Schema-Version bleibt `1` (ältere Backups bleiben gültig).
- **Formular:** In „Sets & Sonstiges“ heißt das Feld „Größe (optional)“ – Hinweis im Stil von „Notiz (optional)“. Eine gewählte Größe lässt sich wieder abwählen: erneuter Tipp auf den gewählten Knopf entfernt sie (nur in dieser Kategorie). Wechselt die Kategorie von „Sets & Sonstiges“ in eine andere, ohne dass eine Größe gewählt ist, meldet das Feld beim Speichern wie bisher „Größe fehlt.“
- **Anzeige ohne Größe:** Karte ohne Größenangabe, Detail-Kachel Größe „–“, Tablet-Teileliste „ohne Größe“, Aussortiert-Liste und „Wird bald zu klein“ ohne Größe, Live-Vorschau im Formular ohne Größe. Prüfe alle Stellen, an denen `groesse` gelesen wird; nichts darf bei `null` abstürzen oder „Gr. “ ohne Wert zeigen.
- **Filter und Gruppen:** Bei gesetztem Größenfilter erscheinen Teile ohne Größe nicht. In Gruppenkarten (Auftrag 13) bekommen sie keinen Größen-Chip; die Stückzahl der Gruppe zählt sie mit.
- Statistik, Soll-Mengen und Saisonwechsel bleiben unverändert (Größe spielt dort keine Rolle bzw. zählt nur Konfektion).
- Jahreszeiten (mindestens eine) und Passform bleiben auch in „Sets & Sonstiges“ Pflicht.

## 2. Trefferansicht zu einem Größen-Balken (Fehler)

Befund: Das Größen-Diagramm zählt nur Konfektionsgrößen, die Trefferansicht `#/?groesse=56` (`teileZuStatistik`) prüft aber jedes Größensystem. Kopfumfänge 50 und 56 cm landen deshalb bei Konfektionsgröße 50 bzw. 56. Mit Testdaten: Balken „56“ = 17 Stück, Trefferansicht = 21 Treffer (4 Mützen zusätzlich).

- `teileZuStatistik` berücksichtigt bei `groesse` nur Teile im System `konfektion` – genau wie `zaehleJeGroesse`.
- Test: Für jede Größe im Diagramm ist die Stückzahl der Trefferansicht gleich dem Balkenwert (auch mit Doppelgrößen und mit Mützen, deren Kopfumfang einer Konfektionsgröße entspricht).

## 3. Sonstiges

- `VERSION` in `sw.js` hochzählen und `tests/sw-versionen.txt` ergänzen.
- Neue bzw. geänderte reine Funktionen mit `node --test` prüfen: Validierung (Sets & Sonstiges ohne Größe gültig, andere Kategorien ohne Größe ungültig, falsche Größe in Sets & Sonstiges weiterhin ungültig), Import eines Backups mit Teil ohne Größe, `groessenChips` mit Teilen ohne Größe, Filter mit Größenwahl, `teileZuStatistik`.

## Fertig, wenn

- ein Teil „Bettwäsche“ (Art über „Andere …“) in „Sets & Sonstiges“ ohne Größe gespeichert, bearbeitet, aussortiert, zurückgeholt, exportiert und wieder eingespielt werden kann,
- dasselbe Teil in „Oberteile“ ohne Größe nicht gespeichert werden kann (Meldung am Feld),
- eine gewählte Größe in „Sets & Sonstiges“ wieder abgewählt werden kann,
- die Trefferzahl zu jedem Größen-Balken der Balkenzahl entspricht,
- `node --test` und die Regression auf 390 × 844, 412 × 915 und 1194 × 834 grün sind (ohne waagerechtes Scrollen, Touch-Ziele ≥ 48 px, keine Konsolenfehler),
- `git status` vor dem Commit keine Screenshots, JSON- oder CSV-Dateien enthält.

Danach committen, pushen und zusammenfassen, inklusive „Selbst gestaltet – bitte prüfen“ (mindestens: Hinweis „(optional)“ am Größenfeld, Abwählen der Größe, Anzeige ohne Größe), einer Liste aller Entscheidungen, die du selbst treffen musstest, und Vorschlägen für `CLAUDE.md`.
