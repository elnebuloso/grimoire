---
id: TASK-263
title: 'Start page: simple status, documentation links, search and readable answers'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 20:46'
updated_date: '2026-11-06 11:54'
labels:
  - admin
milestone: m-3
dependencies:
  - TASK-258
documentation:
  - docs/redesign/ux-konzept.md
priority: medium
type: enhancement
ordinal: 325000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The start page shows every visitor sync error words, "paused" and dead links they cannot act on; no source is linked; the answer of "Try a query" is a raw Markdown block of about 2600 px (findings U14, U15, U16). Owner decisions: O3 show only the state of the content to everyone, O4 no content view but a link to the source's documentation site, O6 hundreds of sources.

Measure M16 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The start page shows per source only "Stand: <date of the last successful sync>" or "Noch nicht verfügbar", for every role; sources without a successful sync stay in the list
- [x] #2 A source with a documentation site links to it for everyone; for admins every source links to its management view
- [x] #3 The source catalogue can be searched by name, slug and description
- [x] #4 The query answer shows hits as sections with source and path, the raw text can be expanded; no hits show a sentence
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Rules (shown to the owner 2026-11-06, go):
1. Per source only: name, slug, description, visibility (logged in), pages/snippets/tokens, "Updated <date>" or "Not available yet"; no error words, paused, last check, StatusBadge, dead links; sources never synced stay.
2. The server sends the start page only these fields.
3. Docs link for everyone; for admins the name links to the management view.
4. Search over name, slug and description; no status filter, visibility filter for logged-in users; sort by name and updated.
5. Description only in the start page's search, not in /manage/sources.
6. Connect: logged in, a link "Create a key" to /account/api-keys?new opening the dialog; visitors keep the sentence about public sources.
7. Try a query: each hit a section (title path heading, source and file, content); the full agent answer in an expandable "Raw answer".
8. Content as text with line breaks, no Markdown rendering.
9. No hits: a sentence.
10. Search returns the packed hits structured; the agent's Markdown stays byte for byte, covered by a spec.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Built as planned. The start page has its own list spec (CATALOG) and maps SourceStats to public fields; admins get the management link from the layout's user.mayManage. searchHits returns the packed hits beside the unchanged Markdown (spec checks byte equality); querySources passes hits and skipped on. /account/api-keys?new opens the key dialog. Checked by hand as visitor and admin, light and dark. Seen: snippet text keeps the source's hard line breaks and Markdown marks (**, >, links), so hits read ragged; rendering Markdown would need a renderer dependency (rule 8 left it out).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The start page shows per source only the state of its content (Content as of <date> / Not available yet), sends no sync details to the page, searches name, slug and description, and links admins to each source's management view. Logged-in users get a link that opens the new-key dialog. Try a query shows hits as sections with title path, ID and text, a count of hits that did not fit and the raw agent answer to expand; no hits show a sentence. Handbook updated. make lint, make test (1067), make e2e (28) and make handbook pass.
<!-- SECTION:FINAL_SUMMARY:END -->
