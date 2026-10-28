# Handoff

## Wo wir stehen

Version 1 ist funktional komplett. Der Admin-Bereich verwaltet Projekte und Quellen (TASK-15),
zeigt den Status einer Quelle mit Seitenvorschau und „Sync now“ (TASK-16), legt API-Keys an und
widerruft sie (TASK-17), und das Admin-Passwort lässt sich ändern (TASK-32). Playwright-Tests
decken die Admin-Abläufe im Browser ab (TASK-34, `make e2e`). Das Docker-Image baut `make image`
(TASK-18); es wird noch nirgends veröffentlicht. `make api-key` gibt es nicht mehr, Keys kommen
aus dem Admin-Bereich.

Details stehen in den Notizen der Backlog-Tasks (`backlog task view TASK-n --plain`), im
Handbuch (`docs/handbook/`) und in `.claude/rules/memory.md`.

## Als Nächstes

1. **TASK-35** Tests in der GitHub-Pipeline vor dem Release (HIGH). Heute läuft in CI nur
   semantic-release (`.github/workflows/release.yml`), ohne Tests.
2. **TASK-36** Docker-Image bei jedem Release nach Docker Hub (HIGH, hängt an TASK-35).
3. TASK-19 (Handbuch für Betreiber und Agenten), TASK-20 (Konzept auf Englisch).
4. TASK-29 (Migrationen zusammenfassen) kurz vor `1.0.0`.
5. **TASK-37** Frontend-Design ganz am Ende; abgeschlossen erst, wenn der Nutzer das Design
   ausdrücklich bestätigt.

## Offene Entscheidungen

- **TASK-36:** Name des Docker-Hub-Repos; Image-Tag `0.2.0` oder `v0.2.0`; ob `latest`
  mitgezogen wird. Der Nutzer hat nur `DOCKER_USERNAME`/`DOCKER_PASSWORD` und „nach dem
  Release-Step auf `main`“ festgelegt.
- `make setup` (`.env` anlegen, Schlüssel erzeugen, `npm ci`) – vorgeschlagen, nicht entschieden.

## Offen vor dem Release 1.0

- Login per HTTP-Basic nur über `file://` getestet, nicht gegen GitLab/GitHub/Forgejo/Gitea
  (TASK-7). Synchronisiert wurde bisher nur das öffentliche GitHub-Repo ohne Token.
- Blockieren großer Repos im Hauptthread nicht gemessen (TASK-27).
- Suchgewichte 10 / 1 / 0,25 sind ein Startwert, nicht an echter Doku geprüft.
- `index` ordnet nach Dateibaum; `nav` aus `mkdocs.yml`/`zensical.toml` wird nicht gelesen.
- `npm audit`: moderate Meldungen in `vitest` und `@sveltejs/vite-plugin-svelte`, nicht angefasst.

## Stolperfallen

- **Die Bash-Shell des Agenten startet mit Node 24.21.0**, obwohl nvm `default` auf 24.22.1
  steht. Vor `npm`, `make e2e` oder `make build`: `source ~/.nvm/nvm.sh && nvm use 24.22.1`.
  `npm ci` bricht sonst an `engine-strict` ab; `make test` läuft zufällig auch so.
- **`npx sv add …` installiert nichts**, es schreibt nur Dateien. Abhängigkeiten installiert der
  Nutzer (`npm --prefix app install`), nicht der Agent (`.claude/rules/svelte-kit.md`).
- **E2E-Tests laufen seriell und bauen aufeinander auf** (`app/src/routes/admin/admin.e2e.ts`):
  das Setup zuerst, der Passwort-Wechsel zuletzt. Neue Tests vor den Passwort-Test stellen.
  Den Setup-Token lesen sie aus dem Server-Log in `$E2E_DIR` (Temp-Verzeichnis, gesetzt in
  `app/playwright.config.ts`); jeder Lauf lässt dort ein Verzeichnis `grimoire-e2e-*` liegen.
