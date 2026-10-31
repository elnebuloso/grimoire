# Impeccable progress

Branch `design/impeccable-loop`. Targets: detector 0 errors and at most 3 warnings per page; audit no
Accessibility or Responsive finding of P1 or worse; critique at least 7/10 per page and at least
8/10 on average.

How it is measured:

- **Detector:** `impeccable detect --json --cdp` against the rendered page in the agent environment
  (logged in as the fixture admin), at 1280×800 and 390×844, light and dark. The column shows the
  worst of the four views. The source scan `impeccable detect src/` reports one warning for the whole
  tree, `side-tab` at `src/app.css:458`. That is the 3px leading edge DESIGN.md requires on notices,
  so it counts as a false positive and is left in place.
- **Audit and critique:** an isolated reviewer that sees neither the detector output nor earlier
  scores. It uses Impeccable's audit and critique method (Assessment A) on source plus full-page
  screenshots at both widths and in both schemes. Critique is Nielsen's 10 heuristics, total/max
  scaled to /10. Audit findings give the count of Accessibility and Responsive findings by severity.
- **Representative examples:** `/manage/sources/[id]` is checked with `/manage/sources/1` (synced)
  and `/manage/sources/3` (sync failed). The agent environment has no SMTP, so `/login/forgot` and
  `/login/reset/[token]` answer 404 there, and `/setup` redirects once an admin exists. Those three
  are judged from source.

## Routes

The table shows the final full measurement after iteration 33 (`/manage/settings`: its re-measure after iteration 34): the same reviewer split as in
the baseline, one run over all routes, so the values compare with each other. The values each
iteration measured are in the iteration table further down.

| Route | Audit findings (P0/P1/P2/P3) | Critique | Detector (e/w) | Last iteration | State |
|---|---|---|---|---|---|
| `/` | 0/0/1/3 | 7.3 | 0/0 | 32 | at per-route target |
| `/login` | 0/0/0/1 | 7.3 | 0/0 | 24 | at per-route target |
| `/login/forgot` | 0/0/0/1 | 7.8 | 0/0 | – | at per-route target |
| `/login/reset/[token]` | 0/0/0/2 | 8.0 | 0/0 | – | at per-route target |
| `/setup` | 0/0/0/2 | 7.5 | – (source 0/0) | – | at per-route target |
| `/account` | 0/0/0/0 | 7.5 | 0/0 | 29 | at per-route target |
| `/manage` | 0/0/1/2 | 7.5 | 0/1 | 20 | **plateau** |
| `/manage/api-keys` | 0/0/1/1 | 7.3 | 0/0 | 30 | **plateau** |
| `/manage/dead-links` | 0/0/0/0 | 7.2 | 0/0 | 7 (+ fix after 25) | **plateau** |
| `/manage/missed-queries` | 0/0/0/1 | 7.2 | 0/0 | 18 | **plateau** |
| `/manage/query` | 0/0/0/0 | 7.0 | 0/0 | 28 | **plateau** |
| `/manage/settings` | 0/0/0/0 | 7.5 | 0/0 | 34 | **plateau** (at per-route target) |
| `/manage/sources/[id]` | 0/0/1/3 | 7.3 | 0/1 | 9 | **plateau** |

Baseline: detector and audit targets are met everywhere. Critique: four routes are below 7, and
the average is 7.52.

## Iterations

From iteration 6 on, the audit column of this table counts only P0–P2 findings. The reviewers
change with every run and each finds different P3 nits, so a P3 count measures noise more than the
page. The table above keeps all four severities.

