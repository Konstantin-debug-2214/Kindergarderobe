# Prüfbericht zu Auftrag 12 – Phase 1

Stand: 31.10.2026 · geprüft: alle Dateien unter `js/`, `css/`, `index.html`, `sw.js`, `manifest.webmanifest`, `tests/`, Repo und Git-Historie. Maßstab: CLAUDE.md (Stand nach Auftrag 11).

Phase 1: kein Code geändert, nichts committet. Die Prüfskripte liegen außerhalb des Repos.
Phase 2 (31.10.2026): alle freigegebenen Befunde behoben, Stand siehe Spalte „Status“ und Abschnitt „Phase 2“ unten.

## Befunde

Die Schwere richtet sich nach der Wirkung, wie im Auftrag festgelegt. Wo ein Fall selten ist, steht das in der Spalte „Problem“.

| Nr | Schwere | Datei:Zeile | Problem | So reproduzierbar | Vorschlag | Status |
|---|---|---|---|---|---|---|
| 1 | **kritisch** | `js/screens/teilFormular.js:422`, `:437`; `js/storage.js:462–470` | **Wechsel von „Sammelkauf“ auf „Einzelpreis“ überschreibt den ganzen Sammelkauf.** `preisEinzeln(…, entwurf.preis?.ausgabeId)` übernimmt die Id des Sammelkaufs; beim Speichern findet `verknuepfeEinzelpreis` diese Ausgabe und setzt Bezeichnung, Betrag und `anzahlTeile: 1`. Alle anderen Teile des Sammelkaufs hängen danach an einem „Einzelteil“, die Kostensumme stimmt nicht mehr. Passiert auch beim Anlegen, wenn man erst einen Sammelkauf wählt und dann umschaltet. | Kosten: Sammelkauf „Flohmarkt Kita, 25,00 € für 6 Teile“ anlegen, zwei Teilen zuordnen. Teil A → Bearbeiten → Preis „Einzelpreis“, 8,00 → Speichern. In Kosten heißt der Eintrag jetzt „Pulli A · 8,00 € · Einzelteil“; Teil B zeigt „… für 1 Teile“. (Prüfskript: vorher `2500 / 6`, nachher `800 / 1`.) | Beim Umschalten auf Einzelpreis nur dann eine `ausgabeId` mitnehmen, wenn der bisherige Preis schon ein Einzelpreis war. Zusätzlich in `verknuepfeEinzelpreis` nur eine Ausgabe mit `anzahlTeile: 1` wiederverwenden. Test ergänzen. | behoben (977d9f4) |
| 2 | **kritisch** | `js/storage.js:100–112`; `js/app.js:121–133` | **Beschädigte Daten sperren die App vollständig.** `lies()` wirft bei nicht lesbarem JSON; jeder Screen – auch Einstellungen – zeigt nur „Die Ansicht konnte nicht aufgebaut werden“. Damit ist auch „Backup einspielen“ unerreichbar, obwohl die Fehlerseite genau das empfiehlt. Die Rohdaten bleiben im Speicher, es wird nichts überschrieben. Selten (Browserfehler, Eingriff von außen). | DevTools → Anwendung → localStorage → `kindergarderobe` auf `{kaputt` setzen → neu laden → `#/einstellungen` öffnen. | Notfallansicht statt Fehlerseite: „Rohdaten herunterladen“ (zur Rettung) und „Backup einspielen“. Nie automatisch überschreiben. | behoben (198396f) |
| 3 | **kritisch** | `js/storage.js:60–71` | **Stiller Datenverlust, wenn localStorage nicht nutzbar ist.** Die App fällt dann ohne Hinweis auf einen Speicher im Arbeitsspeicher zurück; alles Eingegebene ist beim Schließen weg. Tritt z. B. auf, wenn Website-Daten in Chrome blockiert sind. Auf dem Zielgerät unwahrscheinlich. | Chrome → Website-Einstellungen → „Daten speichern“ für die Seite blockieren → Teil anlegen → App schließen und öffnen: Teil weg, nie ein Hinweis. | Rückfall beibehalten, aber im Hinweisband deutlich melden: „Auf diesem Gerät können keine Daten gespeichert werden.“ | behoben (6903ffb) |
| 4 | hoch | `js/storage.js:459`; `js/screens/teilFormular.js:418–425` | **Wechsel weg vom Einzelpreis lässt die Einzel-Ausgabe stehen.** „Einzelpreis → Sammelkauf“: Teil wird doppelt bezahlt (Prüfskript: 38 € und 4 Teile statt 30 € und 3 Teile). „Einzelpreis → Kein Preis“: 8 € zählen weiter, in Kosten bleibt ein Eintrag ohne Teil. | Teil mit Einzelpreis 8,00 anlegen → bearbeiten → Preis „Sammelkauf“ (Paket 30 € / 3 Teile) → Speichern → Kosten: 38,00 €, 4 Teile. | Beim Speichern die verknüpfte Einzel-Ausgabe löschen, wenn der Preis kein Einzelpreis mehr ist. **Annahme:** „Kein Preis“ heißt „war ein Versehen, Kosten weg“. Soll die Ausgabe stattdessen bleiben, bitte sagen. | behoben (795201b) |
| 5 | hoch | `js/screens/teilFormular.js:422`, `:437` | **Ungültiger oder leerer Betrag beim Einzelpreis wird stillschweigend zu 0,00 €.** `euroTextInCent(…) ?? 0`: ein Tippfehler wie „8,5o“ oder ein leeres Feld speichert 0 € und legt eine Ausgabe an, die als Teil zählt und den Durchschnitt drückt. Das Kosten-Formular meldet denselben Fehler dagegen. | Teil → Preis „Einzelpreis“ → „8,5o“ → Speichern → Detail zeigt „0,00 €“, Kosten zählt ein Teil zu 0 €. | Beim Speichern prüfen und am Feld „Bitte einen Betrag eintragen, z. B. 8,50“ melden, wie im Kosten-Formular. | behoben (c3f8658) |
| 6 | mittel | `js/storage.js:476`, `:279` | **Einzelpreis-Ausgaben bekommen das Datum in UTC.** `toISOString().slice(0, 10)`: zwischen 0 und 1 Uhr (Sommerzeit 2 Uhr) steht der Vortag; ein Preis am 1.1. um 0:30 zählt zum Vorjahr (Prüfskript: `2026-12-31`). Kosten-Formular und Ausgaben-Dialog rechnen richtig lokal. | Gerätezeit auf 1.1., 0:30 stellen → Teil mit Einzelpreis anlegen → Kosten zeigt den Eintrag im Vorjahr. | Das vorhandene `heuteAlsDatum()` (lokal) verwenden; Test mit fester Uhr. | behoben (71c44fe) |
| 7 | mittel | `js/screens/teil.js:56`; `kosten.js:295`; `kategorie.js:376`; `jahreszeit.js:120`; `statistik.js:137`; `aussortiert.js:120` | **Zurück-Knopf und Browser-Zurück führen an verschiedene Orte.** Der Knopf ist ein fester Link, die Geste geht zum Vorgänger. Gemessen (390 und 1194): Herbst → Detail → Knopf: Kategorie, Geste: Herbst. Mehr → Kosten → Knopf: Übersicht, Geste: Mehr. Statistik → Kategorie → Knopf: Übersicht, Geste: Statistik. Treffer → Detail ebenso. Nur Kategorie → Detail stimmt überein. Außerdem legt jeder Knopf-Tipp einen neuen Verlaufseintrag an. | Die genannten Wege einmal mit dem Knopf und einmal mit der Android-Zurück-Geste gehen. | Wie bei Soll-Mengen (`hatVorgaenger()`): mit Vorgänger `history.back()`, sonst das bisherige feste Ziel. **Entscheidung nötig**, weil sich das Verhalten ändert. | behoben (faab731, Nachtrag fdb1ed0) |
| 8 | mittel | `css/screens.css:858` (Kosten, Smartphone); `css/components.css:1797` | **Lange Wörter sprengen die Kosten-Liste auf dem Smartphone.** Bei einem Namen mit langem Wort wird die Seite 1419 px breit, die Beträge rutschen aus dem Bild, unten erscheint ein waagerechter Scrollbalken. Das Tablet ist nicht betroffen, alle anderen Screens halten. | Teil „Superlangerwintermantelmitkapuze…“ mit Einzelpreis anlegen → `#/kosten` bei 390 × 844. | Im Smartphone-Block `min-width: 0` an der Einträge-Karte bzw. am Flex-Kind; danach erneut messen. | behoben (849a480) |
| 9 | mittel | `js/backup.js:177–205` | **Import prüft nur die Teile.** `marken`, `sollMengen`, `einstellungen.name` und die einzelnen Ausgaben werden ungeprüft übernommen; doppelte Teil-Ids auch. Folgen: `marken` als Text → „Marke löschen“ wirft eine Ausnahme; `sollMengen` als Objekt → Saisonwechsel und Statistik brechen ab; Name als Objekt → „Hallo, [object Object]!“. Nur bei fremden oder bearbeiteten Dateien. | Backup-Datei von Hand ändern: `"marken": "Paw Patrol"` → einspielen → Formular → Marken bearbeiten → löschen. | Aufbau aller Listen prüfen (Arrays; Marken als Text; Soll-Einträge mit `art`, `jahreszeit`, ganzzahligem `soll`; Name als Text; eindeutige Ids) und sonst mit Meldung ablehnen. | behoben (f38df83) |
| 10 | mittel | `js/screens/teil.js:270`; `einstellungen.js:126`; `teilFormular.js:362`, `:379`, `:936` | **Ungeschützte Schreibzugriffe.** Passform im Detail, Name des Kindes, Marke anlegen/löschen und „Neuer Sammelkauf“ fangen `SpeicherFehler` nicht ab. Bei vollem Speicher bleibt die Änderung ungespeichert, ohne Meldung. Alle anderen Stellen melden den Fehler richtig. | Speicher füllen (Konsole: `localStorage.setItem('x', 'a'.repeat(5e6))` bis zum Fehler) → im Detail die Passform antippen → nichts passiert, keine Meldung. | Dieselbe `try/catch`-Meldung wie an den übrigen Stellen (`zeigeHinweis`). | behoben (571e172) |
| 11 | mittel | `js/screens/teilFormular.js:349`, `:378–380` | **Gelöschte Marken im Formular.** (a) Die Marke eines Teils, die aus der Liste gelöscht wurde, erscheint beim Bearbeiten nicht als gewählt; man sieht nicht, welche Marke gilt. (b) Löscht man die Marke beim Bearbeiten über „Marken bearbeiten“, entfernt das Formular sie vom Teil, und Speichern scheitert an „Bei Merkmal Marke muss eine Marke angegeben sein“. Widerspricht „Gelöschte Marken bleiben an bestehenden Teilen erhalten“. | Teil mit Marke „Paw Patrol“ → Bearbeiten → Marken bearbeiten → „Paw Patrol“ löschen → Speichern. | Die Marke des Teils immer als (gewählten) Knopf zeigen, auch wenn sie nicht mehr in der Liste steht; beim Löschen aus der Liste den Entwurf nicht ändern. | behoben (4f63bd7) |
| 12 | mittel | `sw.js:19` | **Updates hängen am Hochzählen von `VERSION`.** Ändert sich nur CSS oder JS und `VERSION` bleibt gleich, ist `sw.js` unverändert: Der Browser sieht keine neue Version, die installierte App bleibt wegen „Cache zuerst“ dauerhaft alt. CLAUDE.md beschreibt das, ein Test fängt es nicht ab. | Eine CSS-Farbe ändern, pushen, `VERSION` nicht ändern → die installierte App zeigt die alte Farbe, auch nach Neustart. | Test, der einen Fingerabdruck aller Dateien aus `DATEIEN` mit einem in `sw.js` vermerkten Wert vergleicht; dann schlägt `node --test` an, wenn das Hochzählen fehlt. | behoben (ef15ade) |
| 13 | mittel | `js/screens/teil.js:298`; `js/ui/felder.js:60` | **Notiz und Name des Kindes werden erst beim Verlassen des Feldes gespeichert.** Im Browser geprüft: Weiter-Navigieren und die Zurück-Geste speichern zuverlässig. Wird die Seite aber bei offenem Feld neu geladen oder die App geschlossen, ist der gerade getippte Text weg. | Detail → Notiz tippen, Tastatur offen lassen → App aus der Übersicht wischen → wieder öffnen: Notiz alt. | Zusätzlich bei `visibilitychange` (verborgen) bzw. `pagehide` speichern. Auf dem Gerät bestätigen. | behoben (7153ee5) |
| 14 | niedrig | `js/screens/kosten.js:312` | **Sammelkauf lässt sich auf 1 Teil oder auf weniger Teile ändern, als ihm zugeordnet sind.** Der Bearbeiten-Dialog setzt kein `minTeile`. Folgen: „… für 1 Teile“ in der Detailansicht, der Eintrag fehlt in der Sammelkauf-Auswahl des Formulars, „ca. x € / Teil“ ist zu hoch. | Kosten → Sammelkauf mit 3 zugeordneten Teilen → Anzahl Teile auf 1 → Speichern. | `minTeile` = max(2, Zahl der zugeordneten Teile); „1 Teil“ statt „1 Teile“. | behoben (4cc27bf) |
| 15 | niedrig | `js/costs.js:51–57` | **Betragseingabe nimmt Exoten an und lehnt Tausenderpunkte ab.** „1e3“ ergibt 1.000,00 €, „0x10“ ergibt 16,00 €; „1.234,56“ wird abgelehnt. | Kosten → Gesamtbetrag „1e3“ → Speichern. | Nur Ziffern mit höchstens einem Komma oder Punkt und zwei Nachkommastellen zulassen; Tausenderpunkt vor dem Komma entfernen. | behoben (bb8e857) |
| 16 | niedrig | `js/screens/platzhalter.js`; `css/screens.css:86–120`; `sw.js:53`; `js/costs.js:7`; `icons/.gitkeep` | **Toter Code und veraltete Texte.** `platzhalter.js` wird nirgends importiert (samt `.platzhalter`-CSS), steht aber im Cache des Service Workers. `costs.js` sagt „folgen in Auftrag 06“, `.gitkeep` „Hier liegen später die App-Icons“. | `grep -rn platzhalter js/` | Datei, CSS und Cache-Eintrag entfernen (dann `VERSION` hochzählen), Kommentare anpassen, `.gitkeep` löschen. | behoben (3cb9893) |
| 17 | niedrig | `README.md:173` | **README „Stand“ endet bei Auftrag 10**; Auftrag 11 (Zahnrad, Schaukelpferd) fehlt. | – | Eine Zeile zu Auftrag 11 ergänzen. | behoben (06b24da) |
| 18 | niedrig | `CLAUDE.md:15` | **Widerspruch in CLAUDE.md:** „Layout für Tablet quer (Hauptziel)“, während Zeile 6 das Smartphone zum Hauptgerät erklärt. | – | Vorschlag für die zentrale Pflege: „Layout für Smartphone hoch (Hauptgerät) und Tablet quer“. Ich ändere CLAUDE.md nicht. | behoben (0fcb501, CLAUDE.md) |
| 19 | niedrig | `css/components.css:99`, `:694`, `:721` | **Schwächere Fokus-Anzeige** in Suchfeld, Betragsfeld und Notizfeld: nur ein 1-px-Rahmenwechsel statt des 3-px-Rings der übrigen Elemente. Für Tastatur sichtbar, aber schwach; bei Touch-Bedienung kaum relevant. | Mit der Tab-Taste ins Suchfeld. | `:focus-within`/`:focus-visible` mit demselben 3-px-Ring wie die übrigen Felder. | behoben (e46e28c) |
| 20 | niedrig | `css/tokens.css:37` | **Rahmenfarbe `#DCE5E1` hat auf Weiß nur 1,29:1.** Eingabefelder und weiße Knöpfe heben sich kaum ab (für Bedienelement-Konturen gelten üblicherweise 3:1). **Vorgabe aus dem Design**, deshalb nur zur Kenntnis. | – | Im Design entscheiden; ich ändere die Farbe nicht eigenmächtig. | behoben (248119f) |
| 21 | niedrig | `js/screens/teilFormular.js:110–125` | **Bearbeiten-Route bei Sonderfällen.** `#/teil/<aussortiert>/bearbeiten` öffnet das Formular für ein aussortiertes Teil (das Detail zeigt dafür einen Hinweis). Die Seite „Dieses Teil gibt es nicht (mehr)“ beim Bearbeiten hat keine Überschrift (`h1`). | Adresse von Hand eingeben. | Wie im Detail den Hinweis „Dieses Teil ist aussortiert“ zeigen; Überschrift ergänzen. | behoben (3112355) |
| 22 | niedrig | `js/backup.js:139` | `URL.revokeObjectURL` direkt nach `link.click()` kann in manchen Browsern den Download abbrechen. Betrifft nur den Rückfall ohne Teilen-Menü; Chrome ist unkritisch. | – | Freigeben mit kurzer Verzögerung (`setTimeout`). | behoben (56144f2) |

