# Handoff

## Wo wir stehen

Die Pipeline von Git bis Datenbank ist fertig (Parsing, Schema mit Forward-Migrationen,
verschlüsselte Zugangstokens, Sync mit Cron pro Quelle). Darauf liegen jetzt:

- Suche mit Token-Budget (`app/src/lib/server/search/query.ts`),
- die vier Agent-Operationen `projects`, `index`, `query`, `read` samt Anleitungstext
  (`app/src/lib/server/agent/`),
- API-Keys mit Projekt-Scope (`app/src/lib/server/api-keys.ts`).

Noch nicht gebaut: alles, was nach außen geht – HTTP, MCP, Admin-Bereich, Docker-Image.

Details stehen nicht hier, sondern
- in den „Handoff …“-Notizen der Backlog-Tasks – vor jedem Task lesen
  (`backlog task view TASK-n --plain`), für die nächsten Schritte vor allem TASK-10 und TASK-11,
- in `docs/decisions/0001-sqlite-single-instance-with-forward-migrations.md` (Status `Proposed`),
- in `docs/handbook/database.md` (Variablen, Volume, Zeitplan, Backups).

## Als Nächstes

TASK-12 (HTTP-API), dann TASK-13 (MCP-Server). Beide rufen nur noch `scopeForKey` und die
Operationen aus `agent/operations.ts` auf; `found: false` wird bei HTTP zu 404 mit derselben
Markdown-Meldung. TASK-29 (Migrationen zusammenfassen) kommt ganz am Ende von Version 1.

## Offene Entscheidungen

- **Wie entsteht ein echter API-Key vor TASK-17?** Der Admin-Bereich fehlt noch, TASK-13 verlangt
  aber einen Test mit echtem MCP-Client, und auch TASK-12 von Hand braucht einen Key. Optionen:
  `make`-Target, das `createApiKey` aufruft und den Key einmal ausgibt, oder TASK-17 vorziehen.
- **Formatierungs-Commit `test(search): format the search spec`** vor dem Push in den
  `fix(search)`-Commit davor einschmelzen? Angeboten, nicht entschieden.
- `make setup` (`.env` aus `.env.example` anlegen, Schlüssel erzeugen, `npm ci`) – vorgeschlagen,
  nicht entschieden.

## Offen vor dem Release

- Login per HTTP-Basic (`username:token` als `http.<url>.extraHeader`) ist nur über `file://`
  getestet, nicht gegen GitLab/GitHub/Forgejo/Gitea (Notiz in TASK-7).
- Wie lange Parsing und Schreiben großer Repos den Hauptthread blockieren, ist nicht gemessen
  (TASK-27).
- Suchgewichte 10 / 1 / 0,25 (Titelpfad / Text / Code) sind ein Startwert, nicht an echter Doku
  geprüft. Der Test legt nur die Reihenfolge fest.
- `index` ordnet nach Dateibaum, nicht nach `nav` aus `mkdocs.yml`/`zensical.toml` – die wird
  nirgends eingelesen. Kein Task dafür.

## Stolperfallen

- **`scopeForKey`: `{ scope: undefined }` heißt alle Projekte, nur `undefined` heißt ablehnen.**
  Wer auf `!result?.scope` prüft, lehnt All-Keys ab; wer nur `result?.scope` weiterreicht, lässt
  ungültige Keys alles sehen. Prüfen: `if (!result) → 401`.
- **IDs können Leerzeichen und andere Zeichen enthalten** (Dateinamen bleiben wie geschrieben) –
  bei HTTP URL-kodieren/-dekodieren (Notiz in TASK-10).
- **`instructions.md` wird per `?raw` importiert** – im Produktions-Build noch nicht wirklich
  geprüft, weil bisher keine Route die Operationen importiert. Mit TASK-12 `make build` laufen
  lassen und `/instructions` aufrufen.
- **Anleitungstext gibt es zweimal:** maßgeblich ist `app/src/lib/server/agent/instructions.md`,
  der Entwurf in `docs/konzept.md` ist nur noch historisch.
- **Exit-Codes nicht durch eine Pipe prüfen:** `make lint | tail` meldet Erfolg, auch wenn Lint
  fehlschlägt. Ausgabe in eine Datei im Scratchpad, Exit-Code separat.
- **Frischer Clone:** `app/.env` ist nicht im Repo. `cp app/.env.example app/.env`, dann
  `TOKEN_ENCRYPTION_KEY` mit `openssl rand -base64 32` füllen und `npm --prefix app ci` –
  sonst startet `make dev` nicht.
- **SvelteKit 3 weicht von SvelteKit 2 ab** (`#lib`, `$app/env/private`, `defineEnvVars`) – steht
  in `.claude/rules/memory.md`.
- **Node 24 nötig**, nirgends festgelegt: `node:sqlite`, und Tests laden `.ts` direkt in
  Kindprozessen.
- **`make test` dauert ~8 s** – die Gleichzeitigkeitstests starten echte Prozesse. Gewollt.
- **croner bleibt auf 10.0.1** (11.0.0 war beim Einbau zwei Tage alt).
- **Prozesse über die PID beenden**, nicht mit `pkill -f "vite dev"` – das Muster steht in der
  eigenen Kommandozeile und beendet die Shell mit.
- **Temporäres ins Scratchpad**, nicht nach `/tmp`: `rm -rf` mit Platzhaltern in `/tmp` blockiert
  der Auto-Mode.
- **Diese Datei wird nicht committet.**