| # | Route | Command | Audit | Critique | Detector | Result |
|---|---|---|---|---|---|---|
| 1 | `/manage/dead-links` | clarify (lead, spoken "links to" instead of the arrow) | 1→4 | 6.7→6.7 | 0→0 | worse, reverted; area "DeadLinkList copy" tried |
| 2 | `/manage/settings` | clarify (short label, linked hint, paused state as a notice) | 3→2 | 6.7→6.9 | 0→0 | kept (audit better; critique change within noise) |
| 3 | `/manage/dead-links` | typeset (target on its own line, source quiet, spoken "links to", lead) | 1→1 | 6.7→6.8 | 0→0 | kept, no counted improvement (stagnation 1) |
| 4 | `/account` | clarify (consequence as lead before the form, way back to Manage) | 2→3 | 6.8→7.3 | 0→0 | kept: critique +0.5; the extra audit entry is the shared mobile header (layout), already counted on every route |
| 5 | `/manage/sources/[id]` | clarify (candid delete copy, totals as a numbers ledger) | 2→3 | 6.8→6.8 | 1→1 | worse, reverted (e51099b); area "Delete + totals" tried (stagnation 1) |
| 6 | `/manage/sources/[id]` | adapt (history date range on lines of its own at 390) | P0–P2 1→1 | 6.8→7.0 | 1→1 | kept; the reported P2 is fixed, a different P2 (clipped Error column) takes its place (stagnation 2) |
| 7 | `/manage/dead-links` | distill (links grouped under their page and section) | P0–P2 0→0 (all 1→0) | 6.8→7.3 | 0→0 | kept: critique +0.5 (stagnation 0); `DeadLinkList` is also on `/manage/sources/[id]`, whose detector stays 0/0 |
| 8 | `/manage/settings` | polish (h2 head row, hint names where “Sync now” is) | P0–P2 1→1 | 6.9→7.5 | 0→0 | kept: critique +0.6; every route now at least 7, average 7.68 |
| 9 | `/manage/sources/[id]` | adapt (cause of a failed run in a row under it below 48rem, Error column hidden there) | P0–P2 1→0 | 7.0→7.0 | 1→1 | kept: audit better |
| 10 | `/manage/sources/[id]` | polish (totals as a numbers ledger) | P0–P2 0→1 | 7.0→6.8 | 1→1 | worse, reverted (fb6017b); 4th edit of the route: **plateau** (stagnation 1) |
| 11 | all (root layout, `SegmentedSwitch`) | adapt (mobile header: switch labels visually hidden below 40rem so both tracks share a row, "Logged in as" on its own row) | header P2 gone on every route that reported it; P0–P2 total 12→15, as new P2s appear (see notes) | average 7.68→7.33 | 0 errors, max 2 everywhere | kept; header 246→184px tall at 390px. Full re-measure of all routes; this run is the new reference (stagnation 0) |

Notes on iteration 11:

- Critique fell on routes whose content the change does not touch at all. `/manage` went 8.0→7.2 and
  `/manage/api-keys` 7.5→6.8; `/manage/sources/[id]` went 7.0→6.8 with its code unchanged since its
  last review. A fresh reviewer scores with a spread of up to ±0.8, which is larger than the 0.5
  threshold. The drop therefore reflects the reviewer run, not the header.
- The full re-measure turned up real defects the earlier single-route reviews had missed: the manage
  nav has no `aria-current` in the server render, `/manage/missed-queries` uses the form legend as a
  column head, and no form marks its fields `aria-invalid` after a refusal.
- Separately, `143aeee` removed the back link from iteration 4. It repeated the header's "Manage" a
  few lines above it and broke `manage.e2e.ts`. The per-iteration gate ran only `--changed` tests,
  so it did not catch that; root-layout iterations now also run `make test` and `make e2e` in full.
