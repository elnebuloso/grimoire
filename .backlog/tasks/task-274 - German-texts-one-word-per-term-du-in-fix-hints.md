---
id: TASK-274
title: 'German texts: one word per term, du in fix hints'
status: To Do
assignee: []
created_date: '2026-11-06 15:56'
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
- [ ] #1 Each listed term has one German word throughout `de.json`; owner, operator and duplicate get glossary rows
- [ ] #2 The `admin_fix_*` hints address the reader with „du“
- [ ] #3 „Dokumentations-Website“ and the masculine gender of Account are used; „Access-Token“ is either replaced or named as an exception in the glossary
- [ ] #4 The glossary English column uses the word the English texts use
- [ ] #5 Tests that assert changed texts are run (search `*.e2e.ts`, `*.spec.ts`, `*.stories.svelte`)
<!-- AC:END -->