## Ergebnis der vorhandenen Tests

`node --test`: **213 Tests, 213 bestanden, 0 fehlgeschlagen** (12 Testdateien, Dauer ~1–3 s).

Zusätzlich liefen zwei eigene Prüfskripte außerhalb des Repos: eines für die reine Logik (42 Fälle; daraus Befunde 1, 4, 5, 6, 9, 15) und eines im Browser bei 390 × 844 und 1194 × 834 (Router, XSS, Zurück, Leiste, Beschriftungen, lange Namen, leere Zustände, beschädigter Speicher; daraus Befunde 2, 7, 8, 21). Befund 13 stammt aus einem Tipp-Test über das DevTools-Protokoll.

## Geprüft und unauffällig

**Technik und Repo**
- Kein Framework, keine Bibliothek; zur Laufzeit kein Netzwerkzugriff. Der einzige `fetch` steht im Service Worker und gilt nur Dateien derselben Herkunft. Schriften über `@font-face` aus `fonts/`.
- `localStorage` ausschließlich in `js/storage.js`; `navigator.storage.persist()` beim Start (`app.js:62–69`).
- `git ls-files`: keine JSON-, CSV- oder Screenshot-Dateien. Einzige Ausnahmen, beide gewollt: `manifest.webmanifest` und die drei App-Icons `icons/*.png`. Die Icons enthalten nur einen Herkunftsnachweis (C2PA, „Claude provided this file…“), keine persönlichen Daten. Test-Fixtures als Dateien gibt es nicht; die Tests erzeugen ihre Daten selbst.
- **Git-Historie** (54 Commits, nur `main`): nie eine JSON-, CSV- oder Screenshot-Datei hinzugefügt.
- `.gitignore` deckt `*.json`, `*.csv` und `Design-Preview-Screenshots/` ab (mit `git check-ignore` geprüft).
- OFL-Lizenzen beider Schriften liegen bei.
- Alle Pfade relativ, auch in Manifest und `sw.js`. Unter einem Unterordner `/Kindergarderobe/` in Auftrag 10 getestet: installierbar und offline.