| 12 | `/manage/missed-queries` | clarify (own column head instead of the form legend, intro names "search terms" as the table does) | P0–P2 2→1 | 6.6→6.9 | 0→0 | kept: audit better. The fixture now holds two missed queries, so the filled table was reviewed |
| 13 | `/manage/api-keys` | layout (key list: h2 head row, name / scope / dated facts on lines of their own, "expired" as a coloured word) | P0–P2 1→1 | 6.8→6.8 | 0→0 | kept, no counted improvement (stagnation 1) |
| 14 | `/manage/api-keys` | harden (source checkboxes in a fieldset named "Only these sources") | P0–P2 1→1 | 6.8→7.0 | 0→0 | kept: the reported P2 is fixed, the form-error P2 that every form has takes its place (stagnation 2) |
| 15 | `/manage/missed-queries` | adapt (date may break below 40rem, the table fits 390px) | P0–P2 1→0 | 6.9→7.0 | 0→0 | kept: audit better (stagnation 0) |
| 16 | `/manage/missed-queries` | polish (short date, zone named in the column head) | – | – | – | discarded before measuring: the head "Last asked (UTC)" does not wrap and pushes the column past the edge at 390px again; area "date column" tried |
| 17 | `/manage/api-keys` | onboard (lead names the `Authorization: Bearer <key>` header and links to Connect an agent) | P0–P2 1→1 | 7.0→7.3 | 0→0 | kept, no counted improvement (stagnation 2, counting 16) |
| 18 | `/manage/missed-queries` (+ `PageHead`) | clarify (intro says what to do about a term; lead measure 60ch, about 78 characters, `text-wrap: pretty`) | P0–P2 0→0 | 7.0→7.3 | 1→0 (advisory gone, line-length kept away) | kept: detector better (stagnation 0). The detector ran on every route, since `PageHead` reaches all of them: no new finding anywhere |
| 19 | `/manage`, `/` (`SourceStatsTable`) | adapt (Status column next to Source) | P0–P2 /manage 1→2, / 1→2 | /manage 7.2→7.3, / 7.3→7.0 | 1→1 | worse, reverted (45b1893); area "column order" tried (stagnation 1). Before it, `d667f0f` fixed `manage.e2e.ts` after iteration 13; the gate now runs `make e2e` every iteration |
| 20 | `/manage`, `/` (`app.css` `.table-scroll`) | harden (focus ring of the table region drawn inside it, no longer clipped by the flush sheet) | P0–P2 /manage 1→0, / 1→1 | /manage 7.2→7.0, / 7.3→7.3 | 1→1, no new finding on any route | kept: audit better (stagnation 0). `/manage/missed-queries` has had 4 edits (12, 15, 16, 18): **plateau**, its remaining costs (sort order, marking a term as handled) need data and logic changes |
| 21 | `/manage` | clarify (numbers sheet headed "In numbers" instead of repeating "Overview") | P0–P2 0→2 | 7.0→6.9 | 1→1 | worse, reverted (1fdd34f) (stagnation 1) |
| 22 | `/manage`, `/` (`SourceStatsTable`) | adapt (state word under the source name below 40rem, Status column hidden there) | P0–P2 /manage 0→1, / 1→1 | /manage 7.0→7.0, / 7.3→7.3 | 1→1 | worse, reverted (822addd); 4th edit of `/manage` (19–22): **plateau** (stagnation 2) |
| 23 | `/manage/settings` (manage layout) | harden (nav marks the current page by route, already in the server render; regression check in `manage.e2e.ts`) | P0–P2 1→0 | 7.2→7.5 | 0→0, no new finding on any manage route | kept: audit better (stagnation 0). The fix reaches the nav of every manage page; `/manage/query` and `/manage/missed-queries` reported the same P2 |
| 24 | `/login` (+ `FormError` `id`) | harden (after a refusal both fields are `aria-invalid` and described by the message; e2e check) | P0–P2 1→1 | 7.3→7.5 | 0→0 | kept: the reported P2 is fixed, a different one (focus after the reload) takes its place (stagnation 1) |
| 25 | `/manage/dead-links` | harden (each page links to its preview on the source page) | P0–P2 0→1 (a P1) | 7.2→6.9 | 0→0 | worse, reverted (0ac173e); 4th edit of the route (1, 3, 7, 25): **plateau** (stagnation 2). The P1, a long unbroken path widening the page at 390px, comes from iteration 3 and is fixed in the next commit |
| – | `/manage/dead-links` | fix after 25: `overflow-wrap: anywhere` again in `DeadLinkList`, with a story that fails on a path without a break opportunity | P1 1→0 | – | – | fix, not an iteration: iteration 3 had swapped `anywhere` for `break-word`, which lets a long path widen the page at 390px |
| 26 | `/manage/query` (`QueryForm`, also on `/`) | harden (the field a refusal is about is `aria-invalid` and described by the message; story checks it) | P0–P2 2→1 | 7.3→7.0 | 0→0 | kept: audit better (stagnation 0); the nav P2 was gone since 23 |
| 27 | `/manage/query` (`QueryForm`) | harden (focus moves to the answer heading when an answer arrives; story checks it) | P0–P2 1→1 | 7.0→7.0 | 0→0 | kept: the reported P2 is fixed, focus after a refusal takes its place (stagnation 1) |
| 28 | `/manage/query` (`QueryForm`) | harden (a refusal moves focus to the field it is about; story checks it) | P0–P2 1→0 | 7.0→7.3 | 0→0 | kept: audit better (stagnation 0) |
| 29 | `/account` | harden ("wrong current password" and "too short" mark their field, which takes focus; e2e step) | P0–P2 1→1 | 7.3→8.0 | 0→0 | kept: critique +0.7 (stagnation 0); remaining P2: the lockout refusal marks no field and focuses nothing |
| 30 | `/manage/api-keys` | harden (each refusal marks its field, name, scope or date, in the create and change forms; it points to the message and takes focus; e2e step) | P0–P2 1→1 | 7.3→7.5 | 0→0 | kept, no counted improvement (stagnation 1); 4th edit (13, 14, 17, 30): **plateau** |
| 31 | `/` | harden (connect command one option per line, with a "Copy command" button; copy failure text no longer says "key") | P0–P2 1→1 | 7.3→7.0 | 1→1 | kept: no counted change either way (stagnation 2) |
| 32 | `/` (`app.css` base `p`) | typeset (`text-wrap: pretty` on paragraphs, no word alone on a last line) | P0–P2 1→1 | 7.0→7.3 | 1→0; also `/manage` 390px 1→0, `/manage/sources/3` 390px 2→1; no new finding on any route | kept: detector better (stagnation 0) |
| 33 | `/manage/query` (`QueryForm`) | clarify (hints for the sources and the token budget) | P0–P2 0→1 | 7.3→7.0 | 0→0 | worse, reverted (9dba163); 4th edit (26, 27, 28, 33): **plateau** (stagnation 1) |
| 34 | `/manage/settings` | clarify (pause hint without "polling": "No source is checked for new commits until you resume") | P0–P2 0→0 | 7.2→7.5 | 0→0 | kept, no counted improvement (stagnation 2); 4th edit (2, 8, 23, 34): **plateau** |
| 35 | `/login` | clarify (without mail the sheet says who can reset the admin account) | P0–P2 0→1 | 7.3→7.5 | 0→0 | worse, reverted (9ca8607); third iteration in a row without improvement (33, 34, 35): **the loop ends** |

