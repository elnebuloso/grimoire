# Project memory

Rules in `.claude/rules/` load in every session and say how work is done here. Facts learned while
building grimoire – how a tool, a library or the environment behaves – are in `.claude/memory/`,
loaded on demand: read the file before working in its area.

| File | Read before |
|---|---|
| `.claude/memory/sveltekit-server.md` | hooks, login, OIDC, CSRF, adapter-node or a `csr = false` page |
| `.claude/memory/runtime.md` | the image, child processes or code in `scripts/` |
| `.claude/memory/testing.md` | choosing or running tests, specs that mock modules, e2e files, the benchmark |
| `.claude/memory/trying-by-hand.md` | the agent environment, its fixture data, curl, the Playwright MCP browser, `docker exec` |
| `.claude/memory/ui.md` | messages, components or stories |
| `.claude/memory/database.md` | a schema change, `/setup`, export or import |
| `.claude/memory/releases-and-handbook.md` | a release or a page in `docs/handbook/` |

## Dependencies

- A new or updated dependency is at least two weeks old and pinned to an exact version; security
  fixes are the exception. The same holds for base images, images in examples and GitHub Actions.
- A GitHub Action is pinned by the commit SHA of its version tag, with the tag as a comment
  (`actions/checkout@<sha> # v7.0.1`): a tag can be moved. `gh api repos/<owner>/<action>/git/ref/tags/<tag>`
  gives the SHA; an annotated tag needs one more `git/tags/<sha>` lookup.

## Git and Backlog

- Update with `git fetch origin && git rebase origin/main`, in place of the `git pull --rebase` of
  the charter's `base.md`. VS Code fetches in the background; a fetch at the same moment writes
  `main` twice into `.git/FETCH_HEAD`, and `git pull --rebase` stops with "Cannot rebase onto
  multiple branches", also with `origin main` named.
- `backlog task list --plain | head` crashes (Bun, "Error is not a constructor"); use `--limit`
  instead of `head`.