**Sicherheit**
- Kein `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval` oder `new Function` im Code. Text kommt nur über `textContent`, Attribute über `setAttribute`, Links sind Hash-Routen mit `encodeURIComponent`.
- Im Browser geprüft: `<img src=x onerror=…>` als Name, Art, Marke, Notiz, freies Merkmal, Bezeichnung einer Ausgabe, Soll-Art und Name des Kindes, auf 12 Screens plus Suche und Aussortiert: nie ausgeführt, nie ein Element erzeugt, überall als Text sichtbar.
- Importierte Backups laufen durch dieselbe Darstellung und sind damit gleich abgesichert.

**Datenmodell und Validierung**
- Pflichtfelder, `anzahl` als ganze Zahl ≥ 1, `groesse.von ≤ bis`, bekannte Kategorie, Jahreszeit und Passform werden geprüft.
- Spielzeug hat nie Größe, Jahreszeiten oder Passform. `teilAusEntwurf` entfernt sie, beim Bearbeiten ist der Typ gesperrt. Die Lücke von `Object.assign` in `teilAendern` greift deshalb nicht.
- Marke nur bei Merkmal „Marke“: Das Formular setzt sie sonst auf `null`. Gelöschte Marken bleiben an bestehenden Teilen (Ausnahme im Formular: Befund 11).
- `geaendertAm` wird bei jeder Änderung gesetzt. `aussortiertAm` und `aussortiertGrund` werden beim Aussortieren gesetzt und beim Zurückholen auf `null` zurückgesetzt.