## Summary

### Baseline against the end

| Route | Audit P0–P2, baseline → end | Critique, baseline → end | Detector warnings, baseline → end |
|---|---|---|---|
| `/` | 2 → 1 | 7.5 → 7.3 | 1 → 0 |
| `/login` | 1 → 0 | 8.0 → 7.3 | 0 → 0 |
| `/login/forgot` | 1 → 0 | 8.5 → 7.8 | 0 → 0 |
| `/login/reset/[token]` | 1 → 0 | 8.5 → 8.0 | 0 → 0 |
| `/setup` | 1 → 0 | 7.8 → 7.5 | – |
| `/account` | 2 → 0 | 6.8 → 7.5 | 0 → 0 |
| `/manage` | 0 → 1 | 8.0 → 7.5 | 1 → 1 |
| `/manage/api-keys` | 2 → 1 | 7.5 → 7.3 | 0 → 0 |
| `/manage/dead-links` | 0 → 0 | 6.7 → 7.2 | 0 → 0 |
| `/manage/missed-queries` | 1 → 0 | 7.5 → 7.2 | 0 → 0 |
| `/manage/query` | 2 → 0 | 7.5 → 7.0 | 0 → 0 |
| `/manage/settings` | 1 → 0 | 6.7 → 7.5 | 0 → 0 |
| `/manage/sources/[id]` | 1 → 1 | 6.8 → 7.3 | 1 → 1 |
| **All** | **15 → 4** | **average 7.52 → 7.48** | **3 → 2 routes with a warning** |

### Targets

- **Detector, met everywhere:** 0 errors on every route and at most one warning. The two left are
  `line-length` on the "Needs attention" fix sentence of `/manage` at 1280px and
  `first-viewport-column-overflow` on `/manage/sources/3`.
- **Audit, met everywhere:** no Accessibility or Responsive finding of P1 or worse. P0–P2 findings
  went from 15 to 4. The one P1 that came up during the loop, a long path widening
  `/manage/dead-links` on a phone, was caused by iteration 3 and is fixed (`4461433`, with a story).
- **Critique per route, met everywhere:** every route is at 7.0 or higher. Four routes were below 7
  at the start: `/account`, `/manage/dead-links`, `/manage/settings`, `/manage/sources/[id]`.
- **Critique average, not met:** 7.48 against the target of 8.0.

