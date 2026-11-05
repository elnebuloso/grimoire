# grimoire: UX-Audit und UI-Zielbild

| | |
|---|---|
| Stand | 2026-11-05, Version 1.9.0 |
| Status | Angenommen am 2026-11-05 |
| Grundlage | Funktionsinventar aus dem Code, 59 Screenshots (`screenshots/`), eigene Bedienung der Agent-Umgebung als anonymer Besucher, Nutzer ohne Rolle, Admin und neuer SSO-Nutzer |
| Umfang | Struktur, Navigation, Seitentypen, Interaktionsmuster, Komponenten. Kein visuelles Redesign: Tokens, Farben und Typografie bleiben, wie sie sind. |

Kennzeichnung im Text:
- **[Annahme]**: von mir gesetzt, nicht durch Code oder Bedienung belegt.
- **On**: Frage an den Owner; alle sind in Kapitel 17 gesammelt und entschieden.
- **Un**: Usability-Befund aus Kapitel 3.
- **Mn**: Maßnahme aus Kapitel 15.

---

## Teil I: Bestandsaufnahme (Phase 1)

## 1. Zusammenfassung der Analyse

grimoire hat eine knappe, ehrliche Oberfläche. Die Texte benennen Konsequenzen präzise: Slug-Wechsel, Sichtbarkeit, Export, einmalig gezeigte Geheimnisse. Formulare behalten ihre Eingaben und markieren das fehlerhafte Feld. Das bleibt erhalten.

Die Schwächen liegen in der Struktur, nicht in einzelnen Seiten:

1. **Drei Bereiche ohne gemeinsamen Rahmen.** Startseite, Account und Management sind lose gekoppelt. Die Management-Navigation verlinkt Account-Seiten, die diese Navigation dann nicht zeigen. Nutzer ohne Rolle haben gar keine Navigation, nur zwei Elemente im Header.
2. **Das Management wächst in die Breite.** Neun Menüpunkte stehen in einer Reihe, Qualitätslisten und Administration gemischt. Die Quellen, der Kern des Produkts, haben keinen eigenen Menüpunkt.
3. **Die Quellen-Detailseite trägt alles.** Status, Historie, Seiten, Vorschau, Einstellungen, Slug und Löschen stehen auf einer Seite, die mit der Vorschau rund 6000 px lang wird.
4. **Rückmeldung und Absicherung folgen keiner Regel.** Manche Aktionen melden Erfolg, andere nicht. Manche fragen nach, andere nicht. Der Wechsel einer Quelle auf `public` läuft ohne Rückfrage, die Admin-Rolle wird ohne Rückfrage vergeben.
5. **Zwei Stellen führen in die Irre.** „Test connection“ meldet Erfolg bei einem Pfad, den es nicht gibt (U2). Ein SSO-Nutzer ohne Passwort kommt ohne Mailserver nie zu einem zweiten Login-Weg (U1).

Das Zielbild in Teil II ordnet die App in drei Bereiche mit je eigenem Layout unter einem gemeinsamen Rahmen. Das Management bekommt eine Sidebar mit Gruppen, die Quellen eine Liste und eine Detailansicht mit Unterseiten. Bestätigung und Rückmeldung werden zu festen Mustern. Teil III ordnet das in 19 Maßnahmen, die nacheinander auf dem Branch `redesign` umgesetzt und am Ende gemeinsam ausgeliefert werden.

## 2. Übersicht der bestehenden Anwendungsstruktur

### 2.1 Rollen

| Rolle | Wer | Landet nach dem Login auf |
|---|---|---|
| anonym | jeder Besucher | – |
| Nutzer ohne Rolle | eingeladene oder per SSO angelegte Accounts | `/` |
| Admin | Accounts mit der Rolle `admin` (der einzigen Rolle) | `/manage` |

### 2.2 Ist-Sitemap

```
/                               Start: Quellentabelle, „Try a query“, „Connect an agent“    alle
├── /login                      Login mit Passwort und SSO-Buttons                           anonym
│   ├── /login/forgot           Reset-Link anfordern (nur mit SMTP, sonst 404)               anonym
│   └── /login/reset/[token]    Neues Passwort setzen (nur mit SMTP)                         anonym
├── /setup                      Ersten Admin anlegen ODER Export importieren                 nur ohne Admin
├── /invite/[token]             Einladung annehmen (Passwort oder SSO)                       alle
├── /auth/oidc/[key]/callback   Zwischenseite nach SSO, Weiterleitung per meta refresh        alle
├── /account                    Passwort ändern, Identitäten verknüpfen/lösen                eingeloggt
│   └── /account/api-keys       Eigene Keys: anlegen, ändern, widerrufen                     eingeloggt
└── /manage                     Dashboard: Needs attention, Kennzahlen, Quellentabelle      Admin
    ├── /manage/sources/new     Quelle anlegen (Pseudo-ID der Detailroute)                   Admin
    ├── /manage/sources/[id]    Status, Historie, Seiten, Vorschau, Einstellungen, Slug,     Admin
    │                           Löschen – alles auf einer Seite
    ├── /manage/missed-queries  Suchen ohne Treffer                                          Admin
    ├── /manage/dead-links      Tote Links je Quelle                                         Admin
    ├── /manage/users           Nutzer, offene Einladungen, Einladen                         Admin
    ├── /manage/api-keys        Alle Keys, nur Widerrufen                                    Admin
    ├── /manage/duplicates      Doppelte und überlappende Quellen                            Admin
    └── /manage/settings        Alle Syncs pausieren, Instanz-Export                         Admin
```

Endpunkte ohne eigene Oberfläche, die unverändert bleiben: `/mcp`, `/query`, `/sources`, `/sources/[source]`, `/sources/[source]/llms.txt`, `/p/[source]/[...page]`, `/instructions` (Agent-Schnittstelle); `/language`, `/theme`, `/logout`, `/auth/oidc/[key]`, `/account/link`, `/account/unlink`, `/manage/settings/export`, `/manage/sources/[id]/sync-pending` (Formularziele und Polling).

### 2.3 Navigation heute

| Ort | Anonym | Nutzer ohne Rolle | Admin |
|---|---|---|---|
| Header | Logo, „Log in“, Sprache, Theme | Logo, „Logged in as <E-Mail>“ (Link zu `/account`), „My API keys“, „Log out“, Sprache, Theme | wie Nutzer, aber „Manage“ statt „My API keys“ |
| Unternavigation | – | – | nur unter `/manage`: Overview, Queries without results, Dead links, Users, All API keys, Duplicate sources, Settings, abgesetzt My API keys, Account |
| Footer | Version mit Release Notes, GitHub, Handbuch | gleich | gleich |

Screenshots: `anon-home.png`, `user-account.png`, `admin-manage.png`, `mobile-admin-manage.png`.

### 2.4 Funktionen je Seite (Prüfliste)

Diese Liste ist die Prüfliste für Kapitel 6.3: Jede Zeile muss im Zielbild einen Ort haben.

| # | Funktion | Ort heute | Rolle | Rückmeldung heute | Absicherung heute |
|---|---|---|---|---|---|
| F1 | Quellen mit Kennzahlen und Status ansehen | `/` | alle (anonym nur `public`) | – | – |
| F2 | Suche ausprobieren („Try a query“) | `/` | alle | Antwort als Markdown-Block | – |
| F3 | MCP-Befehl kopieren („Connect an agent“) | `/` | alle | „Copied“ | – |
| F4 | Sprache und Theme wählen | Header | alle | Seite lädt neu | – |
| F5 | Login mit Passwort | `/login` | anonym | Fehler im Formular | Rate-Limit |
| F6 | Login mit SSO | `/login`, `/invite/[token]` | anonym | Zwischenseite | – |
| F7 | Reset-Link anfordern | `/login/forgot` | anonym | „sent“-Hinweis, immer gleich | Rate-Limit |
| F8 | Passwort per Link setzen | `/login/reset/[token]` | anonym | Hinweis und Login-Link | Link 1 h gültig |
| F9 | Ersten Admin anlegen | `/setup` | ohne Admin | Weiterleitung `/manage` | Setup-Token |
| F10 | Export importieren | `/setup` | ohne Admin | Weiterleitung `/login?imported` | Setup-Token, Passphrase |
| F11 | Einladung annehmen | `/invite/[token]` | alle | Weiterleitung `/` | Link 7 Tage, einmalig |
| F12 | Abmelden | Header | eingeloggt | Weiterleitung `/login` | – |
| F13 | Passwort ändern | `/account` | eingeloggt | „changed“-Hinweis | aktuelles Passwort |
| F14 | SSO-Identität verknüpfen | `/account` | eingeloggt mit Passwort | „linked“-Hinweis | Passwort |
| F15 | Eigene SSO-Identität lösen | `/account` | eingeloggt | „unlinked“-Hinweis | keine Rückfrage; Schutz des letzten Login-Wegs |
| F16 | Eigenen Key anlegen (Name, Quellen, Ablauf) | `/account/api-keys` | eingeloggt | Key einmalig gezeigt | – |
| F17 | Eigenen Key ändern (Quellen, Ablauf) | `/account/api-keys` | eingeloggt | „updated“-Hinweis | – |
| F18 | Eigenen Key widerrufen | `/account/api-keys` | eingeloggt | keine | `confirm()` |
| F19 | Anfragen pro Tag eines Keys sehen | `/account/api-keys`, `/manage/api-keys` | eingeloggt / Admin | – | – |
| F20 | Probleme sehen („Needs attention“) | `/manage` | Admin | – | – |
| F21 | Kennzahlen der Instanz | `/manage` | Admin | – | – |
| F22 | Quellen auflisten | `/manage` | Admin | – | – |
| F23 | Quelle anlegen | `/manage/sources/new` | Admin | Weiterleitung, keine Meldung | – |
| F24 | Verbindung testen | Quelle neu / bearbeiten | Admin | „Reachable“ oder Fehler | – |
| F25 | Quelle bearbeiten | `/manage/sources/[id]` | Admin | keine Meldung, nur „sync queued“ | Rückfrage nur bei Überlappung |
| F26 | Sync anstoßen und verfolgen | `/manage/sources/[id]` | Admin | „queued or running“, Polling | – |
| F27 | Status, Fehler, Warnungen einer Quelle | `/manage/sources/[id]` | Admin | – | – |
| F28 | Sync-Historie | `/manage/sources/[id]` | Admin | – | – |
| F29 | Seiten einer Quelle filtern, Vorschau der Snippets | `/manage/sources/[id]` | Admin | – | – |
| F30 | Slug ändern | `/manage/sources/[id]` | Admin | „Slug changed“ | alten Slug abtippen |
| F31 | Quelle löschen | `/manage/sources/[id]` | Admin | keine | `confirm()` |
| F32 | Tote Links je Quelle | `/manage/dead-links`, Quelle | Admin | – | – |
| F33 | Doppelte und überlappende Quellen | `/manage/duplicates` | Admin | – | – |
| F34 | Suchen ohne Treffer, erneut ausprobieren | `/manage/missed-queries` | Admin | – | – |
| F35 | Nutzer auflisten mit Rolle und Login-Wegen | `/manage/users` | Admin | – | – |
| F36 | Nutzer einladen | `/manage/users` | Admin | Mail-Hinweis oder Link einmalig | – |
| F37 | Einladung erneut senden | `/manage/users` | Admin | wie F36 | keine Rückfrage, alter Link wird ungültig |
| F38 | Einladung zurückziehen | `/manage/users` | Admin | keine | `confirm()` |
| F39 | Admin-Rolle vergeben | `/manage/users` | Admin | keine | keine |
| F40 | Admin-Rolle entziehen | `/manage/users` | Admin | keine; Fehler beim letzten Admin | `confirm()` |
| F41 | SSO-Identität eines Nutzers lösen | `/manage/users` | Admin | keine | `confirm()` |
| F42 | Nutzer löschen | `/manage/users` | Admin | keine | `confirm()`; nicht sich selbst, nicht den letzten Admin |
| F43 | Alle Keys sehen und widerrufen | `/manage/api-keys` | Admin | keine | `confirm()` |
| F44 | Alle Syncs pausieren | `/manage/settings` | Admin | „Settings saved“ | – |
| F45 | Instanz exportieren | `/manage/settings` | Admin | Download; Fehler per Redirect | Passphrase doppelt |
| F46 | Zwischen den Bereichen wechseln | Header, Manage-Navigation | eingeloggt | – | – |
| F47 | Mails: Einladung, Reset-Link | Server | – | – | – |

