---
id: TASK-248
title: Reactive forms and a toast for every changing action
status: Done
assignee:
  - '@claude'
created_date: '2026-11-05 20:45'
updated_date: '2026-11-05 21:31'
labels:
  - admin
milestone: m-3
dependencies: []
documentation:
  - docs/redesign/ux-konzept.md
priority: high
type: enhancement
ordinal: 310000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Some actions confirm what they did (settings saved, slug changed, password changed), others end silently: saving or deleting a source, revoking a key, withdrawing an invitation, granting the admin role. After saving a source the page only says a sync is queued, even when only the description changed. Admins have to inspect the result to know whether an action took effect (finding U4 in the concept, chapter 12.3). Almost every form today is a plain POST with a full page reload; only the source page uses `use:enhance`.

Owner decision 2026-11-05: the web UI is a reactive Svelte application, JavaScript is required and no fallback without it is kept; only the pages with `csr = false` stay plain forms for their technical reasons (rule in `.claude/rules/ui-components.md`).

Measure M1 in the concept. Work on the branch `redesign`; it ships in one merge at the end of the milestone.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The message covers at least: password change, linking and unlinking an identity, creating, changing and revoking a key, creating, saving, syncing, renaming and deleting a source, inviting, re-sending and withdrawing an invitation, granting and removing the admin role, unlinking a user's identity, deleting a user, pausing syncs, export
- [x] #2 Saving a source says that a sync was started only when the change actually triggers one
- [x] #3 Field errors stay in the form next to the field, as today
- [x] #4 Outside the pages with `csr = false`, no form triggers a full page reload: forms use `use:enhance`, scroll position and input stay, affected data refresh in place
- [x] #5 While an action runs its button is disabled and shows that it is working
- [x] #6 Success appears in a `Toast` that names the affected item (e.g. the key or source name): fixed in a corner, visible while scrolling, gone after about five seconds, kept while hovered, closable, several stacked with the newest on top
- [x] #7 `Toast` has stories for each state with axe
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Shared submit handler `submitWithToast` in `app/src/lib/forms.ts`: busy button, `use:enhance` without navigation, a redirect back to the same page refreshes in place (`invalidateAll`, because Storybook 10.6.2 mocks no `refreshAll`), a redirect elsewhere takes the toast text before the form is gone. Toast list in `app/src/lib/toasts.svelte.ts` (mutations untracked: a toast from an effect looped forever), stack in `Toast.svelte`, rendered by the root layout.
`/account/unlink` became the action `unlink` of `/account` (an endpoint cannot answer `use:enhance`); the password action is now `password`. The new-key form is rebuilt after each key, since resetting it left no scope radio picked; the created key shows next to the form, not at the top. The export downloads through `fetch` and a blob link. Header switches post with `fetch`: the theme applies in place, the language reloads the page because every text was rendered in the old one.
Remaining full loads, each with its reason: language switch (texts), logout (leads to the `csr = false` login page), linking a provider (continues at the provider).
Checked by hand in the agent environment: key create, change, revoke (own and all), password error, link and unlink a provider, settings, export error and download, source create, save while scrolled (scroll kept), sync, slug, delete, invite, resend, withdraw, grant and remove the role, last-admin refusal, delete user, theme; dark scheme. Not by hand: an admin removing a user's identity link (same `ConfirmForm` path as the others).
make lint, make test (990), make e2e (28) pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Every form outside the `csr = false` pages now submits with `use:enhance`: no full reload, scroll and input stay, the button shows a spinner while its action runs, and success appears in a new `Toast` (corner, about 5 s, kept while hovered, closable, stacked) that names the item. Field errors stay in the form. New message keys in en and de; `SlugChangeForm` lost its inline "changed" notice; `/account/unlink` moved into the `/account` actions. e2e selectors distinguish page notices from toasts; the theme switch no longer follows the endpoint redirect, which failed on error pages. Rule added to `.claude/rules/memory.md`: close the Playwright MCP browser after checks. Follow-up in TASK-251: replace `confirm()` in `ConfirmForm`.
<!-- SECTION:FINAL_SUMMARY:END -->
