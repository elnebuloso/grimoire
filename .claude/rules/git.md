# Git

- **Never push on your own.** Commit locally; the user pushes, or asks you to in so many words.
- **The commit type cuts the release.** CI derives the next version from the commits on the
  default branch, so pick the type for what the user gets: `feat` and `fix` only for behaviour
  that ships, everything else (`chore`, `docs`, `ci`, `test`, `refactor`) for what doesn't.
- **Exception: empty `feat` commits on request.** The user records a finished state – planning
  included – as a release by asking for an empty `feat` commit. Make it when asked; don't
  object that nothing ships.