### 2.5 Komponenten heute

21 Komponenten in `app/src/lib/components/`, jede mit Stories, ohne Kategorie im Storybook-Titel:

`ChoiceField`, `ConfirmForm`, `CopyButton`, `DateTime`, `DeadLinkList`, `DescriptionList`, `FormError`, `NameField`, `PageHead`, `PageList`, `ProviderButtons`, `QueryForm`, `RequestsPerDay`, `SegmentedSwitch`, `ShownOnce`, `SlugChangeForm`, `SourceStatsTable`, `TableScroll`, `TextAreaField`, `TextField`.

Wiederholte Muster, die heute keine Komponente sind:

| Muster | Vorkommen |
|---|---|
| Datentabelle mit `<thead>` in `TableScroll` | Users (2×), alle Keys, Duplikate, Suchen ohne Treffer, Sync-Historie |
| Erfolgshinweis `p.notice[role=status]` | 8 Seiten |
| Fehler-Alert `p.notice.alert` statt `FormError` | Invite, Reset, Users, Quelle |
| `aria-invalid`-Helfer (`marked`, `invalid`) | 7 Seiten, jeweils kopiert |
| Passwortfeld mit `MIN_LENGTH = 12` | Setup, Invite, Account; Reset mit hart kodiertem `minlength` |
| Anzeige der Quellen eines Keys | eigene Keys und alle Keys, identisch |
| Statuswörter einer Quelle | `SourceStatsTable` und Sync-Historie |
| Layoutklassen `.pair`, `.split`, `.actions`, `.expired` | je zwei Seiten |

### 2.6 Mails

Zwei Mails, Einladung und Reset-Link. Reiner Text ohne HTML. Der Text kommt aus den Messages (`mail_invite_*`, `mail_reset_*` in `app/messages/<locale>.json`), der Code setzt nur Name, E-Mail und Link ein. Die Mail erscheint in der Sprache dessen, der sie auslöst: Ein Admin mit deutschem UI verschickt eine deutsche Einladung, egal an wen (selbst geprüft, `mail-invite.png`, `mail-reset.png`).

## 3. Identifizierte Usability-Probleme

Schwere: **kritisch** (Nutzer kommt nicht weiter oder richtet ungewollt Schaden an), **hoch**, **mittel**, **niedrig**.

### 3.1 Übergreifend

| # | Befund | Ort | Schwere | Beleg |
|---|---|---|---|---|
| U1 | **Kreis ohne Ausgang für SSO-Nutzer ohne Passwort.** Ohne Mailserver gibt es keinen Weg zum Passwort. Ohne Passwort lässt sich kein zweiter Anbieter verknüpfen und der eine nicht lösen. Der Text verweist an den Admin, der Admin hat dafür keine Funktion; eine Einladung an die Adresse lehnt die App ab. Mit Mailserver führt „Set a password“ auf `/login/forgot`, das eingeloggte Nutzer wegleitet. | `/account` | kritisch | selbst bedient |
| U4 | **Keine Rückmeldung nach Speichern, Löschen, Widerrufen, Zurückziehen, Rolle vergeben.** Andere Aktionen melden sich („Settings saved“, „Slug changed“). Nach dem Speichern einer Quelle steht nur „sync queued“, auch wenn sich nur die Beschreibung geändert hat. | Quelle, Keys, Nutzer | hoch | selbst, `admin-after-source-delete.png` |
| U5 | **Bestätigungen ohne Regel.** „Make admin“ und „Send again“ ohne Rückfrage, „Remove admin role“ mit. Eigene Identität lösen ohne, beim Admin mit. Der Wechsel auf `public` ohne, der Slug-Wechsel mit Abtippen. Rückfragen sind native `confirm()`-Dialoge ohne Gestaltung und ohne Konsequenztext im Seitenstil. | Nutzer, Account, Quelle | hoch (Sichtbarkeit), mittel (Rest) | selbst, Inventar |
| U6 | **Account-Seiten verlieren die Management-Navigation.** „My API keys“ und „Account“ stehen in der Manage-Navigation, die Seiten zeigen sie nicht. Zurück führt nur „Manage“ im Header, immer auf das Dashboard. | `/account*` als Admin | mittel | `admin-own-keys.png` |
| U7 | **Nutzer ohne Rolle haben keine Navigation.** Ihre drei Aufgaben (Key anlegen, Agent verbinden, Account pflegen) liegen auf drei Seiten, verbunden nur über einen Header-Button und die als Link gestaltete E-Mail-Adresse. | Header | mittel | `user-*.png` |
| U12 | **Flache Admin-Navigation.** Neun Punkte in einer Reihe, Häufiges neben Seltenem. Die Quellen haben keinen Menüpunkt, ihre Detailseiten markieren „Overview“. Mobil drei Zeilen. | `/manage/*` | mittel | `admin-manage.png`, `mobile-admin-manage.png` |
| U13 | **Quellen heißen mal Slug, mal Name.** Dashboard-Hinweise, tote Links und Duplikate nennen den Slug, Tabellen und Titel den Namen. | Management | niedrig | Screenshots |
| U26 | **Mobil verschwinden Status und Aktionen.** Tabellen zeigen nur die ersten drei Spalten, Status und letzter Sync liegen rechts außerhalb. Header vier Zeilen, Management-Navigation drei. | alle Tabellen | niedrig | `mobile-*.png` |
| U27 | **Begriffe im Deutschen uneinheitlich.** „User“ neben „Quellen“, „gesynct“ neben „synct“; Sync-Fehler bleiben englisch. | `de.json` | niedrig | `admin-manage-de.png` |
| U29 | **Mails in der Sprache des Absenders.** Der Empfänger bekommt die Sprache, die der einladende Admin gerade eingestellt hat. | Mails | niedrig | selbst geprüft |

### 3.2 Startseite und Anmeldung

| # | Befund | Ort | Schwere | Beleg |
|---|---|---|---|---|
| U14 | **Startseite ist für Eingeloggte eine Sackgasse.** Keine Quelle verlinkt, weder auf Inhalte noch für Admins auf die Verwaltung. Eingeloggte sehen dieselbe Seite wie Besucher. | `/` | mittel | `admin-home.png` |
| U15 | **Interner Status für alle sichtbar.** Nutzer ohne Rolle sehen „failed“ in Rot und „paused“ bei internen Quellen; bei einer öffentlichen, fehlgeschlagenen Quelle auch Besucher. | `/` | niedrig | `user-home.png` |
| U16 | **Antwort von „Try a query“ ist roher Markdown.** Monospace-Block, harte Umbrüche, rund 2600 px. Der Nulltreffer-Hinweis nennt `index` mit Backticks, ohne Link. | `/` | niedrig | `anon-home-query.png` |
| W2 | **Key und Verbindungsbefehl auf zwei Seiten.** Nach dem Anlegen steht der Key auf `/account/api-keys`, der Befehl mit Platzhalter `<key>` auf `/`. | `/account/api-keys`, `/` | mittel | selbst |
| U23 | **Fehlerseiten ohne passenden Ausweg.** 403 und 404 bieten nur „To the start page“. Ein ungültiger Einladungslink zeigt noch den Lead „Choose a password …“, ohne Link zu Login oder Start. `/login` sagt nicht, wie man zu einem Account kommt. | Fehlerseiten, `/invite` | niedrig | `anon-invite-invalid.png`, `user-manage.png` |

### 3.3 Account

| # | Befund | Ort | Schwere | Beleg |
|---|---|---|---|---|
| U20 | **Key-Formular unter der Liste, Ergebnis darüber.** Nach dem Anlegen bleibt die URL `?/create`, ein Reload würde einen zweiten Key anlegen [gefolgert]. Das Aufklappen heißt „Change <Name>“ und liest sich wie „Nutzer wechseln“. | `/account/api-keys` | niedrig | `user-api-keys-created.png` |

### 3.4 Management

