---
id: TASK-103
title: Read the source form fields in one place and generate the wizard hidden inputs
status: To Do
assignee:
  - '@claude'
created_date: '2026-10-30 02:59'
labels:
  - admin
milestone: m-0
dependencies:
  - TASK-99
references:
  - app/src/lib/server/admin/projects.ts
  - 'app/src/routes/manage/projects/[id]/sources/[sourceId]/+page.server.ts'
  - app/src/routes/manage/projects/new/+page.server.ts
  - app/src/routes/manage/projects/new/+page.svelte
priority: medium
type: chore
ordinal: 165000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Found by a code review of the management area on 2026-10-30.

The list of fields of a source is spelled out in about a dozen places:
- `app/src/lib/server/admin/projects.ts`: `SourceSettings`, `SourceForm`, `SourceRow`, `SOURCE_COLUMNS`, `toSettings`, the `values` object and the `INSERT`/`UPDATE` in `saveSource`
- `app/src/routes/manage/projects/[id]/sources/[sourceId]/+page.server.ts`: `readSourceForm`, which reads the form twice (form and echoed values)
- `app/src/routes/manage/projects/new/+page.server.ts`: `WizardValues` and `readInput`
- `.../sources/[sourceId]/+page.svelte`: defaults and fields
- `app/src/routes/manage/projects/new/+page.svelte`: defaults, visible fields, hidden fields and the summary list

The last field added, `docsUrl` (commit `fbd84f9`), touched eight non-test source files besides messages and a migration. The wizard is the fragile part: each step re-posts the other steps' values as hidden inputs, so a field added to the visible block but forgotten in the hidden block is silently reset to empty on the way to the summary. The type system does not notice, because the server reads every field with `?? ''`.

`.claude/rules/ui-components.md` ("share the parts when the wholes differ") is already followed for the markup (shared field components). The duplication meant here is the server-side parsing and the hand-written list of hidden inputs. The field names of both forms are identical except the source name (`name` on the source page, `sourceName` in the wizard).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 One server function reads the source fields from form data and both the source page and the wizard use it
- [ ] #2 The wizard hidden inputs that carry other steps values are generated from the values object, not listed per field
- [ ] #3 A test shows that every source field survives the wizard steps to the summary unchanged
- [ ] #4 No behaviour change otherwise: existing source page, wizard and e2e tests pass
<!-- AC:END -->
