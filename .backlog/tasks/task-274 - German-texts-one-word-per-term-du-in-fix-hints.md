---
id: TASK-274
title: 'German texts: one word per term, du in fix hints'
status: Done
assignee:
  - '@claude'
created_date: '2026-11-06 15:56'
updated_date: '2026-11-06 18:10'
labels: []
dependencies: []
priority: medium
type: bug
ordinal: 336000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`.claude/rules/glossary-de.md` says `app/messages/de.json` uses the listed terms and no others, and addresses the reader with „du“. Read text by text, it does not:
- The sign-on provider has three names: „Anmeldedienst“ (glossary, nine texts), „Identity Provider“ (`password_none_reset`, `password_none_ask_admin`) and „Anbieter“ (`account_providers_lead`, `account_provider_link_needs_password`, `auth_oidc_email_taken`, `auth_last_sign_in`). On the account page the heading says „Anmeldedienste“ and the next line „über einen Anbieter“.
- Terms not in the glossary with two words each: owner („Owner“ in `apikeys_owner`, „Besitzer“ in `apikeys_search`, same page), duplicate („Dublette“ in `duplicates_kind_duplicate`, „Duplikat“ elsewhere), operator („den Betrieb bitten“ in `admin_fix_deadline`/`admin_fix_aborted`, „die Person, die grimoire betreibt“ in `error_git_host_refused`).
- The eight hints `admin_fix_path` … `admin_fix_unknown` are infinitives, not „du“ form, next to texts that use „du“.
- „Dokumentation Website“ (`field_docs_url` and its two errors) is no German compound; „das erste Admin-Account“ / „Das Admin-Account“ are neuter while every other text treats Account as masculine; `source_token_forgejo` says „Access-Token“ where the glossary says Zugriffstoken.
- The glossary English column says "sign-on provider" while the English texts say "identity provider".

A search for the "Not" terms passes, so the obvious check cannot see any of this.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each listed term has one German word throughout `de.json`; owner, operator and duplicate get glossary rows
- [x] #2 The `admin_fix_*` hints address the reader with „du“
- [x] #3 „Dokumentations-Website“ and the masculine gender of Account are used; „Access-Token“ is either replaced or named as an exception in the glossary
- [x] #4 The glossary English column uses the word the English texts use
- [x] #5 Tests that assert changed texts are run (search `*.e2e.ts`, `*.spec.ts`, `*.stories.svelte`)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. de.json: Anmeldedienst for every provider text, Besitzer, Duplikat, Betreiber, Zugriffstoken, Dokumentations-Website, masculine Account
2. The admin_fix_* hints in du form
3. Glossary: English column says identity provider; rows for owner, operator, duplicate, documentation site; Access-Token among the Not terms; du in hints and Account masculine noted
4. Search tests for the changed texts
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
- Owner decision: Anmeldedienst, Besitzer, Duplikat, Betreiber, Zugriffstoken.
- Searched *.e2e.ts, *.spec.ts and *.stories.svelte for every changed text: none asserts one, so no test file changed. The full suites run at the end of the batch.
- The three new fix hints from TASK-268 were already in du form.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
de.json now uses one German word per term (Anmeldedienst, Besitzer, Duplikat, Betreiber, Zugriffstoken, Dokumentations-Website), treats Account as masculine, and the admin fix hints address the reader with du. The glossary names the English term the texts use (identity provider) and has rows for the new terms. No test asserted the changed texts.
<!-- SECTION:FINAL_SUMMARY:END -->
