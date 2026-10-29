---
id: TASK-59
title: Derive project and source slugs from a name
status: To Do
assignee: []
created_date: '2026-10-29 19:32'
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
<!-- AC:END -->