| # | Befund | Ort | Schwere | Beleg |
|---|---|---|---|---|
| U2 | **„Test connection“ meldet Erfolg bei falschem Pfad.** Der Test prüft Zugang und Branch, nicht den Pfad. Der häufigste Fehler (das Fixture zeigt ihn) fällt erst nach dem Speichern auf. Im neuen Formular ist der Pfad mit `docs` vorbelegt. | Quelle neu / bearbeiten | kritisch | selbst |
| U3 | **„Test connection“ verlangt erst einen Namen.** Der Browser blockiert wegen des Pflichtfelds Name. | `/manage/sources/new` | niedrig | `admin-source-new-test.png` |
| U8 | **Quellen-Detailseite überladen.** Alles auf einer Seite; mit Vorschau 5949 px; Slug und Löschen rutschen ans Ende. Die Historie selbst ist begrenzt: Checks ohne Änderung und gleiche Fehler werden zu einer Zeile mit Zähler zusammengefasst, gespeichert werden die letzten 100 Einträge; nur „Sync now“ erzeugt jedes Mal eine neue Zeile, weil es neu indexiert. | `/manage/sources/[id]` | hoch | `admin-source-preview.png`, `admin-source-after-sync.png` |
| U9 | **Widersprüchlicher Status.** Für eine nie erfolgreiche Quelle zeigt die Tabelle eine Sync-Zeit, die Detailseite „never“; die Historie einen Commit, der Status „none“. | Tabelle gegenüber Detail | mittel | `admin-manage.png`, `admin-source-failed.png` |
| U10 | **Behebungshinweis steht am falschen Ort.** Das Dashboard erklärt den Sync-Fehler, die Detailseite, auf der man korrigiert, zeigt nur den rohen Fehler. | Quelle | mittel | `admin-source-failed.png` |
| U11 | **Duplikate fehlen in „Needs attention“** und auf der Detailseite; man findet sie nur über ihren eigenen Menüpunkt. | `/manage` | mittel | `admin-duplicates.png` |
| U17 | **„Queries without results“ zählt die eigene Testsuche nicht.** Ein Admin, der die Funktion ausprobiert, hält sie für kaputt. | `/manage/missed-queries` | niedrig | selbst |
| U18 | **Tote Links ohne Weg zur Korrektur.** Kein Link zur Datei im Repository, keiner zur Vorschau der Seite. Die Liste steht doppelt: eigene Seite und Detailseite. | `/manage/dead-links` | niedrig | `admin-dead-links.png` |
| U19 | **Zwei Key-Listen mit unterschiedlichem Umfang.** Die Admin-Liste zeigt kein Ablaufdatum, keinen Status „expired“, keinen Link zum Nutzer. Bei Nutzern sieht man ihre Keys nicht. | `/manage/api-keys` | mittel | `admin-api-keys.png` |
| U21 | **Nutzerliste ohne Suche und Detail.** Aktionen nicht nach Tragweite gestuft („Remove admin role“ rot neben anderen), „Remove“ neben einer Identität ohne Hinweis auf die Folge, Einladen unter beiden Tabellen. | `/manage/users` | mittel | `admin-users.png` |
| U22 | **„Send again“ ohne Mailserver macht den verschickten Link ungültig,** ohne dass das Label es sagt. | `/manage/users` | mittel | `admin-users-invited.png` |
| U24 | **Langes Quellenformular ohne Gliederung.** 13 Felder untereinander; Zugang (URL, Branch, Username, Token) nicht gruppiert; Username und Token ohne Erklärung; Cron als Rohsyntax. | Quelle | mittel | `admin-source-new.png` |
| U25 | **Import und Export weit auseinander.** Der Export nennt den Import, aber das laufende System zeigt keinen Weg dorthin. „Settings“ hat einen Schalter und den Export. | `/manage/settings`, `/setup` | niedrig | `admin-settings.png` |
| U28 | **Zwei Pause-Schalter mit fast gleichem Namen** an zwei Orten: global und je Quelle. | Einstellungen, Quelle | niedrig | Screenshots |

### 3.5 Stärken, die erhalten bleiben

- Konsequenztexte, die genau sagen, was passiert (Slug, Sichtbarkeit, Export, Passwortwechsel).
- `ShownOnce` für Keys und Einladungslinks: gleiche Darstellung, klarer Satz, Kopierknopf.
- „Needs attention“ mit einem Behebungshinweis je Fehlerart.
- Schutz vor Selbstaussperrung: letzter Admin, letzter Login-Weg.
- „Try a query“ zeigt genau die Antwort eines Agenten. Als Debug-Werkzeug ehrlich.
- Formularfehler behalten Eingaben, markieren das Feld, nennen den Grund.
- Beide Sprachen vollständig, Dark Mode mit guten Kontrasten.
- Ruhige Hierarchie aus Sheet, Überschrift, Lead.

## 4. Empfohlene Verbesserungen (Überblick)

| Problem | Empfehlung | Maßnahme |
|---|---|---|
| U1 | Admin kann für einen Nutzer einen Link „Passwort setzen“ erzeugen, wie bei Einladungen: per Mail oder einmalig angezeigt. „Set a password“ für Eingeloggte führt auf eine eigene Account-Funktion statt auf `/login/forgot`. (O1, entschieden) | M2 |
| U2, U3, U24 | Verbindungstest prüft auch den Pfad; braucht keinen Namen; Formular gruppiert; Pfad nicht vorbelegt. (O2, entschieden) | M3, M10 |
| U4, U5 | Zwei feste Muster: jede ändernde Aktion endet mit einer Statusmeldung; Rückfragen in drei Stufen über einen eigenen Dialog. | M1, M4 |
| U6, U7, U12 | Gemeinsamer Rahmen mit Bereichswechsel; Account und Management je mit eigener Navigation; Management mit Sidebar und Gruppen. | M5–M8 |
| U8, U9, U10, U11 | Quellen bekommen Liste und Detailansicht mit Unterseiten; Status aus einer Quelle; Hinweise dort, wo man handelt. | M6, M9, M12, M13 |
| U19, U21, U22, W2 | Key- und Nutzerlisten als einheitliche Datentabellen; Querverweise; Ergebnis nach Key-Erstellung mit fertigem Befehl. | M11, M14, M15 |
| U14, U15, U16, U23 | Startseite unterscheidet Besucher und Eingeloggte; Status für Nicht-Admins vereinfacht; Fehlerseiten mit passendem Ausweg. | M16, M17 |
| U13, U26, U27 | Einheitliche Benennung, mobile Tabellen, Begriffsliste. U29 bleibt bewusst, wie es ist (O7). | M11, M18 |

---

## Teil II: Zielbild und Architektur (Phase 2)

## 5. Zukünftige Informationsarchitektur

### 5.1 Grundsätze

1. **Drei Bereiche, ein Rahmen.** Startseite (öffentlich), Account (jeder Eingeloggte), Management (Admins). Jeder Bereich hat sein Layout. Ein gemeinsamer Rahmen zeigt, wo man ist, und wechselt zwischen den Bereichen.
2. **Ein Ding, ein Ort.** Jede Funktion hat genau eine Heimat. Wo sie an zweiter Stelle gebraucht wird, steht dort ein Verweis oder eine gefilterte Ansicht derselben Komponente, keine zweite Umsetzung.
3. **Objekte vor Werkzeugen.** Im Management sind Quellen, Nutzer und Keys Objekte mit Liste und Detail. Qualitätslisten (tote Links, Duplikate, Suchen ohne Treffer) sind Sichten über diese Objekte und verlinken auf sie.
4. **Hilfe dort, wo man handelt.** Ein Hinweis, wie man ein Problem behebt, steht an der Stelle, an der man es behebt. Das Dashboard verweist dorthin.
5. **URLs bleiben,** wo es keinen Grund zur Änderung gibt. Handbuch, Lesezeichen und Mails verweisen auf sie.

### 5.2 Bereiche und Rollen

| Bereich | Wer | Zweck | Layout |
|---|---|---|---|
| Startseite | alle | Was grimoire hier anbietet, Agent verbinden, Suche ausprobieren | Öffentliches Layout, eine Spalte |
| Anmeldung (Teil der Startseite) | anonym, Einladung, Setup | Eine einzelne Aufgabe: hineinkommen | Auth-Layout: schmale Karte, kein Bereichswechsel |
| Account | jeder Eingeloggte, Admin gleich wie Nutzer | Eigene Keys, eigene Anmeldung | Account-Layout: Seitenrahmen mit kurzer Unternavigation |
| Management | Admins | Quellen, Qualität, Zugang, System | Management-Layout: Sidebar mit Gruppen |

**Entscheidung zur Anmeldung:** Login, Passwort vergessen, Reset, Einladung, Setup und SSO-Zwischenseite bekommen ein eigenes Auth-Layout und gehören keinem der drei Bereiche an. Grund: Sie sind Durchgangsseiten mit genau einer Aufgabe; ein Bereichswechsel ergibt dort keinen Sinn, weil der Besucher noch nicht angemeldet ist. Heute laufen sie schon in einer schmalen Spalte; das Zielbild macht daraus einen Seitentyp.

### 5.3 Gemeinsamer Rahmen

Der Rahmen ist auf jeder Seite außer den Auth-Seiten gleich und trägt:

- **Produktmarke**, verlinkt auf die Startseite.
- **Bereichswechsel**: „Start“, „Account“ (eingeloggt), „Management“ (nur Admin). Der aktive Bereich ist markiert. Das ersetzt den Header-Button „Manage“ / „My API keys“ und die Konto-Links in der Management-Navigation.
- **Benutzermenü** (eingeloggt): E-Mail-Adresse als Überschrift, „Abmelden“. Anonym steht an dieser Stelle „Anmelden“.
- **Sprache und Theme**: im Benutzermenü bzw. für anonyme Besucher im Footer. [Annahme] Beide werden selten umgeschaltet und brauchen keinen Platz im Header; das spart mobil drei Zeilen (U26).
- **Footer**: Version, Release Notes, GitHub, Handbuch, wie heute.

Wechselt ein Admin aus dem Management in den Account und zurück, landet er auf der zuletzt geöffneten Management-Seite. [Annahme] Das lässt sich ohne Server-Zustand über den Verlauf lösen; einfacher ist, immer auf die Management-Übersicht zu führen. Die Umsetzung entscheidet.

## 6. Vollständige Ziel-Sitemap

### 6.1 Baum

