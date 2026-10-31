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

| Route | Audit findings (P0/P1/P2/P3) | Critique | Detector (e/w) | Iteration |
|---|---|---|---|---|
| `/` | 0/0/1/1 | 7.3 | 0/1 | 20 |
| `/login` | 0/0/1/2 | 7.5 | 0/0 | 24 |
| `/login/forgot` | 0/0/1/1 | 8.0 | 0/0 | 11 (full re-measure) |
| `/login/reset/[token]` | 0/0/1/1 | 8.3 | 0/0 | 11 (full re-measure) |
| `/setup` | 0/0/1/1 | 8.0 | – (source 0/0) | 11 (full re-measure) |
| `/account` | 0/0/1/1 | 8.0 | 0/0 | 29 |
| `/manage` | 0/0/0/2 | 7.0 | 0/1 | 20, **plateau** |
| `/manage/api-keys` | 0/0/1/1 | 7.5 | 0/0 | 30, **plateau** |
| `/manage/dead-links` | 0/0/0/0 (P1 from iteration 3 fixed after 25) | 7.2 | 0/0 | 11 (full re-measure), **plateau** |
| `/manage/missed-queries` | 0/0/0/2 | 7.3 | 0/0 | 18, **plateau** |
| `/manage/query` | 0/0/0/1 | 7.3 | 0/0 | 28 |
| `/manage/settings` | 0/0/0/2 | 7.5 | 0/0 | 23 |
| `/manage/sources/[id]` | 0/0/0/1 | 6.8 | 0/1 | 11 (full re-measure), **plateau** |

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
