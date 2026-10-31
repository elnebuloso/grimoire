# Writing documentation

!!! info "Prerequisites"
    - Reader: author, a person or an agent.
    - Required access: write access to a Git repository that is a source of grimoire. The admin
      sees which repositories, branches and paths those are.

    New to grimoire? Read [Concepts](index.md) first.

Agents never get a whole page, only the snippets that match their search, each on its own. Write
so that every section makes sense without the rest of the page.

## One topic per file

One page covers one service, tool or process. Two topics in one file mix their sections in search
results and share one `Edit:` file; split them into two pages that link to each other. Search for
an existing page before writing a new one, and extend it instead of adding a second.

## Every section stands on its own

An agent may see nothing but one section. Give each:

1. a heading that names the topic: `Rolling back a deploy`, not `Rollback` or `Notes`;
2. one sentence on what it covers and when it applies;
3. then the specifics: commands, values, steps.

Never point at earlier sections ("as above", "this service"). Source and parent headings are in
the snippet's title path, such as `auth-service › Deployment › Rollback`; do not repeat them in
the text.

## How a page is split

| Part of the page | Becomes |
|---|---|
| Text under `#` before the first `##` | The snippet `Overview`. |
| A heading with its section | One snippet. |
| A section under about 50 tokens, without subsections | Merged into its parent section; its anchor reads the parent. |
| A section over about 800 tokens | Cut between paragraphs, lists, code blocks and tables into `Rollback (1/2)`, `Rollback (2/2)`, never inside one; a single block over 800 tokens stays whole. |

A token is about four characters. Sections of a few paragraphs work best: short ones lose their
own heading, long ones lose their context in the second part.

## IDs and links

A snippet's ID is `<source>/<file without .md>#<anchor>`; the anchor is built from the
heading as MkDocs and Zensical build it. Renaming a heading or moving a file changes the ID, and
links to the old one become dead links.

Link with relative links, as MkDocs expects them: `deploy.md#rollback`. Agents can follow them
with `read`. A link that leaves the source's path is dead, in MkDocs as well.

## MkDocs and Zensical syntax

| Element | In the snippet |
|---|---|
| Front matter | `title` becomes the page title instead of the first `#`; the front matter is not text of any snippet. |
| Admonitions `!!! warning "Caution"` | `> **Caution:** …` with the content. |
| Content tabs `=== "Linux"` | `**Linux:**` with the content. |
| `nav` in `zensical.toml` or `mkdocs.yml` | The order of pages in the index; pages missing from `nav` follow by path. The first of the two files found in the source path or above it counts. |
| `toc` `slugify` and `separator` in the site config | Anchors are built the same way for `pymdownx.slugs.slugify` with its options, `markdown.extensions.toc.slugify` and `slugify_unicode`; any other function, and a `normalize` or `case` value `pymdownx.slugs.slugify` does not know, falls back to the default with a warning. |
| Includes `--8<-- "file.md"` | The included file, also from outside the source's path. |
| Partial includes `--8<-- "file.md:4:6"`, `--8<-- "app.py:main"` | The selected lines, or those between `--8<-- [start:main]` and `--8<-- [end:main]`; the markers are dropped everywhere. |
| URL includes `--8<-- "https://docs.example.com/shared/footer.md"` | The fetched file, when the site config sets `url_download: true` under `pymdownx.snippets` and the operator allowed the origin. It is fetched at every sync. A file included by URL may include further URLs only. |
| Symlinks | Followed while they point inside the repository. |
| Mermaid diagrams | Kept as a code block. |
| Images | Only the alt text: write one that says what the image shows. |
| HTML comments | Dropped. |

## Sync warnings

A warning skips one page or one include, or a setting of the site config; the rest of the source
syncs. When every page is skipped, the sync fails and agents keep getting the previous index. Admins see the warnings on the source
page. Fix them in the repository; the next sync clears them.

| Warning | Fix |
|---|---|
| `docs/deploy.md: skipped, …` | The page could not be processed, often broken front matter; fix what the message names. |
| `docs/deploy.md: include "shared/note.md" not found` | Correct the path; includes resolve from the repository root. |
| `docs/deploy.md: include "../secrets.md" points outside the repository` | Include only files inside the repository. |
| `docs/a.md: include cycle docs/a.md → docs/b.md → docs/a.md, "docs/a.md" not inserted again` | Remove one include of the cycle. |
| `docs/deploy.md: include "app.py" has no section "main"` | Add `--8<-- [start:main]` and `--8<-- [end:main]` to the file, or correct the name. |
| `docs/deploy.md: includes exceed 1000000 characters, "big.md" and every later include not inserted` | A page may pull in at most 1,000,000 characters through includes; include less, or split the page. |
| `docs/deploy.md: include "https://…" not inserted, URL includes are disabled (url_download in the site config)` | Set `url_download: true` under `pymdownx.snippets`, or include a file from the repository. |
| `docs/deploy.md: include "https://…" not fetched, https://… is not listed in INCLUDE_URL_ALLOW` | Ask the operator to allow the origin, or include a file from the repository. |
| `docs/deploy.md: include "https://…" not fetched, …` | The fetch failed: a redirect (not followed), an error status, more than 1 MiB, no answer within 10 seconds, more than 100 URL includes in one sync, or credentials in the URL. |
| `docs/deploy.md: include "notes.md" in the URL include "https://…" is not a URL, not inserted` | A file included by URL may include URLs only. |
| `docs/run#1.md: "#" in the file name, skipped` | Rename the file: in an ID, `#` starts the anchor. |
| `docs/link.md: not readable inside the repository, skipped` | The file is a symlink that points outside the repository; replace it with the file. |
| `site config ignored, …` | Fix `mkdocs.yml` or `zensical.toml` as the message says; until then its `nav` and `toc` settings do not apply. |
| `mkdocs.yml: toc slugify "…" is not supported, heading IDs use the default` | Use one of the slugify functions listed under [MkDocs and Zensical syntax](#mkdocs-and-zensical-syntax), or accept the default anchors. |