```
Gemeinsamer Rahmen: Bereichswechsel · Benutzermenü · Footer

STARTSEITE (öffentliches Layout)
/                                   Start
                                    ├─ Quellen (Katalog)
                                    ├─ Agent verbinden
                                    └─ Suche ausprobieren
Fehlerseiten 403 / 404 / 500

ANMELDUNG (Auth-Layout)
/login                              Anmelden: Passwort, SSO
/login/forgot                       Reset-Link anfordern                                     nur mit SMTP
/login/reset/[token]                Neues Passwort setzen
/invite/[token]                     Einladung annehmen
/setup                              Erster Admin oder Import                                 nur ohne Admin
/auth/oidc/[key]/callback           Weiterleitung nach SSO

ACCOUNT (Account-Layout, Unternavigation: API-Keys · Anmeldung)
/account/api-keys                   API-Keys: Liste
  ├─ Dialog „Neuer Key“             Name, Quellen, Ablauf
  ├─ Ergebnis „Key erstellt“        Key einmalig + fertiger Verbindungsbefehl
  └─ Dialog „Key ändern“            Quellen, Ablauf
/account                            Anmeldung: Passwort, verknüpfte Anbieter

MANAGEMENT (Management-Layout, Sidebar)
/manage                             Übersicht: Handlungsbedarf, Kennzahlen
── Inhalte
/manage/sources                     Quellen: Liste                                           NEU als eigene Seite
/manage/sources/new                 Neue Quelle: Formular
/manage/sources/[id]                Quelle · Status          (Unterseite, Standard)
/manage/sources/[id]/pages          Quelle · Seiten, mit Vorschau ?preview=
/manage/sources/[id]/history        Quelle · Verlauf
/manage/sources/[id]/settings       Quelle · Einstellungen, darunter „Gefahrenzone“: Slug, Löschen
── Qualität
/manage/dead-links                  Tote Links
/manage/duplicates                  Doppelte Quellen
/manage/missed-queries              Suchen ohne Treffer
── Zugang
/manage/users                       Nutzer (Tab) · Einladungen (Tab)
  └─ Dialog „Nutzer einladen“
/manage/api-keys                    Alle API-Keys
── System
/manage/settings                    Einstellungen: Syncs, Datensicherung (Export, Hinweis auf Import)
```

Unverändert ohne Oberfläche: die Agent-Schnittstelle und die Formularziele aus 2.2.

### 6.2 Was sich gegenüber heute ändert

| Änderung | Art | Grund |
|---|---|---|
| `/manage/sources` als eigene Listenseite | neu | Quellen sind der Kern und brauchen einen Menüpunkt (U12). Die Übersicht zeigt nur noch Handlungsbedarf und Kennzahlen. |
| Quelle in vier Unterseiten | aufgeteilt | U8. Jede Unterseite hat eine Aufgabe; Deep Links aus dem Dashboard zeigen auf die passende Unterseite statt auf einen Anker. |
| `#settings` und `#status` | ersetzt | durch `/settings` und die Standard-Unterseite. Alte Anker leiten weiter. |
| „My API keys“ und „Account“ aus der Management-Navigation | entfernt | Sie gehören zum Account-Bereich, erreichbar über den Bereichswechsel (U6). |
| Account mit Unternavigation | neu | Nutzer ohne Rolle bekommen eine Klammer um ihre Aufgaben (U7). |
| Users: Nutzer und Einladungen als Tabs, Einladen als Dialog | umgebaut | U21. Einladen ist die häufigste Aktion und steht künftig oben als Primäraktion. |
| Datensicherung in den Einstellungen mit Hinweis auf den Import | ergänzt | U25. Kein Import im laufenden System (der Import setzt eine leere Instanz voraus), aber ein Satz, wo er stattfindet. |
| Auth-Layout | neu als Seitentyp | 5.2 |

Keine bestehende Seite entfällt. `/manage` ändert seinen Inhalt (ohne Quellentabelle), behält aber die URL.

### 6.3 Gegenprüfung: jede Funktion hat einen Ort

| Funktion | Ziel |
|---|---|
| F1 Quellen ansehen | Start · Quellen; Admin zusätzlich Management · Quellen |
| F2 Suche ausprobieren | Start · Suche ausprobieren; aus „Suchen ohne Treffer“ verlinkt |
| F3 Befehl kopieren | Start · Agent verbinden; zusätzlich im Ergebnis „Key erstellt“ mit eingesetztem Key |
| F4 Sprache, Theme | Benutzermenü bzw. Footer |
| F5, F6 Login | `/login` (Auth-Layout) |
| F7, F8 Passwort zurücksetzen | `/login/forgot`, `/login/reset/[token]` |
| F9, F10 Setup, Import | `/setup` |
| F11 Einladung annehmen | `/invite/[token]` |
| F12 Abmelden | Benutzermenü |
| F13 Passwort ändern | Account · Anmeldung |
| F14, F15 Anbieter verknüpfen, lösen | Account · Anmeldung |
| F16–F19 eigene Keys | Account · API-Keys |
| F20, F21 Handlungsbedarf, Kennzahlen | Management · Übersicht |
| F22 Quellen auflisten | Management · Quellen |
| F23, F24 Quelle anlegen, Verbindung testen | Management · Neue Quelle |
| F25 Quelle bearbeiten, F24 testen | Quelle · Einstellungen |
| F26, F27 Sync, Status | Quelle · Status (Kopfzeile: „Jetzt synchronisieren“) |
| F28 Historie | Quelle · Verlauf |
| F29 Seiten, Vorschau | Quelle · Seiten |
| F30, F31 Slug, Löschen | Quelle · Einstellungen, Gefahrenzone |
| F32 Tote Links | Qualität · Tote Links; je Quelle auf Quelle · Status als Zähler mit Link |
| F33 Duplikate | Qualität · Doppelte Quellen; zusätzlich in Übersicht · Handlungsbedarf und als Hinweis auf Quelle · Status |
| F34 Suchen ohne Treffer | Qualität · Suchen ohne Treffer |
| F35–F42 Nutzer und Einladungen | Zugang · Nutzer |
| F43 alle Keys | Zugang · Alle API-Keys |
| F44 Syncs pausieren | System · Einstellungen |
| F45 Export | System · Einstellungen, Abschnitt Datensicherung |
| F46 Bereichswechsel | Gemeinsamer Rahmen |
| F47 Mails | unverändert, in der Sprache dessen, der sie auslöst (O7, entschieden) |

Ergebnis: Alle 47 Funktionen sind verortet. Keine entfällt.

## 7. Konzept Startseite

**Zweck.** Die Startseite beantwortet drei Fragen: Was ist hier verfügbar? Wie verbinde ich meinen Agenten? Was findet der Agent zu meiner Frage? Sie ist für Besucher die Visitenkarte der Instanz und für eingeloggte Nutzer der Ausgangspunkt für die Arbeit mit Agenten.

**Aufbau.**
- **Quellen (Katalog).** Liste der Quellen, die der Betrachter lesen darf, mit Name, Beschreibung, Umfang und dem Stand der Inhalte, mit Suche über Name, Slug und Beschreibung, weil eine Instanz Hunderte Quellen tragen kann (O6). Der Status zeigt allen nur den Stand der Inhalte („Stand: <Datum des letzten erfolgreichen Syncs>“ oder „Noch nicht verfügbar“); Sync-Details, Fehlerwörter, „paused“ und tote Links bleiben dem Management vorbehalten (O3, entschieden). Für Admins verlinkt jede Quelle auf ihre Management-Ansicht. Kennt eine Quelle ihre Dokumentationsseite, verlinkt sie für alle dorthin; eine eigene Inhaltsansicht in grimoire gibt es nicht (O4, entschieden).
- **Agent verbinden.** Der Befehl für Claude Code mit Kopierknopf, wie heute. Für Besucher ohne Account: Hinweis, dass öffentliche Quellen ohne Key funktionieren. Für Eingeloggte: direkter Weg zu „Neuer Key“, dessen Ergebnis den Befehl mit eingesetztem Key zeigt (W2).
- **Suche ausprobieren.** Formular wie heute. Die Antwort bleibt inhaltlich die exakte Agent-Antwort, wird aber lesbar dargestellt: Treffer als Abschnitte mit Quelle und Pfad, der Rohtext auf Wunsch aufklappbar (U16). Ein Nulltreffer zeigt einen Satz statt eines Codeblocks.

**Abgrenzung.** Keine Verwaltungsfunktion. Der einzige Weg ins Management ist der Bereichswechsel bzw. der Link einer Quelle für Admins.

**Fehlerseiten.** Eine Fehlerseite sagt, was passiert ist, und bietet den Ausweg, der zur Lage passt: 403 als Nutzer: „Zurück zu deinem Account“; 404 bei einem alten Einladungs- oder Reset-Link: „Zum Login“ und der Hinweis, den Admin um einen neuen Link zu bitten (U23).

## 8. Konzept Anmeldung (Auth-Layout)

**Zweck.** Hineinkommen, mit genau einer Aufgabe je Seite.

- **Anmelden.** Passwort und SSO-Anbieter gleichrangig, je nach Konfiguration. Ein Satz, wie man zu einem Account kommt (Einladung durch einen Admin oder SSO-Anbieter), weil es keine Registrierung gibt (U23). „Passwort vergessen“ nur mit Mailserver, wie heute.
- **Passwort vergessen / zurücksetzen.** Wie heute; der ungültige Link bietet „Neuen Link anfordern“.
- **Einladung annehmen.** Zeigt, zu welcher Instanz und mit welcher Adresse eingeladen wurde. Ein ungültiger Link zeigt nur den Fehler und den Ausweg, nicht mehr den Lead des gültigen Falls (U23). Nach dem Annehmen landet der neue Nutzer im Account auf „API-Keys“ mit einem kurzen Willkommen und dem nächsten Schritt „Ersten Key anlegen“ (W2).
- **Setup.** Zwei klar getrennte Wege, „Neu beginnen“ (ersten Admin anlegen) und „Umzug“ (Export importieren), mit je einem Satz, wann man welchen wählt.
- **SSO-Zwischenseite.** Unverändert eine Weiterleitung; im Auth-Layout statt im vollen Rahmen.

## 9. Konzept Account

**Zweck.** Alles, was einem Menschen selbst gehört: seine Keys und seine Anmeldung. Gleich für Admins und Nutzer ohne Rolle; keine Verwaltungsfunktion.

**Navigation.** Zwei Punkte, „API-Keys“ zuerst, weil es die häufigere Aufgabe ist, dann „Anmeldung“. Ein Nutzer ohne Rolle landet nach der angenommenen Einladung und nach dem SSO-Login, der seinen Account anlegt, auf „API-Keys“ mit Willkommen und dem Hinweis „Ersten Key anlegen“; bei jedem späteren Login auf der Startseite. Ein Ziel aus `?next=` geht immer vor (O5, entschieden).

### 9.1 API-Keys (`/account/api-keys`)

Die Seite verwaltet die eigenen Keys: anlegen, ändern, widerrufen, Nutzung ansehen.

