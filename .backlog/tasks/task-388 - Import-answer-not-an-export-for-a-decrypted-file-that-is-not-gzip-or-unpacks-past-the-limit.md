---
id: TASK-388
title: >-
  Import: answer 'not an export' for a decrypted file that is not gzip or
  unpacks past the limit
status: Done
assignee:
  - '@claude'
created_date: '2026-11-08 16:45'
updated_date: '2026-11-08 18:32'
labels:
  - ops
dependencies: []
priority: low
type: bug
ordinal: 450000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
An import (setup page or `scripts/import.ts`) decrypts the export and unpacks it with `gunzipSync` in `app/src/lib/server/instance-export.ts:161-162`, called from `app/src/lib/server/instance-import.ts:36` outside its `try`. `gunzipSync` throws on content that is not gzip and a `RangeError` when the output passes the limit of 1 GiB; neither is caught.

Case: a file sealed with a known passphrase whose content is not gzip, or a gzip bomb, is uploaded on `/setup`. The page answers with status 500 instead of the refusal "The file is not a grimoire export." (`not-an-export`). Nothing is written. Only a hand-made file reaches this path.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A sealed file whose content is not gzip, or unpacks past the size limit, is refused with the error not-an-export, on the setup page and in scripts/import.ts
- [x] #2 A spec in instance-import.spec.ts covers a sealed non-gzip content
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. readExport catches gunzipSync (not gzip, or past MAX_CONTENT_BYTES) and returns not-an-export; importExport and scripts/import.ts pass it on as every other refusal.
2. Spec in instance-import.spec.ts seals content that is not gzip.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The spec makes gzipSync pass the content through once (vi.mock of node:zlib), since only a hand-made file holds such content. The size limit path is the same catch; not covered by a spec, as it needs more than 1 GiB of output. Fails before ('incorrect header check'), passes after.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
An import of a sealed file whose content is not gzip, or unpacks past the size limit, is refused with not-an-export instead of a 500, on /setup and in scripts/import.ts. Spec in instance-import.spec.ts.
<!-- SECTION:FINAL_SUMMARY:END -->
