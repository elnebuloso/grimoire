# Releases and handbook

## Releases

- semantic-release (`.releaserc.json`) writes the release notes from the commits on `main`; the
  summary on top follows `.claude/rules/release-notes.md`. A `test`, `chore` or `docs` commit on
  top of unreleased `fix` commits still releases them: the analyzer reads every commit since the
  last tag.

## Handbook

- A new page in `docs/handbook/` needs an entry in `nav` in `zensical.toml`. `make handbook`
  fails on a page missing from `nav` (`scripts/check-handbook-nav.py`, since `--strict` checks
  only links) and on a broken link.

## Fixture repository

- The fixture repository `grimoire-fixture-docs` is pushed over SSH
  (`git@github.com:elnebuloso/grimoire-fixture-docs.git`); an `https` clone has no credentials.