- **Liste** aller eigenen Keys mit Name, Quellen, Gültigkeit (inklusive „abgelaufen“), zuletzt benutzt und Anfragen pro Tag. Primäraktion „Neuer Key“ oberhalb der Liste. Leerzustand mit derselben Aktion.
- **Neuer Key** im Dialog: Name, Quellen (alle einschließlich künftiger / ausgewählte), Ablauf. Die Auswahl einzelner Quellen ist bei Hunderten Quellen keine Checkbox-Liste mehr, sondern eine durchsuchbare Mehrfachauswahl, die die gewählten Quellen gesammelt zeigt (`SourcePicker`). Nach dem Absenden ein **Ergebnis** mit dem Key (einmalig, Kopierknopf) und dem vollständigen Verbindungsbefehl mit eingesetztem Key. Das Ergebnis wird nach einem Redirect gezeigt, sodass ein Reload keinen zweiten Key anlegt (U20).
- **Key ändern** im Dialog, beschriftet „Bearbeiten“ statt „Change <Name>“ (U20).
- **Widerrufen** mit Rückfrage der Stufe 1 und Statusmeldung danach.

### 9.2 Anmeldung (`/account`)

Die Seite verwaltet, wie man sich anmeldet.

- **Passwort.** Ändern wie heute. Hat der Account kein Passwort, steht hier „Passwort festlegen“: mit Mailserver über einen Link an die eigene Adresse, sonst über einen Link, den ein Admin erzeugt (U1, M2) (O1, entschieden).
- **Verknüpfte Anbieter.** Liste mit „Lösen“, Rückfrage Stufe 1 (heute ohne). Verknüpfen weiterer Anbieter wie heute.

## 10. Konzept Management

**Zweck.** Alles, was Admins für die Instanz tun: Quellen pflegen, Qualität sichern, Zugang steuern, das System einstellen.

### 10.1 Navigation (Sidebar)

```
Übersicht
Inhalte
  Quellen                 (Zähler: Quellen mit Fehler)
Qualität
  Tote Links              (Zähler)
  Doppelte Quellen        (Zähler)
  Suchen ohne Treffer
Zugang
  Nutzer                  (Zähler: offene Einladungen)
  Alle API-Keys
System
  Einstellungen
```

- Die Gruppen sind Überschriften, keine eigenen Seiten.
- Die Detailseiten einer Quelle markieren „Quellen“ als aktiv.
- Zähler zeigen nur, was Handlung braucht, und nur wenn er größer als null ist.
- Mobil klappt die Sidebar hinter einen Menüknopf; die Seite beginnt mit ihrem Inhalt (U26).

**Wie eine neue Funktion hinzukommt.** Eine neue Management-Funktion ist entweder ein neues Objekt (eigene Liste und Detail, in der passenden Gruppe) oder eine neue Sicht über bestehende Objekte (eine Seite in „Qualität“ oder „System“), oder eine Einstellung (Abschnitt in „Einstellungen“). Eine neue Gruppe entsteht erst, wenn keine der vier passt. Die Sidebar ist eine Liste aus Daten (Gruppe, Titel, Ziel, optionaler Zähler); ein Eintrag mehr ändert nichts an Layout oder Seitentypen.

### 10.2 Übersicht (`/manage`)

Die Seite beantwortet „Muss ich etwas tun?“.

- **Handlungsbedarf**: Sync-Fehler, Warnungen, tote Links, pausierte und nie synchronisierte Quellen, **neu Duplikate** (U11) und der Hinweis, dass alle Syncs pausiert sind. Jeder Eintrag nennt die Quelle mit Namen (Slug darunter, U13) und verlinkt auf die Unterseite, auf der man handelt.
- **Kennzahlen**: Quellen, Seiten, Snippets, Tokens, tote Links, Keys, wie heute; jede Zahl verlinkt auf ihre Liste.
- Bei Hunderten Quellen ist der Handlungsbedarf nach Art gruppiert (Sync-Fehler, Duplikate, tote Links, pausiert, nie synchronisiert), je Gruppe mit Anzahl und den ersten Einträgen; „alle anzeigen“ führt auf die gefilterte Quellenliste bzw. die Qualitätsliste.
- Leerzustand: „Alles in Ordnung“, wie heute.

Die Quellentabelle zieht nach `/manage/sources`.

### 10.3 Quellen (`/manage/sources`)

Liste aller Quellen mit Name und Slug, Sichtbarkeit, Status, letztem Sync, Seiten, Snippets, Tokens, toten Links. Primäraktion „Neue Quelle“. Suche über Name und Slug, Filter nach Status und Sichtbarkeit, sortierbar nach Name, Status und letztem Sync. Die Suche und die Filter stehen in der URL, damit gefilterte Ansichten verlinkbar sind (die Übersicht verlinkt zum Beispiel „alle fehlgeschlagenen Quellen“). Bei Hunderten Quellen lädt die Liste seitenweise [Annahme: ab etwa 100 Zeilen].

### 10.4 Neue Quelle (`/manage/sources/new`)

Formularseite mit gruppierten Abschnitten (U24):

1. **Allgemein**: Name (mit Slug-Vorschau), Beschreibung, Dokumentationsseite.
2. **Repository**: Git-URL, Branch, Pfad (leer = ganzes Repository; nicht vorbelegt), Ausschlüsse.
3. **Zugang**: Benutzername und Token, mit einem Satz, wann man sie braucht (nur für nicht öffentliche Repositories) und welche Rechte der Token braucht.
4. **Zeitplan und Sichtbarkeit**: Zeitplan (Cron, mit Klartext-Übersetzung des eingegebenen Ausdrucks und dem globalen Standard), pausiert, Sichtbarkeit.

„Verbindung testen“ steht im Abschnitt Repository/Zugang, braucht keinen Namen (U3) und prüft Zugang, Branch und Pfad (U2) (O2, entschieden). „Quelle anlegen“ führt auf Quelle · Status mit der Meldung „Quelle angelegt, erster Sync läuft“.

### 10.5 Quelle (`/manage/sources/[id]` und Unterseiten)

Eine Detailansicht mit Kopf und vier Unterseiten als Tabs.

**Kopf** auf allen Unterseiten: Name, Slug, Sichtbarkeit, Statusmarke, Link zur Dokumentationsseite, Primäraktion „Jetzt synchronisieren“ mit sichtbarem Fortschritt (läuft / fertig / fehlgeschlagen), auch wenn man die Unterseite wechselt.

- **Status** (Standard): Stand der Inhalte (letzter Check, letzter erfolgreicher Sync, Commit, Umfang), aktueller Fehler **mit Behebungshinweis** (U10), Warnungen, Duplikat-Hinweis mit Link auf die andere Quelle (U11), tote Links dieser Quelle. Alle Zeitangaben aus derselben Quelle wie in der Liste (U9).
- **Seiten**: filterbare Liste der Seiten; die Vorschau einer Seite öffnet sich als eigene Ansicht innerhalb des Tabs (`?preview=`), mit Rückweg zur Liste (U8).
- **Verlauf**: Sync-Historie als Tabelle, neueste zuerst. Wie heute fasst sie Checks ohne Änderung und wiederholte gleiche Fehler zu einer Zeile mit Zähler zusammen und behält die letzten 100 Einträge (O8, durch den Bestand beantwortet).
- **Einstellungen**: dasselbe gruppierte Formular wie bei „Neue Quelle“. Speichern meldet „Gespeichert“ und nur dann „Sync angestoßen“, wenn eine Änderung einen Sync auslöst (U4). Der Wechsel auf `public` verlangt eine Rückfrage der Stufe 1 mit dem Konsequenztext, der heute schon an der Option steht (U5). Darunter abgesetzt die **Gefahrenzone**: Slug ändern (Stufe 2, wie heute) und Quelle löschen (Stufe 2: Slug abtippen).

### 10.6 Qualität

Drei Sichten über die Quellen, jede mit Leerzustand und Link zur betroffenen Quelle.

- **Tote Links**: gruppiert nach Quelle und Seite; je Link der Weg zur Korrektur: Link zur Datei im Repository, wo die Quelle eine Bearbeitungs-URL kennt, und zur Vorschau der Seite (U18).
- **Doppelte Quellen**: Paare mit Art (Duplikat / Überlappung) und Links auf beide Quellen; derselbe Befund erscheint in der Übersicht.
- **Suchen ohne Treffer**: wie heute, mit dem Satz, dass nur Suchen von Agenten zählen, nicht „Suche ausprobieren“ (U17; O9, entschieden).

### 10.7 Zugang

**Nutzer** (`/manage/users`) verwaltet Accounts und Einladungen.
- Tab **Nutzer**: Tabelle mit E-Mail, Rolle, Anmeldewegen, Anzahl Keys (verlinkt auf „Alle API-Keys“, gefiltert), Aktionen. Suche über die E-Mail. Aktionen gestuft: häufige als Knöpfe, seltene und destruktive in einem Aktionsmenü je Zeile. Rolle vergeben und entziehen beide Stufe 1 (U5). „Identität lösen“ mit dem Hinweis, wenn es der einzige Anmeldeweg des Nutzers ist (U21). Neu: „Link zum Passwort-Setzen erzeugen“ (M2) (O1, entschieden).
- Tab **Einladungen**: offene Einladungen mit Datum, abgelaufen markiert. „Neuen Link erzeugen“ statt „Send again“, wenn kein Mailserver eingerichtet ist, mit Rückfrage Stufe 1: der alte Link wird ungültig (U22).
- Primäraktion **Nutzer einladen** im Dialog, über beiden Tabs.

**Alle API-Keys** (`/manage/api-keys`): dieselbe Datentabelle wie im Account, ergänzt um den Owner (verlinkt auf den Nutzer), mit Ablauf und Status „abgelaufen“ (U19), Filter nach Owner. Widerrufen Stufe 1. Bearbeiten bleibt dem Owner vorbehalten, wie heute.

### 10.8 System: Einstellungen (`/manage/settings`)

- **Syncs**: alle Syncs pausieren, mit dem Hinweis, dass Quellen zusätzlich einzeln pausiert sein können (U28).
- **Datensicherung**: Export wie heute, dazu ein Satz, dass der Import beim Einrichten einer neuen, leeren Instanz auf deren Setup-Seite stattfindet (U25).

## 11. Seiten- und Layouttypen

