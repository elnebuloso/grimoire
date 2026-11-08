# Releases and handbook

## Releases

- semantic-release (`.releaserc.json`) writes the release notes from the commits on `main`. After
  every release, once the pipeline has published it, add a short summary at the top of its GitHub
  release with `gh release edit`: what the release is about and what an operator has to do, above
  the generated list.

## Handbook

- A new page in `docs/handbook/` needs an entry in `nav` in `zensical.toml`. `make handbook`
  fails on a page missing from `nav` (`scripts/check-handbook-nav.py`, since `--strict` checks
  only links) and on a broken link.

## Fixture repository

- The fixture repository `grimoire-fixture-docs` is pushed over SSH
  (`git@github.com:elnebuloso/grimoire-fixture-docs.git`); an `https` clone has no credentials.
