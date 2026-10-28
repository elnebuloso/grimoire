# grimoire – Konzept

Stand: 2026-10-28 · Status: Konzept abgestimmt, Umsetzung noch nicht begonnen

## Idee

Eine zentrale Wissensdatenbank für eine Organisation, gebaut zuerst für AI-Agenten. Agenten
erfahren dort, wie sie eure Services, Tools und Abläufe nutzen, und können das Wissen selbst
erweitern.

Vorbild ist [Context7](https://context7.com): Dokumentation wird in kleine Snippets zerlegt und
gezielt mit Token-Budget ausgeliefert. Anders als Context7 geht es um **internes** Wissen, und
Agenten **schreiben** es mit.

Geplant als Open-Source-Projekt auf GitHub. Code, Doku, Instructions und Admin-Bereich sind
deshalb auf Englisch.

## Grundprinzipien

- **Git ist die Quelle der Wahrheit.** Menschen und Agenten schreiben Markdown in Git-Repos
  (GitLab, GitHub, Forgejo, Gitea …). Versionierung, Historie, Autorenschaft, Review und Rechte
  kommen von Git und dem jeweiligen Anbieter.
- **Menschen lesen über MkDocs/Zensical.** Das Rendering für Menschen ist nicht Aufgabe von grimoire.
- **grimoire liest nur:** einlesen, in Snippets zerlegen, suchen, ausliefern.
- **Wenig Kontext für Agenten.** Agenten bekommen nie ganze Doku-Bestände, sondern nur passende
  Abschnitte innerhalb eines Token-Budgets.

## Ablauf

```
Git-Repo (docs/ …)
   │  Mensch oder Agent ändert Markdown → Commit / MR / PR
   ▼
Sync (Polling, Button) ──► grimoire
                            ├─ zieht den konfigurierten Pfad
                            ├─ zerlegt nach Überschriften in Snippets
                            └─ aktualisiert den Suchindex
   │
   ├─► Menschen: MkDocs/Zensical-Seite
   └─► Agenten: projects / index / query / read
```

## Admin-Bereich

Ein **Projekt** hat einen Namen (Slug), eine Kurzbeschreibung und eine oder mehrere **Quellen**.
Eine Quelle ist ein Git-Repo mit Branch und genau einem Pfad.

```
Projekt „platform“
├── Quelle: auth-service     main   docs/
├── Quelle: auth-handbook    main   handbook/      (gleiches Repo wie auth-service)
├── Quelle: billing-service  main   docs/
└── Quelle: gateway          main   docs/
```

| Feld | Ebene | Beispiel |
|---|---|---|
| Slug | Projekt | `platform` |
| Kurzbeschreibung | Projekt | „Login, Abrechnung, Gateway“ – erscheint in `projects` |
| Slug | Quelle | `auth-service` – eindeutig im Projekt, Teil der ID |
| Git-URL (HTTPS) | Quelle | `https://gitlab.thoemo.net/platform/auth-service.git` |
| Branch | Quelle | `main` |
| Pfad | Quelle | `docs/` |
| Ausschlüsse | Quelle | `docs/drafts/**` (optional) |
| Zeitplan | Quelle | Cron-Ausdruck, z.B. `0 * * * *` (optional, sonst der globale Standard) |
| Benutzer + Token | Quelle | Lese-Token des Anbieters (GitLab Deploy Token, GitHub Fine-grained Token, Forgejo/Gitea Access Token) |

Entscheidungen:

- **Ein Pfad pro Quelle.** Braucht man mehrere Pfade eines Repos, legt man das Repo mehrfach als
  Quelle an, jede mit eigenem Slug. Eine Quelle entspricht damit genau einer MkDocs-Seite
  (`docs_dir`), und Dateien aus verschiedenen Pfaden können keine gleiche ID bekommen.
- **Mehrere Repos können ein Projekt bilden.** Agenten durchsuchen dann mit einer Anfrage alles,
  was zusammengehört. Wer es einfach will, legt pro Projekt eine Quelle an.

Der Admin-Bereich zeigt pro Projekt: letzten Sync, Commit, Anzahl Seiten, Snippets und Tokens,
Sync-Fehler und eine Vorschau der Snippets.

**Geheimnisse.** Zugangstokens werden nie ausgegeben – nicht in der `Edit:`-Zeile, nicht in
Fehlermeldungen, Logs oder der API. Git-URLs werden immer ohne Zugangsdaten angezeigt.

## Datenmodell (grob)

| Objekt | Inhalt |
|---|---|
| Projekt | Slug, Kurzbeschreibung |
| Quelle | gehört zu Projekt; Slug (eindeutig im Projekt), Git-URL, Branch, Pfad, Ausschlüsse, Benutzer, Token, letzter Commit, letzter Sync, Fehler/Warnungen |
| Seite | gehört zu Quelle; Dateipfad, Titel, Beschreibung, Tags, Volltext |
| Snippet | gehört zu Seite; Anker, Titelpfad, Inhalt, geschätzte Tokens – im FTS5-Index |
| Link | von Seite/Anker zu Ziel-ID; für Backlinks und tote Links |
| API-Key | Name, Hash des Keys, erlaubte Projekte (alle oder Auswahl) |

Seiten, Snippets und Links einer Quelle werden bei jedem Sync komplett ersetzt (siehe Sync).

## Zerlegung in Snippets

Gespeichert wird die ganze Seite, gesucht und ausgeliefert werden Abschnitte.

- Jede Überschrift mit ihrem Abschnitt wird ein Snippet.
- Jedes Snippet trägt seinen **Titelpfad**, damit es allein verständlich ist:
  `platform › auth-service › Deployment › Rollback`.
- Jedes Snippet verweist auf Quelle, Datei und Anker.

Beispiel: Die Seite

```markdown
# Auth-Service
## Deployment
## Rollback
## Bekannte Probleme
```

ergibt die Snippets `auth-service#deployment`, `auth-service#rollback`,
`auth-service#bekannte-probleme`.

Daraus folgt die Schreibregel für Doku: **Jeder Abschnitt muss für sich allein verständlich
sein** – aussagekräftige Überschrift, ein Satz Kontext, dann das Konkrete.

### Regeln

**Schneiden.** An jeder Überschrift; danach wird nach Größe korrigiert. Zielgröße eines
Snippets: etwa 100–800 Tokens. Der Text unter `#` vor der ersten `##` wird das Snippet
„Überblick“ und dient als Seitenbeschreibung im Index, falls das Frontmatter keine `description`
hat.

**Zu lang (über ~800 Tokens).** Erst an Unterüberschriften schneiden, sonst an Absatzgrenzen –
nie innerhalb von Codeblöcken, Tabellen oder Listen. Teile heißen `Rollback (1/2)`,
`Rollback (2/2)`. Ein einzelner Codeblock, der allein zu lang ist, bleibt ganz.

**Zu kurz (unter ~50 Tokens).** Wird in den Elternabschnitt eingegliedert. Aus `## Konfiguration`
mit den winzigen Unterabschnitten `### Port` und `### Timeout` wird ein Snippet `Konfiguration`.

**MkDocs/Zensical-Erweiterungen.**

| Element | Behandlung |
|---|---|
| Frontmatter | Metadaten (Titel, Beschreibung, Tags), nicht im Text |
| Admonitions `!!! warning "Achtung"` | `> **Achtung:** …`, Inhalt bleibt |
| Content-Tabs `=== "Linux"` | `**Linux:**`, Inhalt bleibt |
| Includes `--8<-- "datei.md"` | werden aufgelöst, Inhalt aus dem Repo eingesetzt – auch von außerhalb des Pfads (siehe Sync) |
| Mermaid | bleibt als Codeblock |
| Bilder | Alt-Text bleibt, URL entfällt |
| HTML-Kommentare | entfallen |

**Links.** Relative Links (`deploy.md#rollback`) werden zu grimoire-IDs
(`platform/auth-service/deploy#rollback`), damit Agenten ihnen mit `read` folgen können. Daraus
ergeben sich nebenbei Backlinks und tote Links für den Admin-Bereich. Ein relativer Link, der den
Pfad der Quelle verlässt, ist auch in MkDocs kaputt und gilt als tot.

**IDs.** `<projekt>/<quelle>/<datei ohne .md>#<anker>`. Anker werden genau wie in MkDocs aus der
Überschrift gebildet (doppelte bekommen `_1`, `_2`), damit grimoire-IDs und gerenderte Seite
übereinstimmen. Zensical nutzt dafür dieselbe `toc`-Erweiterung von Python-Markdown wie MkDocs.
Version 1 bildet nur deren Standard-Slugify nach; ändert eine Seite `toc.slugify` (etwa auf
`pymdownx.slugs.slugify`), weichen die Anker ab.

**Ausgabeformat.** Wie Context7, aber ohne generierte Beschreibung und mit einer „Edit:“-Zeile:

- `Source:` – grimoire-ID, damit liest der Agent per `read` weiter.
- `Edit:` – Git-URL, Branch und Datei: wo außerhalb von grimoire geändert wird. Bewusst keine
  Web-Links, deren Aufbau ist je Anbieter verschieden.

````
### platform › auth-service › Deployment › Rollback
Source: platform/auth-service/deploy#rollback
Edit: https://gitlab.thoemo.net/platform/auth-service.git (main) docs/deploy.md

Bei Fehlern nach einem Deploy auf die vorherige Version zurück:

```bash
make rollback ENV=prod VERSION=<tag>
```

> **Achtung:** Datenbank-Migrationen werden nicht zurückgerollt.
````

Keine LLM-generierte Einzeilen-Beschreibung pro Snippet in Version 1 – kostet bei jedem Sync, der
Titelpfad reicht meist.

## Suche

**Version 1: Volltext.** SQLite FTS5 mit BM25 über die Snippets, gewichtet: Titelpfad stark,
Text normal, Code schwach. Interne Doku ist voller Eigennamen und Befehle (`auth-service`,
`make rollback`), bei denen Volltext oft besser trifft als semantische Suche. Schnell, kostenlos,
kein Embedding-Modell nötig. Schwäche: Synonyme („deployen“ findet „Release-Prozess“ nicht).

**Version 2: hybrid.** Volltext und Embeddings (`sqlite-vec`) parallel, Ergebnisse per Reciprocal
Rank Fusion zusammengeführt. Kommt, sobald fehlende Synonyme in der Praxis stören.

**Ohne Projekt über alles.** `query` ohne Projekt durchsucht alle Projekte; mit Projekt wird
eingeschränkt.

**Token-Budget.** `query` füllt das Budget (`--tokens`, Standard 3.000) so:

1. beste Treffer nach Ranking holen
2. der Reihe nach einpacken, bis das Budget voll ist
3. passt ein Treffer nicht mehr, überspringen und den nächsten versuchen
4. am Ende eine Zeile mit den IDs der Treffer, die nicht mehr gepasst haben – der Agent weiß,
   dass es mehr gibt, und kann gezielt `read` aufrufen

## Sync

grimoire spricht nur Git, keine Anbieter-API. Damit funktioniert jeder Git-Server gleich.

**Prüfen (Polling nach Zeitplan).** Jede Quelle wird nach ihrem Cron-Ausdruck geprüft, ohne eigenen
nach dem globalen Standard (alle 5 Minuten). Ein Cron-Ausdruck statt eines Intervalls, weil manche
Git-Server nur wenige Anfragen erlauben und manche Quellen sich selten ändern. `git ls-remote <url> refs/heads/<branch>` liefert den
aktuellen Commit-Hash, ohne etwas herunterzuladen. Unverändert → nichts tun. Zusätzlich ein Button
„Jetzt synchronisieren“ im Admin-Bereich. Webhooks später – jeder Anbieter hat ein eigenes Format.

**Einlesen.** Flacher Sparse-Clone in ein temporäres Verzeichnis, nur der konfigurierte Pfad:

```
git clone --depth 1 --filter=blob:none --sparse --branch main <url> tmp/
git -C tmp sparse-checkout set docs
```

Includes, deren Ziel außerhalb des Pfads liegt, werden per `git -C tmp sparse-checkout add <verzeichnis des ziels>`
nachgeladen (der Cone-Modus nimmt nur Verzeichnisse), wiederholt, bis keine neuen Ziele mehr
auftauchen – Includes können selbst Includes enthalten. Das endet sicher, weil jede Runde nur noch
nicht ausgecheckte Verzeichnisse holt. Beim Einsetzen dagegen wäre ein Kreis (`a.md` → `b.md` →
`a.md`) endlos: Steckt eine Datei schon in der aktuellen Include-Kette, wird sie nicht erneut
eingesetzt, sondern als Warnung gemeldet. Fehlt ein Ziel auch im Repo, wird das als Warnung gemeldet. Danach zerlegen und das
Verzeichnis löschen. Kein dauerhafter Clone.

**Zugang.** HTTPS mit Token als Passwort; das unterstützen alle Anbieter. SSH-Deploy-Keys
eventuell später.

**Komplett neu aufbauen.** Ändert sich eine Quelle, werden alle ihre Snippets in **einer
Transaktion** gelöscht und neu geschrieben. Gelöschte und verschobene Dateien erledigen sich von
selbst; Agenten sehen nie einen halben Index. Doku-Repos sind klein – erst bei sehr großen
Beständen lohnt sich ein Abgleich pro Datei.

**Fehler.** Schlägt der Sync fehl, bleibt der letzte gute Stand aktiv; der Fehler steht im
Admin-Bereich an der Quelle. Eine kaputte Datei wird übersprungen und als Warnung gemeldet, der
Rest wird eingelesen.

**Verschobene Dateien.** Ändert sich der Pfad, ändert sich die ID, Links darauf werden tot.
grimoire zeigt tote Links im Admin-Bereich; Weiterleitungen eventuell später.

## Schnittstelle für Agenten

Vier Operationen:

```
projects                                   Projekte mit Kurzbeschreibung
index <projekt>                            Seiten und Abschnitte (aus nav bzw. Dateibaum)
query [<projekt>] "<frage>" --tokens 3000  passende Snippets bis zum Budget, ohne Projekt über alle
read <projekt>/<seite>[#abschnitt]         ganze Seite oder ein Abschnitt
```

Angeboten über **HTTP-API und MCP-Server in derselben App**. Eine CLI kommt später oder gar nicht.

- **MCP** (Remote, nur URL und API-Key): nichts zu installieren, funktioniert in Claude Code,
  Claude Desktop, claude.ai, Cursor usw. Vier Tools kosten nur einige hundert Tokens Kontext.
- **HTTP** antwortet mit Markdown statt JSON, damit Agenten auch per curl oder WebFetch zugreifen
  können:

```
GET /projects
GET /query?q=rollback&tokens=3000
GET /p/platform/index
GET /p/platform/llms.txt
GET /p/platform/query?q=rollback&tokens=3000
GET /p/platform/auth-service/deploy
GET /p/platform/auth-service/deploy?section=rollback
```

Den Teil nach `#` schicken HTTP-Clients nicht an den Server. Deshalb wird über HTTP aus dem Anker
der ID `?section=`. So kann sich ein Agent auch per HTTP von `query` zu einem einzelnen Abschnitt
hangeln, statt ganze Seiten zu laden. Über MCP bleibt die ID unverändert, inklusive `#`.

## Authentifizierung

- **Agenten:** API-Keys, im Admin-Bereich angelegt. Pro Key: alle Projekte oder eine Auswahl.
  grimoire liest nur, deshalb reicht das.
- **Admin-Bereich:** zum Start ein lokaler Admin-Account. Login per OAuth (GitLab, GitHub …) ist
  später möglich.

Doku ändern Agenten im jeweiligen Repo (Datei bearbeiten, committen). Später denkbar: eine
`write`-Operation in grimoire für Agenten ohne Checkout. Ein direkter Commit per `git push`
funktioniert bei jedem Anbieter; MR/PR wären anbieterspezifisch.

## Anleitung für Agenten

Die Anleitung liefert grimoire selbst, an einer Stelle gepflegt:

- **MCP-Instructions:** landen automatisch im Kontext, sobald der Server verbunden ist. Für
  MCP-Nutzer ist kein Block im CLAUDE.md nötig.
- **`GET /instructions`:** derselbe Text für Agenten ohne MCP. Im CLAUDE.md steht dann nur:

```markdown
## grimoire
Internal knowledge: read `curl -H "Authorization: Bearer $GRIMOIRE_KEY" https://grimoire.example/instructions`
once per session and follow it.
```

Budget: unter 250 Tokens, weil der Text dauerhaft im Kontext steht. Inhalt (Entwurf, Tonfall
später):

```markdown
grimoire is the organization's internal knowledge base: how services, tools and
processes work and how to use them.

Reading
- Before making assumptions about internal systems, call `query` with a concrete
  question. Pass the project if known, otherwise search everything.
- `query` returns matching sections within a token budget. For more context, `read`
  the ID from "Source:". Read whole pages only when needed. Over HTTP, `#anchor`
  becomes `?section=anchor`.
- No results: try other terms, then look at the project's `index`.

Writing
- grimoire is read-only. To change docs, edit the Markdown file in its source repo and
  commit. Repo, branch and file are in the "Edit:" line of each snippet.
- Search first whether the topic exists. Extend instead of creating duplicates.
- One topic per file. Every section must stand on its own: descriptive heading,
  one sentence of context, then the specifics.
```

Wann eine Änderung in grimoire ankommt, steht bewusst nicht im Text: Das Sync-Intervall ist
Sache des Betriebs und geht die Agenten nichts an.

## Stack und Betrieb

- **SvelteKit + TypeScript:** Admin-Bereich, HTTP-API und MCP-Server (offizielles TypeScript-SDK,
  Streamable HTTP) in einer App.
- **Markdown-Zerlegung mit `remark`/`mdast`:** Der Syntaxbaum kennt Überschriften, Codeblöcke,
  Listen und Tabellen – Voraussetzung für „nie im Codeblock schneiden“. Admonitions und Tabs
  werden vorher in normales Markdown umgewandelt.
- **SQLite mit FTS5:** echtes BM25 mit Gewichtung pro Spalte, eine Datei, keine zweite Datenbank.
  Embeddings später mit `sqlite-vec`. Grenze: eine Instanz – für die Wissensdatenbank einer
  Organisation ausreichend.
- **Polling** im selben Prozess per Timer.
- **Token-Zählung** geschätzt (Zeichen / 4); exakte Tokenizer unterscheiden sich je Modell.
- **Betrieb:** ein Docker-Image (Node + git), ein Volume für die SQLite-Datei, Konfiguration
  (Admin-Zugang, Polling-Intervall) per Umgebungsvariablen.

## Repository

- **Name:** grimoire
- **Lizenz:** MIT
- **Description:** Self-hosted knowledge base for AI agents. Indexes Markdown docs from your Git
  repositories into searchable snippets and serves them via MCP and HTTP.
- **Topics:** `mcp`, `ai-agents`, `documentation`, `knowledge-base`, `markdown`, `mkdocs`,
  `llms-txt`, `self-hosted`
- **README:** Einordnung zu Context7 dort, nicht in der Description („Inspired by Context7, which
  does this for public libraries.“) – beschreibend, ohne Anschein von Zugehörigkeit.

## Bewusst nicht in Version 1

| Was | Warum / wann |
|---|---|
| Web-UI zum Lesen, Editor | Menschen lesen über MkDocs/Zensical, geschrieben wird im Repo |
| Schreiben über grimoire (`write`) | erst wenn Agenten ohne Checkout schreiben müssen |
| Embeddings / hybride Suche | erst wenn fehlende Synonyme in der Praxis stören |
| Webhooks | Polling reicht; Webhook-Formate sind je Anbieter verschieden |
| CLI | HTTP und MCP decken alles ab |
| OAuth-Login, SSH-Deploy-Keys | lokaler Admin und HTTPS-Token reichen zum Start |
| Weiterleitungen für verschobene Dateien | tote Links werden angezeigt und im Repo korrigiert |
| LLM-generierte Snippet-Beschreibungen | kostet bei jedem Sync, Titelpfad reicht |
| Mehrere Instanzen / horizontale Skalierung | SQLite, eine Instanz reicht |
| Eigenes `toc.slugify` aus `mkdocs.yml`/`zensical.toml` | Version 2: Seiten mit eigener Slug-Funktion bekommen sonst andere Anker als die gerenderte Seite |
| HTML-Quellen (gerenderte MkDocs-/Zensical-Seiten) | Version 2: für Doku ohne Repo-Zugriff. HTML → Markdown, danach dieselbe Zerlegung. Offen: Inhalt je Theme herausschneiden, Änderungserkennung ohne `ls-remote`, `Edit:`-Zeile, SSO |

## Offene Themen

1. **Konzept ins Englische übersetzen** – spätestens vor dem ersten Push auf GitHub.
