"""Fails when a page of the handbook is missing from `nav` in zensical.toml.

`zensical build --strict` catches broken links, not a page that the navigation never reaches.
"""

import sys
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def pages_in(entry):
    """Every page an entry of `nav` names, sections and their entries included."""
    if isinstance(entry, str):
        return [entry] if entry.endswith(".md") else []
    if isinstance(entry, list):
        return [page for item in entry for page in pages_in(item)]
    if isinstance(entry, dict):
        return [page for value in entry.values() for page in pages_in(value)]
    return []


config = tomllib.loads((ROOT / "zensical.toml").read_text())
project = config["project"]
docs = ROOT / project.get("docs_dir", "docs")
listed = set(pages_in(project.get("nav", [])))
pages = {path.relative_to(docs).as_posix() for path in docs.rglob("*.md")}
missing = sorted(pages - listed)
if missing:
    print("Not in nav in zensical.toml: " + ", ".join(missing), file=sys.stderr)
    sys.exit(1)
