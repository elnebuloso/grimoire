---
id: TASK-261
title: 'API keys: dialogs, source picker and a ready connect command'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 20:46'
updated_date: '2026-11-06 10:18'
labels:
  - admin
milestone: m-3
dependencies:
  - TASK-251
  - TASK-258
documentation:
  - docs/redesign/ux-konzept.md
priority: medium
type: enhancement
ordinal: 323000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
After creating a key the user has to go to the start page for the connect command and replace `<key>` by hand; a reload after creating can create a second key; the change disclosure reads "Change <name>" like switching users; the admin list shows neither expiry nor a link to the owner (findings U19, U20, W2). With hundreds of sources (owner decision O6) a checkbox per source is unusable.

Measure M14 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Creating and changing a key happen in a dialog; choosing sources uses a searchable `SourcePicker` that shows the chosen ones
- [x] #2 With 500 sources a key for three given sources can be created by search without scrolling a list
- [x] #3 The admin list of all keys shows expiry and expired state, links the owner and filters by owner
- [x] #4 `SourcePicker` has stories with axe
- [x] #5 After creating, the dialog shows the key once and the connect command with the key filled in; the key cannot be created twice by accident
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Rules (shown to the owner 2026-11-06; owner filter decided: option a):
1. /account/api-keys keeps its list; primary action "New key" above it and in the empty state; the form at the bottom goes.
2. "New key" opens a dialog: name, access (all sources incl. future / selected) with SourcePicker, expiry.
3. After creating, the same dialog shows the result: the key once (ShownOnce) and the full claude mcp add command with the key filled in, copyable; the form is gone, "Done" closes; the button is disabled while submitting.
4. Each key gets an "Edit" button instead of the disclosure "Change <name>"; it opens a dialog with access and expiry; the name stays fixed.
5. Revoke unchanged.
6. SourcePicker: search over name and slug, matching sources as checkboxes with name and slug, at most 8 matches, beyond that a sentence asking to narrow the search; the chosen ones gathered above, each with a remove button; the form still sends sources as slugs.
7. Validation and messages unchanged, shown in the dialog at the field.
8. /manage/api-keys: new sortable column "Valid until" with date or expired; owner as a link.
9. The owner link leads to /manage/users?search=<email>.
10. The welcome notice after the first login opens the dialog.
11. Stories: SourcePicker (empty, chosen, more than 8 matches, no match) and the result dialog; e2e moves to the dialogs.
12. 500 sources checked by hand in the agent environment; the script becomes a Make target.
13. Owner filter (decision a): ?owner=<email> filters exactly; the users list gets a "Keys" link per user; above the table a notice "Keys of <email>" with "Show all"; no select.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Built as planned. New: SourcePicker (lib/components), connectCommand (lib/connect-command.ts, shared with the start page), connectTarget (lib/server/connect.ts), sourceChoices in api-keys.ts, EmptyState takes a button action, make agent-many-sources (scripts/agent-many-sources.ts, 500 paused sources). Handbook users.md, agents.md, admin.md updated. Checked by hand with 500 sources, light and dark: three keys found by search, result dialog with the command, admin list. The dialog itself scrolls once several sources are chosen and 8 matches show; the picker list does not. Boy Scout: KeyScope lost the space after each comma (Svelte trims block edges); fixed with a story check, meant as its own commit.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
API keys are created and edited in dialogs; sources are chosen with a searchable SourcePicker (8 matches at most, the chosen ones gathered above). After creating, the dialog shows the key once and the claude mcp add command with it; the form is gone, so it cannot be sent twice. The admin list shows expiry and expired state, links the owner to the users list and filters by ?owner=, reached from a Keys link per user. make lint, make test (1061), make e2e (28) and make handbook pass.
<!-- SECTION:FINAL_SUMMARY:END -->
