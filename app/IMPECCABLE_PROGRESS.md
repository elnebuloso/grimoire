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
| `/` | 0/0/2/2 | 7.5 | 0/1 | baseline |
| `/login` | 0/0/1/2 | 8.0 | 0/0 | baseline |
| `/login/forgot` | 0/0/1/1 | 8.5 | 0/0 | baseline |
| `/login/reset/[token]` | 0/0/1/2 | 8.5 | 0/0 | baseline |
| `/setup` | 0/0/1/1 | 7.8 | – (source 0/0) | baseline |
| `/account` | 0/0/2/0 | 6.8 | 0/0 | baseline |
| `/manage` | 0/0/0/3 | 8.0 | 0/1 | baseline |
| `/manage/api-keys` | 0/0/2/0 | 7.5 | 0/0 | baseline |
| `/manage/dead-links` | 0/0/0/1 | 6.8 | 0/0 | 3 |
| `/manage/missed-queries` | 0/0/1/0 | 7.5 | 0/0 | baseline |
| `/manage/query` | 0/0/2/0 | 7.5 | 0/0 | baseline |
| `/manage/settings` | 0/0/1/1 | 6.9 | 0/0 | 2 |
| `/manage/sources/[id]` | 0/0/1/1 | 6.8 | 0/1 | baseline |

Baseline: detector and audit targets are met everywhere. Critique: four routes are below 7, and
the average is 7.52.

## Iterations

| # | Route | Command | Audit | Critique | Detector | Result |
|---|---|---|---|---|---|---|
| 1 | `/manage/dead-links` | clarify (lead, spoken "links to" instead of the arrow) | 1→4 | 6.7→6.7 | 0→0 | worse, reverted; area "DeadLinkList copy" tried |
| 2 | `/manage/settings` | clarify (short label, linked hint, paused state as a notice) | 3→2 | 6.7→6.9 | 0→0 | kept (audit better; critique change within noise) |
| 3 | `/manage/dead-links` | typeset (target on its own line, source quiet, spoken "links to", lead) | 1→1 | 6.7→6.8 | 0→0 | kept, no counted improvement (stagnation 1) |
