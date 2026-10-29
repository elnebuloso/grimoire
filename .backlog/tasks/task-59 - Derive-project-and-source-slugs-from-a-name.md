---
id: TASK-59
title: Derive project and source slugs from a name
status: To Do
assignee: []
created_date: '2026-10-29 19:32'
updated_date: '2026-10-29 19:39'
labels:
  - admin
milestone: m-0
dependencies: []
priority: medium
type: feature
ordinal: 121000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Creating a project or a source asks for a slug: lowercase letters, digits and single hyphens. The slug is part of every ID and URL an agent uses (`<project>/<source>/<page>`, `/p/<project>/…`) and of the API key scope, so it has to stay that strict. Typing it by hand is a chore, and the form only says what is wrong after it was sent.

Decided with the user: the admin types an ordinary name, limited in length. A slugify function turns it into a proper slug, and the slug is shown next to the field while typing.

Open when picking this up, to confirm with the user: the name is kept as the display name of the project or source, and the slug stays fixed once created, even if the name changes later, because a new slug would break every ID agents have stored.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Creating a project (wizard) and a source asks for a name instead of a slug; the name has a documented maximum length that the form and the server both enforce
- [ ] #2 One slugify function turns the name into a slug of lowercase letters, digits and single hyphens: umlauts and accents become their base letters (ä → ae, é → e), other characters become hyphens, leading and trailing hyphens are dropped
- [ ] #3 While typing, the slug that will be used is shown next to the name field; without JavaScript it is shown at the latest on the next step of the wizard or after saving
- [ ] #4 A name that yields an empty slug, or a slug already taken in the project (sources) or in grimoire (projects), is rejected with a message that names the slug
- [ ] #5 The same slugify function runs in the browser and on the server, so the slug shown is the slug stored
- [ ] #6 Unit tests cover slugify (umlauts, accents, punctuation, repeated and edge hyphens, length) and the rejected cases; an e2e test checks the slug shown while typing
- [ ] #7 `docs/handbook/admin.md` describes the name and the slug derived from it
- [ ] #8 The slug of a project or source can be changed after creation only in its own section at the bottom of the project or source page, separate from the settings form; the settings forms no longer contain the slug
- [ ] #9 That section states the consequences before the form: every snippet ID changes, IDs and `/p/<slug>/` URLs stored by agents stop working, and for a project this applies to all its sources
- [ ] #10 The change takes effect only when the admin types the current slug as confirmation and the new slug is free (among projects, or among the sources of the project); otherwise nothing changes and the form says why
- [ ] #11 After a slug change, every affected source (the source, or all sources of the project) is synced again, so stored links carry the new IDs
- [ ] #12 Slugs are at most 40 characters, names at most 80; a slug derived from a longer name is cut at a hyphen to fit
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Confirmed by the user: the name is kept as the display name of the project or source, and the slug stays fixed once created, even when the name changes.

Discussed and rejected: UUIDs instead of slugs. Projects and sources already have integer ids as database keys. The slug is the public address agents use in every snippet ID, in the index and in /p/<project>/ URLs. A UUID there would cost tokens in every answer and is easy for a model to miscopy; both are estimates, not measured. A name alone cannot serve either, because it needs escaping in IDs and URLs and may change.

Added with the user: changing a slug later like a GitLab namespace, in a separate section with the current slug typed as confirmation. Lengths proposed and accepted as defaults: slug 40, name 80. The settings forms on the project and source pages allow changing the slug freely today without any warning; this task closes that gap.
<!-- SECTION:NOTES:END -->