**Zählregeln**
- Überall nach `anzahl`, nie nach Einträgen; Aussortiertes zählt nirgends (`imSchrank`).
- Jahreszeiten-Zahlen und -Filter nur für Kleidung.
- Soll-Mengen zählen als „passend“ nur „Passt gut“; „ist da“ = Passt gut + Bald zu klein, beides nur über Arten mit Soll.
- Statistik: Mehrfachzugehörigkeit bei Jahreszeiten mit Hinweis; Doppelgrößen bei jeder enthaltenen Größe.
- Kosten aussortierter und endgültig gelöschter Teile bleiben in der Summe.

**Datum und Jahreszeiten**
- Jahreszeit für alle 12 Monate und an allen Grenzen (28.2./1.3., 31.5./1.6., 31.8./1.9., 30.11./1.12.) richtig.
- Saisonhinweis über den Jahreswechsel richtig (15.12., 31.12., 1.1.), ebenso im Schaltjahr am 29.2.2028 („Winter · läuft · noch 1 Tag“) und über die Zeitumstellung (65 Tage vom 28.3. bis 1.6.).
- Kosten-Formular und Ausgaben-Dialog nehmen das lokale Datum; jede Ausgabe zählt im Jahr ihres Datums (Ausnahme: Befund 6).
- Hinweis: Die Datumsanzeige in Kosten liest „JJJJ-MM-TT“ als UTC und zeigt es lokal. In Deutschland stimmt das; westlich von UTC würde es einen Tag früher zeigen.