| Typ | Layout | Aufbau | Seiten |
|---|---|---|---|
| Auth-Karte | Auth | Titel, kurzer Lead, ein Formular, Ausweg-Link | Login, Forgot, Reset, Invite, Setup, Callback |
| Öffentliche Seite | Öffentlich | Seitenkopf, Abschnitte untereinander | Start, Fehlerseiten |
| Account-Seite | Account | Seitenkopf mit Primäraktion, Abschnitte | API-Keys, Anmeldung |
| Dashboard | Management | Handlungsbedarf, Kennzahlen | Übersicht |
| Listenansicht | Management, Account | Seitenkopf mit Primäraktion, Such- und Filterleiste, Datentabelle, Leerzustand | Quellen, Nutzer, Alle Keys, Qualitätslisten, eigene Keys |
| Detailansicht | Management | Kopf (Name, Status, Primäraktion), Tabs als Unterseiten | Quelle |
| Formularseite | Management | Seitenkopf, gruppierte Abschnitte, Aktionen am Ende | Neue Quelle, Quelle · Einstellungen, Einstellungen |
| Dialog | über jedem Layout | Titel, Inhalt, Aktionen | Neuer Key, Key ändern, Nutzer einladen, Rückfragen |

Jeder Seitenkopf trägt den Titel, optional einen Lead und rechts die eine Primäraktion der Seite. Detail- und Unterseiten zeigen einen Brotkrumenpfad (Quellen › Platform docs › Einstellungen) statt des heutigen einzelnen Zurück-Links.

## 12. Navigation und Nutzerführung

### 12.1 Ebenen

1. **Bereich**: gemeinsamer Rahmen.
2. **Seite im Bereich**: Sidebar (Management) oder Unternavigation (Account).
3. **Unterseite**: Tabs der Detailansicht.
4. **Ort**: Brotkrumen auf Detail- und Unterseiten.

### 12.2 Wichtige Nutzerwege im Zielbild

| Weg | Ablauf | Gegenüber heute |
|---|---|---|
| Besucher verbindet Agent | Start → Befehl kopieren | unverändert |
| Eingeladener Nutzer, erster Key | Mail → Einladung annehmen → Account · API-Keys mit Willkommen → „Neuer Key“ → Ergebnis mit Key **und** fertigem Befehl | eine Seite weniger, kein Platzhalter mehr |
| SSO-Nutzer ohne Passwort | Account · Anmeldung → „Passwort festlegen“ → Link per Mail oder vom Admin | heute Sackgasse (U1) |
| Admin legt Quelle an | Management · Quellen → „Neue Quelle“ → Verbindung testen (prüft den Pfad) → anlegen → Quelle · Status mit laufendem Sync | Fehler fällt vor dem Speichern auf |
| Admin behebt Sync-Fehler | Übersicht · Handlungsbedarf → Quelle · Status (Fehler mit Hinweis) → Einstellungen → Speichern („Gespeichert, Sync angestoßen“) → Status | Hinweis am Ort des Handelns, Rückmeldung nach dem Speichern |
| Admin lädt ein | Zugang · Nutzer → „Nutzer einladen“ (Dialog) → Meldung oder Link einmalig | Aktion oben statt unter zwei Tabellen |
| Admin prüft Zugriff eines Nutzers | Zugang · Nutzer → Zahl der Keys → Alle API-Keys gefiltert | heute drei Seiten ohne Verbindung |
| Admin wechselt zu eigenen Keys und zurück | Bereichswechsel „Account“ → API-Keys → Bereichswechsel „Management“ | Navigation bleibt sichtbar |

### 12.3 Interaktionsmuster

**Rückmeldung.** Jede ändernde Aktion endet mit einer Statusmeldung, die sagt, was geschehen ist („Key ‚laptop‘ widerrufen“, „Quelle ‚Billing archive‘ gelöscht“). Die Meldung übersteht den Redirect nach der Aktion und erscheint oben im Inhaltsbereich. Fehler bleiben im Formular am Feld, wie heute.

**Rückfragen in drei Stufen.**

| Stufe | Wann | Form | Beispiele |
|---|---|---|---|
| 0 | umkehrbar, ohne Folgen für andere | keine | Speichern, Sync anstoßen, Pausieren |
| 1 | betrifft andere oder lässt sich nicht einfach zurücknehmen | Dialog mit Konsequenzsatz und benannter Aktion („Widerrufen“, nicht „OK“) | Key widerrufen, Einladung zurückziehen, neuen Einladungslink erzeugen, Rolle vergeben oder entziehen, Identität lösen, Nutzer löschen, Sichtbarkeit auf `public` |
| 2 | zerstört Daten oder bricht externe Verweise | Dialog mit Abtippen des Slugs | Quelle löschen, Slug ändern |

Der Dialog ersetzt das native `confirm()`: gestaltet wie die Seite, übersetzt, mit Konsequenztext, per Tastatur bedienbar. Ohne JavaScript bleibt die Aktion möglich: [Annahme] Der Dialog ist dann eine eigene Bestätigungsseite, da die App heute schon ohne JavaScript funktioniert (`csr=false` auf den Auth-Seiten, Formulare als POST).

**Benennung.** Eine Quelle erscheint überall mit Namen, darunter der Slug (U13). Statuswörter kommen aus einer Komponente.

**Leerzustände.** Jede Liste hat einen Leerzustand, der sagt, warum sie leer ist, und, wo es eine gibt, die Aktion anbietet, die das ändert.

**Mobil.** Tabellen zeigen ab schmaler Breite je Zeile eine Karte mit den wichtigsten Feldern (Name, Status, Aktion); die Sidebar klappt weg; Sprache und Theme stehen im Menü (U26).

## 13. Komponentenstrategie

### 13.1 Grundsätze

Es gelten weiter die Regeln aus `.claude/rules/ui-components.md`: Design nur über Tokens, Stories für jeden Zustand mit `play` und axe, keine Texte im Markup, die zweite Verwendung macht eine Komponente. Daraus folgt für das Redesign:

- Eine neue Komponente entsteht, wenn das Zielbild sie an mindestens zwei Stellen braucht oder wenn sie eine eigene Struktur oder ein eigenes Verhalten hat (Dialog, Tabs).
- Die Seitenprimitive in `app/src/app.css` (`.sheet`, `.notice`, `.table-scroll`, `.muted`) bleiben Primitive. Komponenten bauen auf ihnen auf, statt sie zu ersetzen.
- Keine fremde Komponentenbibliothek. [Annahme] Die App kommt mit eigenen, kleinen Komponenten aus; eine Bibliothek brächte ein zweites Designsystem neben die Tokens. Native Elemente (`<dialog>`, `<details>`, `popover`) tragen Dialog und Menü.

### 13.2 Zielkatalog nach Kategorien

| Kategorie | Komponente | Status | Verwendung |
|---|---|---|---|
| **Layout** | `AppShell` | neu | gemeinsamer Rahmen: Marke, Bereichswechsel, Benutzermenü, Footer |
| | `AuthLayout` | neu | Karte der Auth-Seiten |
| | `ManageLayout` | neu | Sidebar plus Inhalt |
| | `AccountLayout` | neu | Unternavigation plus Inhalt |
| | `PageHead` | anpassen | Titel, Lead, **Primäraktion**, Brotkrumen statt `back` |
| | `TableScroll` | behalten | in `DataTable` aufgegangen, für Sonderfälle weiter da |
| **Navigation** | `AreaSwitch` | neu | Bereichswechsel |
| | `UserMenu` | neu | E-Mail, Abmelden, Sprache, Theme |
| | `SideNav` | neu | Gruppen, Einträge, Zähler, aktiv; mobil einklappbar |
| | `SubNav` | neu | Account-Unternavigation; dieselbe Komponente wie `Tabs` mit Links [Annahme] |
| | `Tabs` | neu | Unterseiten als Links mit `aria-current` |
| | `Breadcrumbs` | neu | Ort auf Detail- und Unterseiten |
| | `SegmentedSwitch` | behalten | Sprache, Theme im `UserMenu` |
| **Form** | `TextField`, `TextAreaField`, `ChoiceField`, `NameField` | behalten | |
| | `PasswordField` | neu | ersetzt das viermal kopierte Passwortfeld mit Mindestlänge |
| | `FormSection` | neu | Abschnitt mit Überschrift und Hilfetext im langen Formular |
| | `SourcePicker` | neu | durchsuchbare Mehrfachauswahl von Quellen für Keys; ersetzt die Checkbox-Liste |
| | `FormError` | behalten | |
| | `ProviderButtons` | behalten | |
| | `QueryForm` | anpassen | lesbare Antwort, Rohtext aufklappbar |
| | `ScheduleField` | neu, optional | Cron mit Klartext-Übersetzung |
| **Data Display** | `DataTable` | neu | Kopf, Zeilen, Leerzustand, mobile Kartenansicht, Suche, Filter und Sortierung in der URL, seitenweises Laden; ersetzt die sechs Inline-Tabellen und `SourceStatsTable` |
| | `StatusBadge` | neu | Statuswörter einer Quelle und eines Syncs aus einer Stelle |
| | `SourceLabel` | neu | Name mit Slug darunter, optional verlinkt |
| | `KeyScope` | neu | Quellen eines Keys; heute doppelt; bei vielen Quellen gekürzt („platform-docs, billing-docs und 12 weitere“) |
| | `DescriptionList`, `DateTime`, `CopyButton`, `ShownOnce`, `RequestsPerDay` | behalten | |
| | `EmptyState` | neu | Satz plus optionale Aktion; ein reiner Satz bleibt `p.muted` |
| **Feedback** | `FlashMessage` | neu | Statusmeldung nach einer Aktion, übersteht den Redirect |
| | `Notice` | nicht nötig | bleibt CSS-Primitive `.notice` |
| **Overlay** | `Dialog` | neu | auf `<dialog>`, Fokusführung, Escape |
| | `ConfirmDialog` | neu | Stufe 1 und 2, ersetzt `ConfirmForm` |
| | `ActionMenu` | neu | seltene Zeilenaktionen in Tabellen |
| **Management** | `AttentionList` | neu | Handlungsbedarf, heute Markup der Übersicht |
| | `SourceHeader` | neu | Kopf der Quellen-Detailansicht mit Sync-Fortschritt |
| | `PageList`, `DeadLinkList` | behalten / anpassen | `DeadLinkList` mit Links zur Datei und zur Vorschau |
| | `SlugChangeForm` | aufgehen | wird `ConfirmDialog` Stufe 2 mit Slug-Feld |

### 13.3 Umgang mit bestehenden Komponenten

| Komponente | Entscheidung | Begründung |
|---|---|---|
| `ConfirmForm` | ersetzen durch `ConfirmDialog` | natives `confirm()` ist ungestaltet und kennt keine Stufen (U5) |
| `SlugChangeForm` | aufgehen in `ConfirmDialog` Stufe 2 | dasselbe Muster wie Quelle löschen |
| `SourceStatsTable` | aufgehen in `DataTable` mit `StatusBadge` und `SourceLabel` | eine Tabellenkomponente für alle Listen |
| `PageHead` | erweitern | Primäraktion und Brotkrumen |
| `QueryForm` | erweitern | Darstellung der Antwort (U16) |
| `DeadLinkList` | erweitern | Wege zur Korrektur (U18) |
| `TableScroll` | behalten, intern in `DataTable` | Sonderfälle ohne Tabellenkopf |
| alle übrigen | behalten | |

