---
id: TASK-392
title: >-
  Search: correctly typed German questions rank their section lower than the
  same question without its last word
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 19:05'
updated_date: '2026-11-08 19:09'
labels:
  - search
dependencies: []
priority: low
type: enhancement
ordinal: 454000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
In `i-doit-de` the correctly typed questions "Admin-Center Password vergessen zurücksetzen" and "Server im Rack positionieren Höheneinheiten" rank the expected section 3rd and 2nd; without the last word both rank 1st. Since TASK-384 the typo versions of these questions in `app/benchmark/questions/i-doit-de.json` rank the same way, which lowered the `i-doit-de` MRR from 0.53 to 0.485. Every search decision has to keep multilingual documentation and questions working (owner requirement, see TASK-370).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The cause of the lower rank of both questions is found and recorded in the notes, with the competing sections and their scores
- [x] #2 A change is made only if `make benchmark` shows it does not lose more than it gains across all eight documentations; otherwise the finding is recorded and the ranking stays
- [x] #3 An intended change of the benchmark results is written with `make benchmark-update` and committed with the change
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Probe on a fresh i-doit-de index (bm25 weights 10/1/0.25; per-word contributions, lower is better).
Q1 "admin center password vergessen zurücksetzen": reset-token#variante-b-token-im-admin-center-finden-i-doit-bis-version-34 -23.04 (247 chars; admin -5.54, center -7.04, zurücksetzen -10.46), passwort-zuruecksetzen#smtp-konfiguration-im-admin-center -22.91 (283 chars; zurücksetzen -10.42), expected cli/befehle-und-optionen#admin-center-password-reset -22.75 (1843 chars; admin -5.17, center -6.55, password -6.59, zurücksetzen -4.44, no vergessen). Without the last word: admin-center#zugangsdaten-und-anmeldung -19.22 (has vergessen) ranks 1, expected 2.
Q2 "server rack positionieren höheneinheiten": formfactor#hoheneinheiten -25.97 (398 chars; höheneinheiten -10.69 from its title), expected rack-ansicht#objekte-in-schrank-positionieren -21.86 (2044 chars; höheneinheiten -3.24 in text only, no server). Without the last word the expected ranks 1.
Cause: the last word is in the title of a short competing section (title weight 10) and only in the text of the long expected one, which BM25 length normalisation also lowers. The competitors are on-topic (height units of the form factor; resetting in the Admin-Center), Q1 is a near tie (0.3). No defect in term handling; the lever would be the column weights or coordination, both measured and rejected in TASK-370, but then on the four English documentations only.

Owner decision (2026-11-08): keep the ranking, no weights experiment. AC #3 is satisfied vacuously: no code change, so the benchmark results and baseline stay as they are.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Investigated, no code change. Both correctly typed i-doit-de questions lose rank 1 because their last word is in the title of a short, on-topic competing section (title weight 10) and only in the text of the long expected section, which BM25 length normalisation lowers further; Q1 is a near tie. The levers (column weights, coordination) were measured and rejected in TASK-370; the owner chose to keep the ranking. Untested: whether other weights behave differently on the four German documentations.
<!-- SECTION:FINAL_SUMMARY:END -->