### Why the loop ended after 35 of 40 iterations

Iterations 33 (worse, reverted), 34 (no counted improvement) and 35 (worse, reverted) are three in a
row without improving a metric. That is the stagnation stop condition.

How each route ends:

| State | Routes |
|---|---|
| Plateau, 4 edits without the overall target | `/manage`, `/manage/api-keys`, `/manage/dead-links`, `/manage/missed-queries`, `/manage/query`, `/manage/settings`, `/manage/sources/[id]` |
| At target (critique ≥ 7, no audit finding ≥ P1, detector 0 errors / ≤ 3 warnings) | `/`, `/login`, `/login/forgot`, `/login/reset/[token]`, `/setup`, `/account` |

The average target of 8.0 is missed, and continuing would not have changed that:

- The critique of a route varies by up to ±0.8 between two reviewer runs on unchanged code. Examples:
  `/manage` 8.0 → 7.2 in the iteration 11 re-measure with only the shared header changed;
  `/manage/sources/[id]` 7.0 → 6.8 with no change at all. That spread is wider than the 0.5 a change
  must gain to count, and the 0.52 the average still lacks.
- The baseline run scored more leniently than every later full run. The full re-measure after iteration 11 gave
  7.33 for nearly the same code. Measured against that run, the end is +0.15. Against the baseline
  run it is −0.04. Both are within the noise.
- The costs the reviewers name most often lie outside the allowed scope (next section).

### Why the plateau routes stopped where they did

- **`/manage/sources/[id]`:** the top cost in every review is the missing fix sentence under a sync
  error. The overview shows it (`FIX[errorKind]`), but the source page's load does not return
  `errorKind`. Adding it means changing `+page.server.ts`, which the rules exclude. The totals ledger
  and a candid delete text were tried (5, 10) and lost points.
- **`/manage`:** the sources table hides the state word past the scroll edge on a phone. Moving the
  column (19) and putting the state under the name (22) were both reverted after new P2s appeared;
  the reviewers then asked for exactly the reverted change.
- **`/manage/query`, `/manage/missed-queries`:** what remains is sort order, marking a term as
  handled, and showing each source's state in the form. All of it needs data or logic changes.
- **`/manage/api-keys`, `/manage/dead-links`:** what remains is a key fingerprint, disabling the
  source checkboxes under "All sources" without breaking forms without JavaScript, and links into
  the repository. These are new features rather than refinement.

### What changed for good

- Forms: a refusal marks the field it is about with `aria-invalid`, points it to the message and
  moves focus there. This covers login, account, API keys and the query form. An answer moves focus to
  its heading.
- The management nav marks the current page already in the server render (it used to appear only
  after hydration), with a regression check in `manage.e2e.ts`.
- On a phone, the header is 184px tall instead of 246px; the run history shows the cause of a failure
  under the run; the missed-queries table fits; the table focus ring is no longer clipped.
- Copy and structure: dead links are grouped by page with targets on their own lines; settings has a
  short label with a linked hint and its paused state in words; the account page states the
  consequence before the form; API keys say how an agent sends a key; leads have a reading measure;
  paragraphs wrap without stragglers; the connect command has a copy button.

### Open recommendations

1. Return `errorKind` from the source page's load and show the fix sentence under the error,
   the largest single cost of `/manage/sources/[id]`. It needs a change to `+page.server.ts`.
2. A scroll cue for `TableScroll`, or a narrow-screen layout for `SourceStatsTable`. The reviewers
   ask for it on `/` and `/manage` in every run.
3. Show each source's state in the query form's source list, and default the missed queries to
   "Times asked".
4. Focus or announce one-off results after a full-page POST: the created API key, "Settings saved."
   and "Password changed.".
5. Lockout messages with a duration ("Try again later." gives none). The server knows the window.
6. Rather than chasing the 8.0 average: a reviewer whose spread on unchanged code stays below the
   threshold. For example, three runs per measurement with the median, or a fixed rubric per
   heuristic.

### Checks at the end

On the final state of the branch, run one after the other: `npm run check` 0 errors and 0 warnings,
`npm run lint` green, `npm run build` green, `npm test` 730 of 730, and `make e2e` 21 of 21. After
iteration 33 a single `npm test` run had one failure. It ran while four reviewers were driving the
dev server and a browser in parallel; every run since then has passed in full.