Gestrichen wird keine Funktion; gestrichen werden zwei Komponenten (`ConfirmForm`, `SlugChangeForm`), deren Aufgabe eine allgemeinere übernimmt.

### 13.4 Fehlende Komponenten

Aus Kapitel 2.5 und dem Zielbild: `AppShell`, die drei Layouts, `AreaSwitch`, `UserMenu`, `SideNav`, `Tabs`, `Breadcrumbs`, `PasswordField`, `FormSection`, `SourcePicker`, `DataTable`, `StatusBadge`, `SourceLabel`, `KeyScope`, `EmptyState`, `FlashMessage`, `Dialog`, `ConfirmDialog`, `ActionMenu`, `AttentionList`, `SourceHeader`; optional `ScheduleField`.

Dazu ein Helfer ohne Markup: der heute siebenmal kopierte `aria-invalid`-Helfer wird eine Funktion neben den Formular-Komponenten.

## 14. Storybook-Struktur

Storybook bleibt der Katalog und die Abnahme jeder Komponente. Die Titel bekommen die Kategorie als Präfix:

```
Layout/       AppShell · AuthLayout · AccountLayout · ManageLayout · PageHead
Navigation/   AreaSwitch · UserMenu · SideNav · Tabs · Breadcrumbs · SegmentedSwitch
Form/         TextField · TextAreaField · ChoiceField · NameField · PasswordField · FormSection · SourcePicker
              · FormError · ProviderButtons · QueryForm
Data Display/ DataTable · StatusBadge · SourceLabel · KeyScope · DescriptionList · DateTime
              · CopyButton · ShownOnce · RequestsPerDay · EmptyState
Feedback/     FlashMessage
Overlay/      Dialog · ConfirmDialog · ActionMenu
Management/   AttentionList · SourceHeader · PageList · DeadLinkList
```

- **Ablage.** Die Kategorie steht im Storybook-Titel (`defineMeta({ title: 'Form/TextField' })`). Die Dateien bleiben flach in `app/src/lib/components/`. [Annahme] Unterordner bringen Umzüge aller Imports, aber keinen Nutzen, den der Titel nicht schon bringt; sie sind später ohne Bruch möglich.
- **Layouts als Stories.** Jedes Layout bekommt Stories je Rolle (anonym, Nutzer, Admin) und je Zustand (Sidebar offen/zu, mobil). Damit lassen sich Rahmen und Navigation prüfen, ohne die App zu starten.
- **Zustände.** Wie heute: je Zustand eine Story mit `play`. Für Dialoge: geöffnet, Stufe 1, Stufe 2 mit falscher und richtiger Eingabe, Abbrechen. Für `DataTable`: gefüllt, leer, mobil, mit Filter.
- **Doku.** Je Kategorie eine kurze Docs-Seite (`@storybook/addon-docs` ist installiert) mit der Regel, wann die Komponente benutzt wird; die Rückfragestufen aus 12.3 gehören zu `ConfirmDialog`.

---

## Teil III: Umsetzungsleitfaden (Phase 3)

## 15. Maßnahmen und Priorisierung

Bewertung: UX-Wirkung, Nutzerrelevanz (wie viele Rollen, wie oft), Komplexität (Aufwand und Risiko), Skalierbarkeit (Bedeutung für künftiges Wachstum). Skala: ●●● hoch, ●● mittel, ● niedrig.

### 15.1 Kritisch

| # | Maßnahme | Befunde | Wirkung | Relevanz | Komplexität | Skalierung | Abhängig von |
|---|---|---|---|---|---|---|---|
| M1 | Rückmeldemuster: `FlashMessage`, jede ändernde Aktion meldet sich | U4 | ●●● | ●●● | ●● | ●● | – |
| M2 | Ausweg für Accounts ohne Passwort: Link „Passwort setzen“ durch Admin; „Passwort festlegen“ im Account | U1 | ●●● | ● | ●● | ● | O1 |
| M3 | Verbindungstest prüft den Pfad; kein Name nötig; Pfad nicht vorbelegt | U2, U3 | ●●● | ●● | ●● | ● | O2 |
| M4 | `Dialog` und `ConfirmDialog` mit drei Stufen, ersetzt `confirm()` und `SlugChangeForm`; Rückfrage für `public` | U5, U22 | ●●● | ●●● | ●● | ●●● | – |

### 15.2 Wichtige strukturelle Verbesserungen

| # | Maßnahme | Befunde | Wirkung | Relevanz | Komplexität | Skalierung | Abhängig von |
|---|---|---|---|---|---|---|---|
| M5 | `AppShell` mit Bereichswechsel und Benutzermenü | U6, U7 | ●●● | ●●● | ●● | ●●● | – |
| M6 | Management-Layout mit `SideNav`; `/manage/sources` als Liste; Übersicht ohne Quellentabelle | U12 | ●●● | ●● | ●● | ●●● | M5 |
| M7 | Account-Layout mit Unternavigation; Landeseite nach Login und Einladung | U7, W2 | ●● | ●●● | ● | ●● | M5 |
| M8 | Auth-Layout für die Anmeldeseiten | U23 | ● | ●●● | ● | ● | M5 |
| M9 | Quelle als Detailansicht mit vier Unterseiten und `SourceHeader`; Anker leiten weiter | U8 | ●●● | ●● | ●●● | ●●● | M6 |
| M10 | Quellenformular in Abschnitten (`FormSection`), Hilfetexte zu Zugang und Token | U24 | ●● | ●● | ● | ● | M9 |
| M11 | `DataTable` mit Suche, Filter, Sortierung und seitenweisem Laden, `StatusBadge`, `SourceLabel`, `KeyScope`, `EmptyState`; alle Listen umstellen | U13, U19, U26 | ●● | ●● | ●●● | ●●● | – |
| M12 | Handlungsbedarf vollständig: Duplikate; Behebungshinweis auf Quelle · Status | U10, U11 | ●● | ●● | ● | ●● | M9 |
| M13 | Status aus einer Quelle: letzte Sync-Zeit und Commit in Liste und Detail gleich | U9 | ●● | ●● | ● | ● | – |

### 15.3 Sinnvolle Optimierungen

| # | Maßnahme | Befunde | Wirkung | Relevanz | Komplexität | Abhängig von |
|---|---|---|---|---|---|---|
| M14 | Keys: Anlegen und Ändern im Dialog mit `SourcePicker`; Ergebnis nach Redirect mit fertigem Befehl; Admin-Liste mit Ablauf, Owner-Link, Filter | U19, U20, W2 | ●● | ●●● | ●● | M4, M11 |
| M15 | Nutzer: Tabs Nutzer/Einladungen, Einladen als Dialog, Aktionsmenü, Suche, Zahl der Keys; „Neuen Link erzeugen“ ohne Mailserver | U21, U22 | ●● | ●● | ●● | M4, M11 |
| M16 | Startseite: Status vereinfacht, Quellen für Admins verlinkt, Link zur Dokumentationsseite je Quelle, Suche im Quellenkatalog, lesbare Suchantwort | U14, U15, U16 | ●● | ●●● | ●● | O3 |
| M17 | Fehlerseiten und ungültige Links mit passendem Ausweg; Login erklärt den Weg zum Account | U23 | ● | ●● | ● | M8 |
| M18 | Begriffsliste Deutsch, Sync-Fehler übersetzt, tote Links mit Korrekturweg, Hinweise bei Pause und Import | U10, U17, U18, U25, U27, U28 | ● | ●● | ●● | M9 |

### 15.4 Optionale Erweiterungen

| # | Maßnahme | Befunde | Voraussetzung |
|---|---|---|---|
| M19 | `ScheduleField`: Cron mit Klartext-Übersetzung | U24 | – |

## 16. Reihenfolge, Abhängigkeiten, Migration und Abnahme

### 16.1 Reihenfolge

```
Stufe A  Muster und Fehler         M1 ─┬─ M4          M2   M3   M13
                                       │
Stufe B  Rahmen                    M5 ─┼─ M8
                                       ├─ M7
                                       └─ M6 ── M9 ── M10, M12
Stufe C  Bausteine                 M11 (parallel zu B möglich)
Stufe D  Seiten                    M14, M15 (nach M4, M11) · M16 · M17 · M18
Stufe E  Optional                  M19
```

Stufe A zuerst, weil sie die kritischen Fehler behebt und die Muster liefert, die alle späteren Seiten benutzen. M5 vor allen Layouts, weil jedes Layout in den Rahmen eingesetzt wird. M9 ist die größte einzelne Maßnahme und kommt nach dem Management-Layout, damit die Unterseiten gleich in der Sidebar stehen.

### 16.2 Migrationsstrategie

- **Alles auf dem Branch `redesign`, ein Merge am Ende** (Entscheidung des Owners, 2026-11-05). Jede Maßnahme ist ein eigener Task und ein oder mehrere eigene Commits auf `redesign`; nach jedem Task ist die App auf dem Branch vollständig benutzbar und alle Prüfungen laufen grün. Nutzer bekommen das neue UI in einem Release. Was in der Zwischenzeit auf `main` landet, holt `redesign` regelmäßig per Rebase nach, damit der Merge am Ende klein bleibt. Kein Feature-Flag.
- **URLs.** Alle heutigen URLs funktionieren weiter. Neu sind `/manage/sources` und die Unterseiten einer Quelle; `#settings` und `#status` werden auf die Unterseiten weitergeleitet [Annahme: per kleinem Skript im Client, da Anker den Server nicht erreichen].
- **Tests je Schritt.**
  - `app/src/routes/manage/manage.e2e.ts` geht durch fast jede Management-Seite und folgt Links über ihre Namen. M5, M6, M9 und M15 ändern Navigation und Ablauf; diese Datei wird im selben Schritt angepasst.
  - Die Route-Specs (`*.spec.ts` unter `app/src/routes/`) prüfen Loads und Actions. Sie bleiben, solange Actions ihren Namen behalten; M9 verschiebt die Actions der Quelle auf Unterseiten und passt `sources.spec.ts` an.
  - Jede neue Komponente kommt mit Stories (Kapitel 14); umgestellte Komponenten behalten ihre Stories oder ersetzen sie.
  - Nach jedem Task `make lint`, `make test`, `make e2e` auf `redesign`; vor dem Merge nach `main` noch einmal alle drei.
