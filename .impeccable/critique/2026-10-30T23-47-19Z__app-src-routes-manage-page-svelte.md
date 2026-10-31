---
target: /manage
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/workspace/github.com/elnebuloso/grimoire/app/src/routes/manage/+page.svelte"
target_fingerprint: "sha256:0cb811b87599964ca9e4c6cdaf4574bc839c75767551e787127850fad124ca72"
target_path: /workspace/github.com/elnebuloso/grimoire/app/src/routes/manage/+page.svelte
timestamp: 2026-10-30T23-47-19Z
slug: app-src-routes-manage-page-svelte
closed: true
---
Method: dual-agent (A: design review sub-agent · B: detector/browser sub-agent)

# Critique: /manage (admin overview), app/src/routes/manage/+page.svelte

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Paused `platform-next` shows only as "never synced"; absolute sync times only |
| 2 | Match System / Real World | 3 | "never synced – sync error" reads as two problems |
| 3 | User Control and Freedom | 2 | No action from the attention list |
| 4 | Consistency and Standards | 2 | Slug vs name; "New source" link vs "Sync now" button; nav loses current state on child pages |
| 5 | Error Prevention | 3 | Showing "paused" would prevent "fixing" a deliberate pause |
| 6 | Recognition Rather Than Recall | 2 | Cross-reference slugs with names; per-row dead-link counts not links |
| 7 | Flexibility and Efficiency | 2 | No skip link (15 tab stops); attention ordered by slug, not severity |
| 8 | Aesthetic and Minimalist Design | 3 | Totals ledger at equal weight to problems, repeats table |
| 9 | Error Recovery | 2 | Cause verbatim, no fix |
| 10 | Help and Documentation | 2 | Only footer handbook link |
| **Total** | | **23/40** | **Acceptable** |

## Design Specificity Verdict
Authored in its details (ledger, edge bars, word-first status, mono slugs, one accent, holds in dark); generic in composition. Detector: CLI clean on the surface (exit 0); overlay "No anti-patterns found" on /manage light 1280, dark 1402, dark 375. Out of scope: first-viewport-column-overflow on app/src/routes/manage/sources/[id]/+page.svelte:167 (Settings column ~2.6 viewports tall), real.

## Priority Issues
- [P1] Paused state invisible on the overview: SourceHealth (app/src/lib/server/admin/status.ts:165-172) has no paused field. Fix: add it, show "polling paused" in attention item (+page.svelte:51) and Last sync cell; decide whether paused+never synced belongs in attention. Command: clarify.
- [P1] Totals precede problems in source order (+page.svelte:24); at 375 px attention starts at the fold. Fix: attention first in source order, ledger beside it on wide screens via grid. Command: layout.
- [P2] Cause without fix, no action: add a fix sentence per known sync error in the message files, link to the matching part of the source page. Command: clarify.
- [P2] Dead links absent from "Needs attention"; ledger link accessible name "6"; per-row counts unlinked. Fix: warning items "3 dead links" to /manage/dead-links, link counts, name the ledger link. Command: harden.
- [P3] Skip link in app/src/routes/+layout.svelte; attention by severity not ORDER BY slug; "New source" styled like "Sync now"; Overview current on child pages. Command: polish.

## Persona Red Flags
- Alex: 15 tab stops; alphabetical attention; no relative times; click into each source.
- Sam: no skip link; totals read before problems; "6, link"; key columns at scroll end at narrow widths.
- On-call platform engineer: cause in <5 s on desktop; paused ambiguity; no fix hint; source page leads with Status/"Sync now", not the error.

## Minor Observations
No number grouping; Last sync repeats year and UTC; title and "Overview" heading repeat the nav; yes/no "Sync error" column duplicates attention (a state word would fit DESIGN.md); empty area beside the tall ledger on wide screens. Not checked: German, warnings sub-list, 200% zoom, many sources or long names.

## Questions to Consider
- Why does the page open with totals the admin didn't come for?
- Is "Needs attention" a list of sources or of problems?
- Could one problems-first table with a state column replace attention list and "Sync error" column?