**Kosten**
- Durchgehend ganze Cent; Ergebnis von „0,1 + 0,2“: 10 + 20 Cent, kein Gleitkommafehler.
- `formatEuro` ergibt „8,00 €“ bzw. „1.234,56 €“; Eingabe mit Komma wird umgerechnet.
- „ca. x € / Teil“ und Durchschnitt kaufmännisch gerundet (25 € / 6 = 4,17 €).
- Keine Division durch null: 0 Teile ergibt Durchschnitt 0; ein Sammelkauf mit `anzahlTeile` 0 zählt als ein Teil.
- Ein Einzelpreis legt genau eine Ausgabe an; eine Preisänderung aktualisiert dieselbe Ausgabe. Ausnahmen beim Wechsel der Preisart: Befunde 1 und 4.

**Backup**
- Export setzt `aenderungenSeitBackup` erst nach Erfolg zurück; ein abgebrochenes Teilen-Menü (`AbortError`) ändert nichts.
- Import lehnt mit verständlicher deutscher Meldung ab: leere Datei, kaputtes JSON, fremde Datei, fehlende oder neuere Version, fehlende Teile, fehlerhafte Teile (bis zu fünf Einzelheiten). Die aktuellen Daten bleiben dabei unangetastet.
- Die Vorschau zählt nach Stück; ersetzt wird erst nach Bestätigung, das Einspielen selbst ist mit `try/catch` abgesichert.
- **Erinnerung:** Der Banner erscheint genau bei `aenderungenSeitBackup > 0` und bleibt nach „Ausblenden“ weg, bis der Zähler den gemerkten Stand übersteigt (`backup.js:35–39`), auch über Neuladen hinweg.
- **„Erinnern nach“ ist nicht umgesetzt:** Es gibt keine Einstellung und kein Zeitintervall, wie in CLAUDE.md festgelegt. Daran habe ich nichts geändert.
- Speicher voll: `SpeicherFehler` mit verständlicher Meldung, die bisherigen Daten bleiben vollständig erhalten (Ausnahmen ohne Meldung: Befund 10).