- **Handbuch.** Die Seiten unter `docs/handbook/` nennen Wege wie `Manage > Users` und Beschriftungen wie **Sync now**. Jede Maßnahme, die einen Weg oder eine Beschriftung ändert, ändert das Handbuch im selben Schritt.
- **Texte.** Jede neue Beschriftung kommt in beide Message-Dateien. Die Begriffsliste aus M18 wird vor den Seiten-Maßnahmen (Stufe D) festgelegt, damit neue Texte gleich die richtigen Begriffe verwenden.

### 16.3 Abnahmekriterien

Jede Maßnahme ist ein Backlog-Task im Meilenstein `m-3` „UI redesign“: M1 bis M19 sind TASK-248 bis TASK-266 in derselben Reihenfolge. Die Tasks tragen die Kriterien auf Englisch und sind maßgeblich, wenn sie von dieser Tabelle abweichen.

| # | Abnahme |
|---|---|
| M1 | Jede Action, die Daten ändert, erzeugt eine Statusmeldung, die nach dem Redirect sichtbar ist und den betroffenen Gegenstand nennt. Prüfliste: F13–F18, F23, F25, F26, F30, F31, F36–F45. |
| M2 | Ein SSO-Account ohne Passwort kommt ohne Mailserver zu einem Passwort. Der Link „Set a password“ führt nicht mehr auf eine Seite, die Eingeloggte wegleitet. Spec und e2e decken beide Fälle ab. |
| M3 | Ein nicht vorhandener Pfad lässt den Verbindungstest mit der Meldung fehlschlagen, die heute erst der Sync liefert. Speichern mit geänderter Git-URL, Branch oder Pfad prüft den Pfad und lehnt einen fehlenden mit Fehler am Feld ab; Speichern ohne solche Änderung prüft nichts. Der Test läuft ohne Namen. Das neue Formular hat keinen vorbelegten Pfad. |
| M4 | Kein `confirm()` mehr im Code. Jede Aktion der Stufe 1 und 2 aus 12.3 fragt mit `ConfirmDialog`; Stufe 2 nimmt nur den richtigen Slug an. Ohne JavaScript bleibt jede Aktion ausführbar. Stories mit axe für jede Stufe. |
| M5 | Auf jeder Seite außer den Auth-Seiten ist der Bereich erkennbar und jeder erlaubte andere Bereich mit einem Klick erreichbar. Nutzer ohne Rolle sehen keinen Management-Eintrag. Mobil braucht der Rahmen eine Zeile. |
| M6 | Die Sidebar zeigt die Gruppen aus 10.1; `/manage/sources` listet alle Quellen; Detailseiten markieren „Quellen“. Ein neuer Eintrag in der Sidebar ist eine Zeile in ihren Daten. Kein `isAdmin`-Zweig mehr in Management-Layout und -Übersicht. |
| M7 | Account hat zwei Navigationspunkte. Ein Nutzer ohne Rolle landet nach der angenommenen Einladung und nach dem SSO-Login, der seinen Account anlegt, auf „API-Keys“ mit Hinweis auf den nächsten Schritt; bei späteren Logins auf der Startseite; `?next=` geht vor. Spec für alle drei Fälle. |
| M8 | Alle sechs Auth-Seiten nutzen das Auth-Layout. |
| M9 | Die Quelle hat vier Unterseiten; keine ist mit Vorschau länger als nötig für ihren Inhalt; alte Anker-Links landen auf der richtigen Unterseite; der Sync-Fortschritt ist auf jeder Unterseite sichtbar. |
| M10 | Das Formular ist in vier Abschnitte gegliedert; Zugang und Token sind erklärt. |
| M11 | Keine Tabelle mehr inline in einer Route; Statuswörter nur noch in `StatusBadge`; Quellen überall mit Name und Slug; mobile Darstellung zeigt Status und Aktion. Quellen, Nutzer und alle Keys sind durchsuchbar und filterbar, der Zustand steht in der URL; mit 500 Quellen in den Testdaten bleibt jede Liste bedienbar. |
| M12 | Duplikate erscheinen im Handlungsbedarf und auf beiden Quellen; der Behebungshinweis steht auf Quelle · Status. |
| M13 | Für jede Quelle zeigen Liste und Detail denselben letzten erfolgreichen Sync und Commit. Spec für eine nie erfolgreiche Quelle. |
| M14 | Mit 500 Quellen lässt sich ein Key für drei bestimmte Quellen per Suche anlegen, ohne durch eine Liste zu scrollen. Ein Reload nach dem Anlegen legt keinen zweiten Key an; das Ergebnis zeigt den Befehl mit Key; die Admin-Liste zeigt Ablauf und verlinkt den Owner. |
| M15 | Einladen ist die Primäraktion; seltene Aktionen im Menü; ohne Mailserver heißt die Aktion „Neuen Link erzeugen“ und fragt nach. |
| M16 | Die Startseite zeigt je Quelle nur „Stand: <Datum>“ oder „Noch nicht verfügbar“, für alle Rollen; Admins erreichen von jeder Quelle der Startseite deren Management-Ansicht; jede Quelle mit Dokumentationsseite verlinkt für alle dorthin; der Quellenkatalog ist durchsuchbar; die Suchantwort ist ohne Monospace-Block lesbar. |
| M17 | 403, 404 und ungültige Links bieten den passenden Ausweg aus 7. |
| M18 | Begriffsliste in `docs/` oder den Regeln abgelegt; `de.json` folgt ihr; Sync-Fehler erscheinen übersetzt. |

## 17. Offene Fragen und Annahmen

### 17.1 Fragen an den Owner

Alle zehn Fragen sind am 2026-11-05 im Chat entschieden bzw. beantwortet.

| # | Frage | Empfehlung |
|---|---|---|
| O1 | Wie kommt ein Account ohne Passwort zu einem, wenn kein Mailserver eingerichtet ist? | **Entschieden 2026-11-05:** Der Admin erzeugt in der Nutzerverwaltung einen Link „Passwort setzen“, mit Mailserver per Mail, ohne einmalig angezeigt, wie bei Einladungen. |
| O2 | Soll „Test connection“ auch den Pfad prüfen, oder bleibt es ein reiner Zugangstest? | **Entschieden 2026-11-05:** Der Verbindungstest prüft Zugang, Branch und Pfad mit demselben schlanken Klon wie der Sync. Das Speichern prüft den Pfad ebenso, aber nur, wenn sich Git-URL, Branch oder Pfad geändert haben; ein fehlender Pfad verhindert das Speichern mit Fehler am Feld. |
| O3 | Sollen Nutzer ohne Rolle und Besucher den Sync-Status sehen? | **Entschieden 2026-11-05:** Die Startseite zeigt allen, auch Admins, nur „Stand: <Datum des letzten erfolgreichen Syncs>“ bzw. „Noch nicht verfügbar“; keine Fehlerwörter, kein „paused“, keine toten Links. Quellen ohne erfolgreichen Sync bleiben in der Liste. Admins erreichen über jede Quelle die Management-Ansicht mit allen Details. |
| O4 | Soll die Startseite Quelleninhalte zum Durchblättern anbieten (Seitenindex je Quelle)? | **Entschieden 2026-11-05:** Nein. Die Startseite bleibt Visitenkarte plus „Suche ausprobieren“; keine Inhaltsansicht, auch nicht als optionale Erweiterung. |
| O5 | Wohin nach dem Login als Nutzer ohne Rolle: Startseite wie heute oder Account · API-Keys? | **Entschieden 2026-11-05:** Beim ersten Mal (Einladung angenommen, Account per SSO angelegt) Account · API-Keys mit Willkommen; danach immer die Startseite; `?next=` geht vor. |
| O6 | Welche Größenordnung ist realistisch (Quellen, Nutzer, Keys, Seiten je Quelle)? | **Entschieden 2026-11-05:** Hunderte Quellen. Suche, Filter und Sortierung gehören in jede Liste (M11), die Quellenauswahl der Keys wird durchsuchbar (`SourcePicker`), der Handlungsbedarf gruppiert, die Startseite durchsuchbar. Nutzer und Keys entsprechend [Annahme: Hunderte Nutzer, bis etwa tausend Keys]. |
| O7 | Mails in der Sprache des Empfängers? | **Entschieden 2026-11-05:** Nein. Mails bleiben in der Sprache dessen, der sie auslöst; die Reset-Mail ist damit ohnehin in der Sprache des Empfängers, die Einladung in der des Admins. |
| O8 | Sollen Syncs ohne neuen Commit in der Historie erscheinen? | **Beantwortet durch den Bestand:** Sie erscheinen schon heute nur als Zähler an der vorherigen Zeile, die Historie hält 100 Einträge. Keine Änderung nötig. |
| O9 | Soll „Suche ausprobieren“ in „Suchen ohne Treffer“ zählen? | **Entschieden 2026-11-05:** Nein. Die Seite sagt, dass nur Suchen von Agenten erfasst werden. |
| O10 | Gibt es nur die Rolle `admin`, oder sind weitere Rollen absehbar? | **Entschieden 2026-11-05:** Keine weitere Rolle in Sicht. Die Sidebar kennt nur „Admin sieht alles“; kommt eine Rolle, bekommt jeder Eintrag in ihren Daten ein Feld für Rollen. Die immer wahren `isAdmin`-Zweige der Management-Navigation fallen mit M6 weg. |

### 17.2 Annahmen

- Sprache und Theme werden selten umgeschaltet und gehören ins Menü (5.3).
- Die App bleibt ohne JavaScript bedienbar; Dialoge haben eine Seitenvariante (12.3).
- Keine fremde Komponentenbibliothek (13.1).
- Storybook-Kategorien über Titel, nicht über Ordner (14).
- Anker-Weiterleitungen im Client (16.2).
- Rückkehr ins Management auf die zuletzt geöffnete Seite ist wünschenswert, nicht zwingend (5.3).

### 17.3 Nicht untersucht

- Leistung bei großen Datenmengen (Hunderte Quellen, Nutzer und Keys): nur gefolgert, nicht gemessen.
- Barrierefreiheit über die axe-Prüfungen der Stories hinaus.
- Die SSO-Abläufe mit echten Anbietern; geprüft nur mit dem Mock.
- `/setup` in der laufenden App: Die Seite ist nur ohne Admin erreichbar und wurde aus dem Code beschrieben, nicht bedient.
