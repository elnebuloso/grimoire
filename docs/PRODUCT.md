# PRODUCT.md

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Admins** of the instance, usually the developer or platform engineer who runs it. They come in
  for a job and leave: adding a source and testing its Git access, creating an API key and copying
  it once, finding out why a sync failed or a page has dead links, checking what agents searched
  for and did not find. Most visits start because something is wrong or about to change, so the
  pressure is on getting the cause and the fix quickly.
- **Visitors** without an account see the start page: the sources with their stats, a query
  against the public sources and how to connect an agent.
- **AI agents** are the main consumers of the data, through MCP and HTTP, but they never see the
  UI. The UI exists so that people can configure, inspect and trust what agents get.

## Product Purpose

grimoire is a self-hosted knowledge base for AI agents. It reads Markdown documentation from Git
repositories, splits every page into snippets along its headings and serves the matching ones
within a token budget, so agents learn how an organisation's internal services, tools and
processes work without loading whole doc sets. Git stays the source of truth: people and agents
write in the repository, grimoire only reads. The admin area is where sources, API keys and
instance settings are managed and where sync problems become visible.

## Positioning

Like Context7, but for an organisation's internal knowledge, and built on the repositories it
already has: any Git server, plain Markdown with MkDocs and Zensical syntax, no second place to
write documentation.

## Brand Personality

- **Calm:** nothing shouts, not even a failed sync; urgency comes from the words, not from alarm.
- **Precise:** exact counts, IDs, commits and error causes, never a vague "something went wrong".
- **Candid:** it says what an action breaks or what cannot be undone before the admin does it.

## References

- **Tailscale admin console:** a small infrastructure tool for operators, with plain tables, state
  written as words and confirmations that say what breaks.
- **GitHub repository settings:** dense forms, a danger area with typed confirmation and machine
  strings set apart from prose.

## Anti-References

- **SaaS KPI dashboard:** metric tiles, charts and status pills turn a ledger into decoration.
- **AI-product aesthetic:** sparkles, gradients, chat bubbles and "magic"; grimoire serves agents
  but is not itself an AI product.
- **Spell-book kitsch:** parchment, runes and fantasy lettering, which the name invites; this is an
  operator's tool.
- **Docs-reader look:** people read the documentation in MkDocs or Zensical; this UI manages
  sources and does not compete with them.

## Product Principles

- **Show what the agent gets.** Previews and "Try a query" return exactly the agent's answer, so
  an admin judges the real output, not a prettified version of it.
- **The cause and the fix, in words.** Every error and warning names what happened and what to do;
  status is a word first, never only a colour or an icon.
- **Consequences before the action.** Anything irreversible or breaking (deleting a source,
  changing a slug, revoking a key, making a source public) says so before it happens.
- **Problems surface on their own.** What needs attention comes first; an admin should not have to
  open every source to find the broken one.
- **Fewer, quieter elements.** One way to do each thing; a new screen or control has to earn its
  place against the admin's next task.

## Accessibility & Inclusion

- WCAG 2.2 AA in the light and the dark scheme.
- Everything works by keyboard alone, with a visible focus on every focusable element.
- No information by colour alone: every status is also a word.
- `prefers-reduced-motion` is respected.
- Usable at 200% zoom and on a narrow phone screen without horizontal scrolling of the page
  (WCAG reflow).
- Every component story passes axe.
- Texts exist in English and German; layouts leave room for the longer German strings.
