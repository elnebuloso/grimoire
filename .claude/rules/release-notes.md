# Release notes

semantic-release writes the list of commits. Once the pipeline has published a release, put a
summary above that list with `gh release edit <tag> --notes-file …`, keeping the generated list
below it unchanged. The reader is the operator who decides whether and how to upgrade.

```markdown
## What this release is about

- **<Topic in a few words>.** <One to three sentences on what changes for users, admins or
  agents.>

## What an operator has to do

- **Upgrade:** pull the new image and restart. <Migration on first start or none; re-indexed or
  not.>
- **<What to act on or will look different>:** <the setting, message or path, verbatim, and what
  to do about it.>

---
```

- **One bullet per topic** under "about", the topic in bold, most important first. A security fix
  says what an attacker could do and that it is closed; no CVE or advisory without its ID.
- **The first operator bullet is always the upgrade itself**: image, migration, re-indexing. When
  nothing else is needed, it ends with "Nothing else is required." and stays the only bullet.
- **Further operator bullets only for what needs an action or changes what the operator sees**: a
  setting, a limit, a message, a changed ID. Each names the exact setting, message text or path in
  the product (**Sync now**, `ADDRESS_HEADER`), so the operator can act without reading the list.
- **No internals:** no file, function or test names; the generated list carries the commits.
- A small release keeps the structure, with one bullet in each section.
- Entries of the list that fix earlier changes of the same release get one sentence under "about":
  "Several entries in the list below fix changes made earlier within this release."
