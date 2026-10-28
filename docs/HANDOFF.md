# Handoff

## Wo wir stehen

grimoire ist nach außen benutzbar: Git-Sync, Suche, HTTP-API (Markdown, inkl.
`/p/<project>/llms.txt`), MCP-Server unter `/mcp` (SDK v2, stateless, nur API-Key, kein OAuth)
und Admin-Login. Der Admin wird beim Erststart im Browser eingerichtet, mit einem Setup-Token
aus dem Server-Log. Ein vergessenes Passwort setzt `node scripts/reset-admin.ts` im Container
zurück, nach Eingabe des Admin-Benutzernamens im Terminal.

Releases laufen automatisch: Jeder Push auf `main` mit `feat`/`fix` seit dem letzten Tag erzeugt
per semantic-release einen Release. Das Handbuch (`docs/handbook/`) erscheint per Zensical unter
https://elnebuloso.github.io/grimoire/, mit `llms.txt`, Logo und „Copy as Markdown“.

Die Admin-Seiten bestehen bisher nur aus Formularen für Setup, Login und Logout. Projekte,
Quellen und Keys lassen sich noch nicht verwalten; Keys kommen solange aus `make api-key`.

Details stehen in den Notizen der Backlog-Tasks (`backlog task view TASK-n --plain`), im
Handbuch und in `.claude/rules/memory.md`.

## Als Nächstes

1. **TASK-15** Admin: Projekte und Quellen (HIGH). Muster für Actions und Tests:
   `app/src/routes/admin/*/+page.server.ts` und `app/src/routes/admin/admin.spec.ts`.
2. **TASK-34** Playwright-End-to-End-Tests, sobald TASK-15 steht. `npx sv add playwright` führt
   der Nutzer aus, nicht der Agent (`.claude/rules/svelte-kit.md`).
3. **TASK-16** Status und Sync → **TASK-17** API-Keys (danach kann `make api-key` weg) →
   **TASK-18** Docker-Image.
4. Jederzeit: TASK-32 (Passwort ändern), TASK-19/20 (Handbuch, Konzept auf Englisch).
   TASK-29 (Migrationen zusammenfassen) ganz am Ende von Version 1.

## Offene Entscheidungen

- `make setup` (`.env` anlegen, Schlüssel erzeugen, `npm ci`) – vorgeschlagen, nicht entschieden.
- Storybook erst, wenn die Designphase beginnt (`until-v1.md`). Bis dahin: kein eigenes Styling
  im Frontend; das Favicon (= Logo) hat der Nutzer ausdrücklich freigegeben.

## Offen vor dem Release 1.0

- Login per HTTP-Basic nur über `file://` getestet, nicht gegen GitLab/GitHub/Forgejo/Gitea
  (TASK-7).
- Blockieren großer Repos im Hauptthread nicht gemessen (TASK-27).
- Suchgewichte 10 / 1 / 0,25 sind ein Startwert, nicht an echter Doku geprüft.
- `index` ordnet nach Dateibaum; `nav` aus `mkdocs.yml`/`zensical.toml` wird nicht gelesen.
- `npm audit`: moderate Meldungen in `vitest` und `@sveltejs/vite-plugin-svelte`, nicht angefasst.

## Stolperfallen

- **Jeder Push mit `feat`/`fix` ist ein Release.** Den Commit-Typ nach dem wählen, was
  ausgeliefert wird; `chore`/`docs`/`ci`/`test` releasen nichts.
- **Kein `ORIGIN` mehr (adapter-node 6).** Die App nimmt `https` an; über reines `http` scheitert
  jedes Admin-Formular mit 403 (`Cross-site POST form submissions are forbidden`). Lokal testen
  mit `PROTOCOL_HEADER=x-forwarded-proto` und dem Header `X-Forwarded-Proto: http`. Hinter einem
  Proxy außerdem `ADDRESS_HEADER`, sonst zählen Fehlversuche beim Login für den Proxy.
- **`scopeForKey`: `{ scope: undefined }` heißt alle Projekte**, nur `undefined` heißt ablehnen.
  `scopeForRequest` in `agent/http.ts` kapselt das; HTTP und MCP nutzen beide diese Funktion.
- **Modulzustand in `admin/auth.ts`** (Setup-Token, Fehlversuche, „Admin gesehen“). Tests brauchen
  `vi.resetModules()` und einen dynamischen Import, sonst sickert Zustand zwischen Tests durch.
  `$app/env/private` lässt sich mit `vi.mock` mocken.
- **Skripte in `scripts/` laufen mit reinem `node`** (Type-Stripping, `node:sqlite`) ohne
  `import.meta.glob`: Sie migrieren nicht. Die Datenbank muss einmal vom Server angelegt
  worden sein. Importierte `.ts`-Dateien brauchen deshalb die Endung im Import und dürfen nur
  `node:`-Module importieren.
- **Testserver über die PID beenden, die `ss -ltnp` zum Port zeigt.**
  `cd app && node build &` schickt eine Subshell in den Hintergrund, `$!` trifft dann nicht den
  Node-Prozess – so blieb in dieser Session ein Server stundenlang laufen.
- **Node ≥ 24.22.1** (`engines` + `engine-strict`): ältere Versionen haben die Brotli-Lücke
  CVE-2026-111497, und `npm ci` bricht dort ab. Lokal per nvm als `default` gesetzt.
  `process.versions.brotli` zeigt trotz Fix `1.2.0`; maßgeblich ist, ob
  `zlib.constants.BROTLI_DECODER_ERROR_FORMAT_BLOCK_SWITCH` existiert. Für TASK-18 ein
  Node-Basis-Image nehmen, nicht das Debian-Paket `nodejs`.
- **Zensical:** `make handbook` legt Python 3.12 fest, weil uv sonst Zensical aus dem Quellcode
  baut (braucht Rust). Neue Handbuch-Seiten brauchen einen Eintrag in `nav` in `zensical.toml`.
  `sections = ["index.md", "*.md"]` erfasst nur die oberste Ebene; Unterordner brauchen ein
  eigenes Muster, sonst fehlen sie in `llms.txt` und haben keinen Copy-Button.
- **Neue Abhängigkeiten:** Versionen mindestens zwei Wochen alt und exakt festlegen (croner
  10.0.1, `@modelcontextprotocol/server` 2.3.1, zod 4.6.7). Ausnahme: Sicherheitsfixes.
- **Playwright-MCP schreibt `.playwright-mcp/` ins Repo** (nicht ignoriert) – nach Gebrauch
  löschen.
- **`git pull --rebase` meldete einmal „Cannot rebase onto multiple branches“**, obwohl das
  Tracking von `main` stimmt; der Push war ein Fast-Forward. Ursache nicht geklärt. Kommt es
  wieder: `git fetch` und `git rebase origin/main` getrennt ausführen.
- **Exit-Codes nicht durch eine Pipe prüfen:** `make lint | tail` meldet Erfolg, auch wenn Lint
  fehlschlägt. Ausgabe in eine Datei im Scratchpad, Exit-Code separat.
- **Frischer Clone:** `cp app/.env.example app/.env`, `TOKEN_ENCRYPTION_KEY` mit
  `openssl rand -base64 32` füllen, `npm --prefix app ci`.
- **Temporäres ins Scratchpad**, nicht nach `/tmp`.
- **Diese Datei ist bewusst committet** (Entscheidung des Nutzers).