- **Für CI (TASK-35):** `make e2e` lädt nur Chromium (`playwright install chromium`), ohne
  Systempakete. Auf einem nackten Runner fehlen die vermutlich – `--with-deps` prüfen.
  Ungetestet.
- **Hydration setzt Eingaben zurück.** Ein Feld mit `value={…}`, in das getippt wird, bevor die
  Seite hydriert ist, verliert den Text. Login und Setup haben deshalb `csr = false`. Die anderen
  Formulare erreichen die E2E-Tests per Klick (nach der Hydration); ein `page.goto` mit sofortigem
  `fill` auf diese Seiten wird flaky.
- **Admin-Formulare per curl:** POST ohne Body gibt 415 → `-d ""`. Über `http` außerdem
  `PROTOCOL_HEADER=x-forwarded-proto` am Server und `-H X-Forwarded-Proto:http -H Origin:<url>`.
  Mit `-H 'x-sveltekit-action: true'` kommt das Ergebnis der Action als JSON.
- **MCP per curl** braucht `Accept: application/json, text/event-stream`, sonst lehnt der
  Transport ab.
- **Quelle speichern startet einen erzwungenen Sync** (ohne darauf zu warten) und leitet auf die
  Quellseite. Ein gespeicherter Token geht nicht an einen anderen Server: Ändert sich die Origin
  der Git-URL, muss der Token neu eingegeben oder entfernt werden.
- **Docker-Image:** Basis `node:24.22.1-trixie-slim` – 24.22.1 war beim Einbau 9 Tage alt,
  Ausnahme von der Zwei-Wochen-Regel als Sicherheits-Release. Das Image kopiert für
  `scripts/reset-admin.ts` nur `app/src/lib/server/admin/auth.ts`; importiert `auth.ts` je etwas
  anderes als `node:`-Module, bricht das Skript im Container.
- **`docker exec -it` braucht ein Terminal.** Ohne TTY im Agenten:
  `printf 'admin\n' | script -qec "docker exec -it <container> node scripts/reset-admin.ts" /dev/null`.
- **Jeder Push mit `feat`/`fix` ist ein Release.** Commit-Typ nach dem wählen, was ausgeliefert
  wird.
- **Modulzustand in `admin/auth.ts`** (Setup-Token, Fehlversuche – auch die des Passwort-Wechsels
  –, „Admin gesehen“). Tests brauchen `vi.resetModules()` und einen dynamischen Import.
- **`scopeForKey`: `{ scope: undefined }` heißt alle Projekte**, nur `undefined` heißt ablehnen.
- **Skripte in `scripts/` laufen mit reinem `node`** ohne `import.meta.glob`: Sie migrieren
  nicht, importierte `.ts`-Dateien brauchen die Endung und dürfen nur `node:`-Module importieren.
- **Testserver über die PID beenden, die `ss -ltnp` zum Port zeigt**, nicht über `$!`.
- **Zensical:** neue Handbuch-Seiten brauchen einen Eintrag in `nav` in `zensical.toml`;
  `make handbook` baut strikt.
- **Neue Abhängigkeiten:** mindestens zwei Wochen alt und exakt festlegen (zuletzt
  `@playwright/test` 1.64.1). Ausnahme: Sicherheitsfixes.
- **`git pull --rebase` meldete einmal „Cannot rebase onto multiple branches“**, Ursache nicht
  geklärt. Kommt es wieder: `git fetch` und `git rebase origin/main` getrennt ausführen.
- **Exit-Codes nicht durch eine Pipe prüfen:** Ausgabe in eine Datei im Scratchpad, Exit-Code
  separat.
- **Playwright-MCP schreibt `.playwright-mcp/` ins Repo** (nicht ignoriert) – nach Gebrauch
  löschen.
- **Frischer Clone:** `cp app/.env.example app/.env`, `TOKEN_ENCRYPTION_KEY` mit
  `openssl rand -base64 32` füllen, `npm --prefix app ci`.
- **Diese Datei ist bewusst committet** (Entscheidung des Nutzers).
