---
id: TASK-272
title: 'Dialogs: keep input on drag release, clear typed confirmation on reopen'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:56'
updated_date: '2026-11-06 17:27'
labels:
  - admin
dependencies: []
priority: medium
type: bug
ordinal: 334000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Two behaviours of the dialog pair, reasoned from the code, not reproduced:
- `app/src/lib/components/Dialog.svelte` closes on any `click` whose target is the `<dialog>` element. A browser sends `click` to the nearest common ancestor of mousedown and mouseup targets, so selecting text in a field and releasing over the backdrop closes the dialog. The next opening starts a fresh form (`opened++` under `{#key}`), so what was typed (API key form, invitation, typed confirmations) is gone.
- `ConfirmDialog.svelte` resets `typedValue` to `""` on each opening, but the field is a `TextField` with constant `value=""` passed as `defaultValue`, and `Dialog` renders its children while closed. After type, cancel, reopen, the field still shows the old text but the danger button stays locked until the text is edited. This hits slug change and delete on the source page.

The story "Closed by the browser or beside the box" in `Dialog.stories.svelte` dispatches a synthetic `click` on `<dialog>` and calls it a backdrop click; it asserts the current behaviour and has to change with the fix.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The dialog closes on the backdrop only when the pointer went down on the backdrop too
- [x] #2 Reopening a `ConfirmDialog` after cancel shows an empty field and a locked button, or the typed text and an unlocked button, never a mismatch
- [x] #3 Stories cover a release over the backdrop after pressing inside, and reopening after cancel; the synthetic-click story is replaced by a real press and release on the backdrop
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Stories first: a press in a field released over the backdrop keeps the dialog and the text; reopening a ConfirmDialog after cancel shows an empty field and a locked button; the synthetic-click story becomes a real press and release on the backdrop (userEvent.pointer)
2. Dialog closes on a click on the backdrop only when the pointer went down there too
3. ConfirmDialog clears the rendered field on each opening
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- user-event dispatches the click of a press-and-release on the nearest common ancestor, as browsers do, so the stories reproduce the drag case; both new stories failed before the fix and pass after.
- Dialog, ConfirmDialog, ConfirmAction and ActionMenu stories pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Dialogs no longer close when a text selection that started in a field ends over the backdrop: only a press that started on the backdrop closes them. ConfirmDialog empties its typed-confirmation field on every opening, so field and lock never disagree. Stories cover both and the backdrop story now uses a real press and release; they failed before the fix.
<!-- SECTION:FINAL_SUMMARY:END -->