**Router und Zustände**
- Unbekannte Routen, `#/kategorie/falsch` und `#/jahreszeit/falsch` führen zur Übersicht.
- `#/teil/<unbekannt>` zeigt „Dieses Teil gibt es nicht (mehr)“ mit „Zur Übersicht“; `#/teil/<aussortiert>` zeigt „Dieses Teil ist aussortiert“ mit Weg zum Papierkorb.
- Trefferansicht mit unbekannter Art oder Größe „abc“: kein Fehler.
- Leere Zustände auf allen Screens bei 390 und 1194 ohne Fehler und ohne Konsolenmeldung.
- Event-Listener: Globale Listener werden genau einmal angemeldet. Screens bauen ihr DOM neu, alte Listener verschwinden mit den Elementen. `nachOben.js` meldet seine Bereiche ab, Dialoge entfernen sich selbst.
- Nach-oben-Knopf: in Auftrag 09b/10 auf allen langen Screens bei 390, 412 und 1194 geprüft; liegt über Leiste und Aktionsleiste und verdeckt nichts.

**Oberfläche und Barrierefreiheit**
- Leiste nur auf Übersicht, Statistik, Aussortiert und Einstellungen; der aktive Eintrag ist markiert.
- Farbregel eingehalten. Keiner der „Bekannten Fehler im Design“ wurde übernommen: Karten und Icons in Kategoriefarbe, Vorschau in Kategoriefarbe, nur fünf Kategorien im Kleidungsformular, kein Spielzeug im Jahreszeiten-Filter, Soll-Umschalter in Akzentfarbe, Merkmal-Kachel im Detail, kein „Erinnern nach“.
- Jeder Knopf und Link hat einen zugänglichen Namen, jedes Feld ein Label, keine Funktion nur per Hover (auf 10 Screens im Browser gezählt).
- Fokus-Ring 3 px über `:focus-visible` (Ausnahmen: Befund 19).
- Touch-Ziele ≥ 48 px auf allen 12 Routen bei 390, 412 und 1194 (Messung aus Auftrag 10).
- Alle Textkontraste ≥ 4,5:1; am knappsten: gedämpfter Text auf der Schuh-Kachel und der Herbst-Fläche mit je 4,53:1.
- Lange Namen ohne Leerzeichen halten in Kategorie, Detail, Jahreszeit und Formular (Ausnahme: Kosten auf dem Smartphone, Befund 8).
- Icons aus Auftrag 11: ein Strichstil, Inline-SVG, keine Emojis.

