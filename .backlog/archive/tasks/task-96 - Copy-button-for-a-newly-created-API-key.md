---
id: TASK-96
title: Copy button for a newly created API key
status: Done
assignee:
  - '@claude'
created_date: '2026-10-30 02:01'
updated_date: '2026-10-30 02:40'
labels:
  - admin
milestone: m-0
dependencies: []
priority: low
type: enhancement
ordinal: 158000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A new key is shown exactly once and has to be selected by hand. A slip leaves out a character, and the agent fails with an unknown key that cannot be shown again.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Next to the new key there is a button that copies it to the clipboard and confirms it in a `role="status"` message
- [x] #2 Without clipboard access the key can still be selected and copied by hand
- [x] #3 A story covers the button, including the confirmation
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Component CopyButton (app/src/lib/components/): a button that writes a value to the clipboard and reports the outcome in a role=status element: copied, or that copying failed and the value has to be selected by hand. Shown only once mounted with navigator.clipboard present, so without JavaScript or clipboard the page shows just the selectable key.
2. API keys page renders it next to the new key.
3. Stories: copied (clipboard mocked, confirmation shown, value written), clipboard refused (failure message), each with a play function.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
CopyButton (app/src/lib/components/CopyButton.svelte) renders only after mount when navigator.clipboard exists, so without JavaScript or clipboard only the selectable <output> is left; a refused write shows a message to copy by hand. Its role=status is a sibling of the creation message, not nested. Verified: stories 'Copied' and 'Clipboard refused' run in make test (541 passed), make lint; by hand in the agent environment: new key, 'Copy key' shows 'Copied.'.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
A 'Copy key' button next to a newly created API key copies it and confirms in a role=status message, or says to copy by hand when the browser refuses; without a clipboard the key stays selectable as before. New component CopyButton with stories for both outcomes. Verified with make test, make lint and by hand.
<!-- SECTION:FINAL_SUMMARY:END -->
