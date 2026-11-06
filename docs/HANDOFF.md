# Handoff

## Where we stand

The UI redesign runs on the branch **`redesign`**; 1.9.0 is still the latest release. Everything
ships in one merge to `main` at the end (the owner's decision); `main` gets nothing until then.

- Concept: `docs/redesign/ux-konzept.md` (German, accepted). The backlog is binding where it
  differs: milestone `m-3`, measures M1–M19 = TASK-248–TASK-266.
- **Done:** stage A (TASK-248, -249, -250, -251, -260) and stage B up to the lists: app frame
  (TASK-252), auth layout (-255), account tabs and first-login welcome (-254), management sidebar
  and `/manage/sources` (-253), source page with head and four tabs (-256), source form in four
  sections (-257), `DataTable` with search, filter, sort and pages for every list (-258).
- **Owner decisions this session**, already written into tasks and rules:
  - grimoire is a **desktop web application** from 1024 px; no phone layout
    (`.claude/rules/ui-components.md`). Phone criteria left TASK-252, -253, -258.
  - "Sync now" during a running forced sync queues exactly one more run → **TASK-267** (open,
    `bug`, no milestone yet).
  - The slug hint shows once in full in the dialog, one line on the page (done in TASK-256).
  - The user menu links to `/account` as "Login and password" (kept for good).

## Next

1. **TASK-259 (M12)** needed actions. The rules were drafted but **not yet shown to the owner**;
   give them the table first:
   - groups by kind: sync errors, duplicates, dead links, warnings, paused, never synced; each with
     a count and the first 5 entries;
   - "Show all" → `/manage/sources?status=error|paused|never`, `/manage/dead-links`,
     `/manage/duplicates`. **Warnings have no filter yet**: `SOURCE_LIST` in
     `app/src/lib/server/source-list.ts` would need one, or warnings get no "Show all" — ask;
   - duplicate hint on the Status tab of both sources, linking the other one;
   - the fix hint (`FIX` in `app/src/routes/manage/+page.svelte`) under the error on the Status tab,
     with a link to Settings.
2. Then the rest of `m-3`: TASK-261 (key dialogs, `SourcePicker`), TASK-262 (users page; its
   search is done by TASK-258, the task still asks for tabs, invite dialog, action menu),
   TASK-263 (start page), TASK-264 (error pages), TASK-265 (wording, German glossary),
   TASK-266 (cron in words).
3. Ask whether TASK-267 joins `m-3` (ships with the merge) or goes to `main` on its own.

## Working with the owner

- Decisions one question at a time, in chat, as a short table with a recommendation. An answer
  naming only an option ("a") means that option and nothing optional around it.
- Before a task is built, its rules go to the owner as a table; "go" after the table means build
  it. Name the points you decided yourself where the concept leaves them open.
- Commit and push only on the owner's word. Pull with `git pull --rebase origin redesign`; stash
  an uncommitted `docs/HANDOFF.md` first or the rebase stops.
- The commit type decides the release: `feat` and `fix` only for what ships; no breaking change
  marker unless asked. The `feat` commits on `redesign` release with the merge.
- "The rules" means `.claude/rules/`; `.claude/rules/agent-plugin-charter/` comes from a plugin,
  never edit it.

## Watch out

- **Source page = one route** `app/src/routes/manage/sources/[id]/[[tab=tab]]/` for Status (no
  segment), `pages`, `history`, `settings` and `new`. One component keeps actions, head and the
  sync poll, so the poll survives a tab change. Matcher `tab` in `app/src/params.ts`.
- **Lists:** `app/src/lib/list.ts` reads and applies `search`, filters, `sort` (`-` = descending)
  and `page` on the server. The parameter is `search` because the start page uses `q` for its
  query. Two conventions nothing checks: the first sortable `DataTable` column must be the first
  key of the list's `sorts`, and a `defaultSort` must be passed to both the spec and the
  `DataTable` (only missed queries uses one).
- **State words** come only from `StatusBadge`; the state itself from `sourceState` in
  `app/src/lib/source-state.ts` (badge and status filter share it).
- **Source form:** "Test connection" now stands before "Save"; a hidden first submit button
  (`.default-submit`) keeps Enter saving. Checked only in Chromium.
- **User menu** (`UserMenu.svelte`) is a native popover placed by script on opening; clicked
  before hydration it shows at the top left. Escape and focus return are checked by hand only.
- **Full loads left on purpose**, each with its reason in the code: language switch, log out,
  "Log in" link, provider linking; plus the five `csr = false` pages.
- **Old links** keep working: `/manage/sources/<id>#settings` (replaced on the client) and
  `?preview=` without a tab (redirect to `pages`).
- Saving an unchanged source still toasts "A sync has started" (a save asks for an unforced sync
  check). Seen this session, not looked into; probably as designed.
- **Not built on purpose:** breadcrumbs (chapter 11 of the concept), the phone card view of
  tables, `RequestsPerDay` as `DataTable` (its small table sits folded inside a cell).
- **Phone styles** still sit in pages and components not rebuilt yet (e.g. `SegmentedSwitch`,
  media queries in `app/src/app.css`); they go when that part is rebuilt.
- German labels "Management" and "Account" were chosen without the glossary of TASK-265.
- **Storybook 10.6.2 lags behind SvelteKit 3:** no `refreshAll` in its `$app/navigation`
  stand-in (use `invalidateAll` in components), and its `enhance` never calls the submit function.
- **e2e (`manage.e2e.ts`)** helpers: `openSources`, `sourceTab`, `syncing`, `logOut`, `area`,
  `sidebar`. Wait for the URL after an area click before using `getByLabel`: the start page's
  search field also matches "Name".
- The 500-source check used a one-off script; if it is needed again, it becomes a Make target
  (rule in `make.md`). Reset the agent environment afterwards.
- Timings in `.claude/rules/testing-strategy.md` predate the redesign (now 109 test files, 1044
  tests, e2e about 1.5 min); the relative costs still hold.
- Local leftovers, ignored by git and kept: `.playwright-mcp/` (screenshots per measure in `m5`
  to `m11`, audit images), `docs/redesign/screenshots/`.