**Offline und PWA**
- Manifest gültig (keine Fehler in den Entwicklertools), Browser meldet die App als installierbar, alle Icons vorhanden.
- `sw.js` cacht alle Dateien aus `css/`, `js/`, `fonts/`, `icons/` (Test `pwa.test.js`); offline laufen alle 12 Routen.
- Update-Weg v2 → v3 im Browser geprüft: Band „Neue Version verfügbar“, „Neu laden“, alter Cache gelöscht (Voraussetzung: Befund 12).

**Code-Qualität**
- Keine `console.log`-Ausgaben, kein auskommentierter Code.
- Reine Module ohne DOM: `filters.js`, `costs.js`, `model.js`, `saison.js`, `formular.js`. `router.js` und `backup.js` greifen nur in Start- bzw. Export-Funktion auf den Browser zu, die geprüfte Logik ist DOM-frei.
- Ordnerstruktur in README und CLAUDE.md passt (Ausnahmen: Befunde 16–18).

## Ohne echtes Gerät nicht prüfbar – bitte auf Tablet und Smartphone testen

1. **Teilen-Menü beim Export (Android):** Wird „Backup gesichert“ erst nach einem echten Ziel gemeldet? Bricht man z. B. das Hochladen in Drive *nach* der Zielwahl ab, meldet Chrome das der App nicht. Die App hält das Backup dann für erledigt.
2. **Dateiauswahl beim Import:** Ist die `.json`-Datei aus Messenger, Drive oder „Downloads“ auswählbar? Manche Quellen liefern einen anderen Dateityp.
3. **Notiz bei geschlossener App (Befund 13):** Notiz tippen, Tastatur offen lassen, App aus der Übersicht wischen. Ist der Text danach weg?
4. **Zurück-Geste (Befund 7):** Welches Verhalten fühlt sich richtig an, das des Knopfs oder das der Geste?
5. **Gestenleiste im Vollbild:** Liegen Leiste, Aktionsleiste und Nach-oben-Knopf frei?
6. **Website-Daten blockiert (Befund 3):** Nur zur Bestätigung, nicht nötig, wenn nie etwas blockiert wurde.
7. **Echte Bedienung mit dem Finger:** Treffsicherheit der kleineren Ziele (Chip-Kreuz, Zähler − / +), Tastatur verdeckt keine Felder.
8. **Update auf dem installierten Gerät:** Nach dem nächsten Push mit neuer `VERSION` erscheint das Band nach dem Öffnen.

