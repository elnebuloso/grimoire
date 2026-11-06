# Handoff

## Where we stand

The UI redesign (milestone `m-3`, TASK-248 to TASK-267) is complete: every task is Done, and
`redesign` has been merged into `main` locally as a fast-forward. **`main` is not pushed**; the
owner pushes it. Lint, unit tests and e2e passed on exactly that tree.

The redesign adds no migration and no environment variable: an operator has nothing to do
beyond updating the image.

## Next

1. **Owner pushes `main`.** semantic-release then cuts the release from the `feat`/`fix`
   commits; expected 1.10.0 (no breaking-change marker).
2. **Release summary:** once the pipeline has published it, put a short summary at the top of the
   GitHub release with `gh release edit` (rule in `.claude/rules/memory.md`): what the redesign
   brings (app frame, source pages with tabs, lists with search and filters, dialogs, needed
   actions grouped, key and user dialogs, German glossary) and that operators need do nothing.
3. **Remove the branch `redesign`** (the owner asked for it), only after `main` is pushed:
   `git branch -d redesign` and `git push origin --delete redesign`. Confirm with the owner before
   deleting on `origin`. Afterwards, check that nothing still points to the branch: the concept
   `docs/redesign/ux-konzept.md` names it as history, which may stay.
4. Back to the normal flow on `main`: pull with `git pull --rebase origin main`.

## Decided this session (do not reopen)

- Needed actions: grouped by kind, first 5 by name, "Show all" from the sixth; warnings get a
  source-list filter `?warnings=yes`.
- "Sync now" during a running forced sync queues exactly one more run.
- API keys: dialogs, `SourcePicker` with at most 8 matches; owner filter of the admin key list
  only through `?owner=<email>` (no select), reached from the users list.
- Users: tabs via `?tab=invitations`; "Withdraw" stays a button, not in the `ActionMenu`.
- Start page: only the state of content ("Content as of" / "Not available yet"); query hits as
  plain text, **no Markdown rendering and no task for it**.
- Dead links: link to the page preview and name the repository path; no link into the repository
  (sources know no edit URL).
- Schedule field: shows the next three runs (croner), no plain-language sentence, no new
  dependency.
- German terms: `.claude/rules/glossary-de.md` is binding for every new German text.

## Working with the owner

- Decisions one question at a time, in chat, as a short table with a recommendation. An answer
  naming only an option ("a") means that option and nothing optional around it; building still
  waits for "go".
- Before a task is built, its rules go to the owner as a table; "go" after the table means build
  it. Name the points you decided yourself.
- Commit and push only on the owner's word; they often say both at once ("commit push").
- The commit type decides the release: `feat` and `fix` only for what ships; no breaking change
  marker unless asked.
- "The rules" means `.claude/rules/`; `.claude/rules/agent-plugin-charter/` comes from a plugin,
  never edit it.

## Watch out

- **Flaky under load, not broken:** in a full `make test`, `auth.spec.ts` (grant-admin child
  process) once hit its 5 s timeout; it passes alone and on the next full run. `make e2e` once
  timed out starting its web server (60 s); the rerun passed. Rerun before suspecting the code.
- **Unchecked:** `KeyScope` with more than three sources lists them in its summary as
  `<code>…</code>,` inside an `{#each}`; the same whitespace trimming that dropped the space in the
  short list (fixed this session) may affect it. Look at the "Many sources, shortened" story.
- The sidebar's count next to **Users** counts pending invitations but links to the Users tab,
  not `?tab=invitations`. Small; not raised with the owner.
- Saving an unchanged source still toasts "A sync has started" (a save asks for an unforced sync
  check). Probably as designed; never looked into.
- Phone styles still sit in parts not rebuilt (e.g. `SegmentedSwitch`, media queries in
  `app/src/app.css`); they go when that part is rebuilt. The app is desktop from 1024 px.
- Storybook 10.6.2 lags behind SvelteKit 3: no `refreshAll` in its `$app/navigation` stand-in
  (use `invalidateAll` in components), and its `enhance` never calls the submit function.
- Timings in `.claude/rules/testing-strategy.md` predate the redesign (now 116 test files, 1075
  tests, e2e about 1.5 to 2.5 min); the relative costs still hold.
- Local leftovers, ignored by git and kept: `.playwright-mcp/` (screenshots per measure `m5` to
  `m19`), `docs/redesign/screenshots/`.
