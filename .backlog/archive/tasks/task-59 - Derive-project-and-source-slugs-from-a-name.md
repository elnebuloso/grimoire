---
id: TASK-59
title: Derive project and source slugs from a name
status: Done
assignee:
  - '@claude'
created_date: '2026-10-29 19:32'
updated_date: '2026-10-29 19:49'
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
- [x] #1 Creating a project (wizard) and a source asks for a name instead of a slug; the name has a documented maximum length that the form and the server both enforce
- [x] #2 One slugify function turns the name into a slug of lowercase letters, digits and single hyphens: umlauts and accents become their base letters (ä → ae, é → e), other characters become hyphens, leading and trailing hyphens are dropped
- [x] #3 While typing, the slug that will be used is shown next to the name field; without JavaScript it is shown at the latest on the next step of the wizard or after saving
- [x] #4 A name that yields an empty slug, or a slug already taken in the project (sources) or in grimoire (projects), is rejected with a message that names the slug
- [x] #5 The same slugify function runs in the browser and on the server, so the slug shown is the slug stored
- [x] #6 Unit tests cover slugify (umlauts, accents, punctuation, repeated and edge hyphens, length) and the rejected cases; an e2e test checks the slug shown while typing
- [x] #7 `docs/handbook/admin.md` describes the name and the slug derived from it
- [x] #8 The slug of a project or source can be changed after creation only in its own section at the bottom of the project or source page, separate from the settings form; the settings forms no longer contain the slug
- [x] #9 That section states the consequences before the form: every snippet ID changes, IDs and `/p/<slug>/` URLs stored by agents stop working, and for a project this applies to all its sources
- [x] #10 The change takes effect only when the admin types the current slug as confirmation and the new slug is free (among projects, or among the sources of the project); otherwise nothing changes and the form says why
- [x] #11 After a slug change, every affected source (the source, or all sources of the project) is synced again, so stored links carry the new IDs
- [x] #12 Slugs are at most 40 characters, names at most 80; a slug derived from a longer name is cut at a hyphen to fit
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. app/src/lib/slug.ts (shared by browser and server): slugify, isSlug, MAX_SLUG_LENGTH 40, MAX_NAME_LENGTH 80; unit tests.
2. Migration 0007: name on projects and sources, filled with the slug for existing rows.
3. admin/projects.ts: project and source forms take a name; the slug is derived on creation only; updates change the name, never the slug; changeProjectSlug and changeSourceSlug check the typed current slug, validity, length and uniqueness.
4. Routes: wizard and new-source form ask for the name and show the derived slug (SlugNameField component with stories, reactive while typing, server-rendered without JS); project and source settings forms lose the slug; a separate 'Change the slug' section on both pages with the consequences, new slug and the current slug as confirmation; a change forces a sync of the affected sources.
5. Display the name where projects and sources are shown to people (titles, project table with the slug next to it, source list); IDs and agent-facing output keep the slug.
6. Messages en/de, agent fixture names, handbook admin.md, unit and e2e tests.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Confirmed by the user: the name is kept as the display name of the project or source, and the slug stays fixed once created, even when the name changes.

Discussed and rejected: UUIDs instead of slugs. Projects and sources already have integer ids as database keys. The slug is the public address agents use in every snippet ID, in the index and in /p/<project>/ URLs. A UUID there would cost tokens in every answer and is easy for a model to miscopy; both are estimates, not measured. A name alone cannot serve either, because it needs escaping in IDs and URLs and may change.

Added with the user: changing a slug later like a GitLab namespace, in a separate section with the current slug typed as confirmation. Lengths proposed and accepted as defaults: slug 40, name 80. The settings forms on the project and source pages allow changing the slug freely today without any warning; this task closes that gap.

Implementation:
- app/src/lib/slug.ts (slugify, isSlug, MAX_SLUG_LENGTH 40, MAX_NAME_LENGTH 80) is imported by NameField in the browser and by admin/projects.ts on the server.
- Migration 0007 adds the name to projects and sources and fills it with the slug.
- New components with stories: NameField (slug preview while typing, server-rendered without JavaScript) and SlugChangeForm.
- A slug change forces a sync of every affected source, paused ones included, because the stored links hold the old IDs.
- The admin attention list and the agent output keep showing slugs, since they identify sources there; titles, the project table and the source list show names.

Verification:
- make lint passes.
- make test passes (360, including the slug tests, the slug-change rules and the route actions with resync).
- make e2e passes (14/14); the wizard test types the name key by key and checks 'Slug: platform' and 'Slug: auth-service'.
- By hand in the agent environment: a wrong confirmation is rejected, in German with Accept-Language de. The right one changes platform to platform-team. After the forced resync every stored link target of the project starts with platform-team/.
- make handbook passes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Projects and sources have a name (at most 80 characters), which is what people see. When one is created, its slug is derived from the name by a slugify function shared by browser and server: umlauts are spelled out, accents dropped, at most 40 characters, cut at a hyphen. The slug is shown next to the field while typing, and without JavaScript on the next step or after saving. Renaming keeps the slug.

A slug changes only in a separate 'Change the slug' section on the project or source page. The section states what breaks for agents, requires the current slug as confirmation and a free new slug, and then forces a resync of the affected sources so stored links carry the new IDs. The settings forms no longer contain the slug; before, they let it change silently.

Covered by unit, story, route and e2e tests, checked by hand in the agent environment, and described in the handbook.
<!-- SECTION:FINAL_SUMMARY:END -->