## Phase 2 – Behebung

Freigegeben waren alle Befunde außer #18 und #20. Behoben in der Reihenfolge kritisch → niedrig, ein Commit je Befund.

**Entscheidungen von John, so umgesetzt:**
- #4: Einzelpreis → „Kein Preis“ oder Sammelkauf löscht die eigene Einzel-Ausgabe; Sammelkauf → „Kein Preis“ oder Einzelpreis löst nur die Verknüpfung, der Sammelkauf bleibt. Ein Einzelpreis legt immer eine eigene Ausgabe an (#1).
- #7: Der Zurück-Knopf geht zur vorherigen Seite wie die Zurück-Geste; ohne vorherige Seite in der App zur Elternseite (Detail → Kategorie, Soll-Mengen → Statistik, sonst Übersicht), nie aus der App heraus.
- #2: Beschädigte Daten werden nie überschrieben; der Rohinhalt wird gesichert, „Backup einspielen“ bleibt auf jeder Route erreichbar.

**Nachtrag zu #7:** Mit dem ersten Fix ging auch Aussortieren „zur vorherigen Seite“. Auftrag 05 legt aber die Kategorie-Ansicht fest; das habe ich in der Regression bemerkt und mit fdb1ed0 wiederhergestellt – ohne dass das aussortierte Teil als Verlaufseintrag stehen bleibt.

**Folgen von #7, die zum Befund gehören:** Speichern (neues Teil), Abbrechen, Blättern ‹ › und der Wechsel in der Teileliste des Tablets legen keine Verlaufseinträge mehr an. Sonst hätte „Zurück“ ins Formular oder Teil für Teil rückwärts geführt.

**Tests:** von 213 auf 264. Neu oder erweitert: `tests/preise.test.js` (#1, #4), `tests/formular.test.js` (#5, #11), `tests/storage.test.js` (#2, #3, #6), `tests/costs.test.js` (#6, #14, #15), `tests/backup.test.js` (#9), `tests/router.test.js` (#7), `tests/version.test.js` mit `tests/fingerabdruck.js` und `tests/sw-versionen.txt` (#12). Jeder dieser Tests schlug am Code vor dem Fix fehl.

**VERSION:** von v2 auf v11. Ab #12 zählt jeder Commit mit geänderten App-Dateien hoch, sonst wird `node --test` rot.

**Regression:** alle früheren Browser-Prüfungen (Aufträge 02–11) auf 390 × 844, 412 × 915 und 1194 × 834 grün, bis auf eine alte Erwartung in der Formular-Prüfung („Verwerfen führt zurück zum Detail“). Sie öffnete das Formular per direktem Adresswechsel von der Übersicht aus; mit #7 führt Verwerfen dorthin zurück, woher man kam. Auf dem echten Weg (Detail → Bearbeiten → Verwerfen) landet man im Detail – eigens geprüft.
