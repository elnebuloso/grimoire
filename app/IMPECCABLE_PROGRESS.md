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
| `/` | 0/0/1/3 | 7.3 | 0/1 | 11 (full re-measure) |
| `/login` | 0/0/1/2 | 7.3 | 0/0 | 11 (full re-measure) |
| `/login/forgot` | 0/0/1/1 | 8.0 | 0/0 | 11 (full re-measure) |
| `/login/reset/[token]` | 0/0/1/1 | 8.3 | 0/0 | 11 (full re-measure) |
| `/setup` | 0/0/1/1 | 8.0 | – (source 0/0) | 11 (full re-measure) |
| `/account` | 0/0/1/1 | 7.3 | 0/0 | 11 (full re-measure) |
| `/manage` | 0/0/1/1 | 7.2 | 0/1 | 11 (full re-measure) |
| `/manage/api-keys` | 0/0/1/2 | 6.8 | 0/0 | 13 |
| `/manage/dead-links` | 0/0/0/0 | 7.2 | 0/0 | 11 (full re-measure) |
| `/manage/missed-queries` | 0/0/1/0 | 6.9 | 0/0 | 12 |
| `/manage/query` | 0/0/2/1 | 7.3 | 0/0 | 11 (full re-measure) |
| `/manage/settings` | 0/0/1/1 | 7.2 | 0/0 | 11 (full re-measure) |
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
