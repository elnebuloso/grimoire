---
id: TASK-265
title: 'Wording, translated sync errors and smaller hints'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 20:46'
updated_date: '2026-11-06 12:34'
labels:
  - admin
milestone: m-3
dependencies:
  - TASK-256
documentation:
  - docs/redesign/ux-konzept.md
priority: low
type: enhancement
ordinal: 327000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
German texts mix terms ("User" next to "Quellen", "gesynct" next to "synct"), sync errors stay English, dead links offer no way to the file, the pages for missed queries, pausing and export lack a sentence each that prevents a wrong assumption (findings U10, U17, U18, U25, U27, U28). Owner decision O9: the try-a-query search does not count as missed.

Measure M18 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A glossary of the German terms is written down and `app/messages/de.json` follows it; it is settled before the page tasks add texts
- [x] #2 Sync errors appear translated
- [x] #3 Each dead link links to its file in the repository where the source knows an edit URL, and to the page preview
- [x] #4 The missed-queries page says that only agent searches count
- [x] #5 The global pause says that sources can also be paused one by one
- [x] #6 The export says that importing happens on the setup page of a new, empty instance
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Rules (shown to the owner 2026-11-06; dead link question decided: option a):
A. Glossary in .claude/rules/glossary-de.md; de.json follows it: Nutzer (not User/Benutzer), Account (not Konto), API-Key/Key (not Schlüssel), Verschlüsselungsschlüssel, Zugriffstoken (not Zugangstoken), Quelle/Seite/Snippet, Sync (noun), synchronisieren (not syncen/synct/gesynct), automatischer Sync (not Polling), toter Link, anmelden/Anmeldung (not Login/einloggen), Anmeldedienst (not Identitätsanbieter), Management (not Verwaltung), Admin, Einladung.
1. Sync errors: a translated sentence per kind first, the original text below as small code; unknown shows only the original.
2. Dead links link to their page preview (Pages tab) and name the repository path as text; no repository link (decision a).
3. Missed queries: only agent searches with an API key count, not Try a query.
4. Global pause: sources can also be paused one by one; Sync now always works.
5. Export: importing happens on the setup page of a new, empty instance.
6. New texts in both message files; English unchanged except 3 to 5.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Glossary in .claude/rules/glossary-de.md, extended while applying it by agent/Agents and Abfrage ohne Treffer (de.json mixed Agenten and Agents). Benutzername stays for the Git username. Sync errors: SyncError component (summary per kind, original text below), used in the needed actions, the Status tab and the history; history entries carry errorKind. Dead links: DeadLinkList takes the source (id, path), links each page to its preview and names the repository path; no repository link (decision a). Checked in German in the agent environment. The full make test hit a 5 s timeout once in auth.spec.ts (grant-admin child process) under load; it passes alone and in the next full run. make e2e timed out once starting its web server; the rerun passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
German texts follow a glossary in .claude/rules/glossary-de.md (Nutzer, Account, API-Key, synchronisieren, automatischer Sync, Anmeldedienst, Management, Agents). Sync errors show a translated summary with the original text below, everywhere they appear. Dead links link to their page preview and name the file in the repository. The missed-queries page says only agent searches count, the global pause that sources can be paused one by one, the export where importing happens. make lint, make test (1069), make e2e (28) pass.
<!-- SECTION:FINAL_SUMMARY:END -->
