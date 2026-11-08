---
id: TASK-394
title: 'Spike: pass frontmatter fields such as status or last_updated to agents'
status: To Do
assignee: []
created_date: '2026-11-08 19:19'
labels:
  - parsing
  - agent-api
dependencies: []
priority: low
type: spike
ordinal: 456000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
User feedback: an agent should be able to tell how current and binding a section is, e.g. "a Confluence page from 2023 marked historic; the current service documentation in Git says X". The feedback proposes a service in front of grimoire that turns Confluence, SharePoint or Jira into curated Markdown in a Git repository, with metadata such as `source`, `source_url`, `owner`, `last_updated`, `status`, `authority`, `version`. Today `splitFrontmatter` in `app/src/lib/server/parsing/preprocess.ts` keeps only `title`, `description` and `tags`; every other frontmatter field is dropped and never reaches an agent. These fields are no standard: MkDocs Material has `status`, Hugo `date`/`lastmod` (not checked here), so passing any of them on makes a convention of grimoire that authors and a service in front would follow. Connectors for other systems are out of scope: Git stays the source of truth (`docs/CONCEPT.md`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The notes say which frontmatter fields the vendored benchmark documentations and common generators (MkDocs Material, Zensical, Hugo) actually use for status and dates
- [ ] #2 The notes compare a fixed list of fields with passing every field on, including the extra tokens per snippet measured on the benchmark documentations
- [ ] #3 The notes say whether the date of the last commit touching a page would serve agents as well as a `last_updated` written by hand
- [ ] #4 The notes end with a recommendation for the owner: no change, or a follow-up task naming the fields and where an agent sees them
<!-- AC:END -->
