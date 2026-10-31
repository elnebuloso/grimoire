# Visual design

The agreed visual design of grimoire's web UI, the start page and the admin area. Build the frontend from this page: it holds every value and rule the design needs.

Its character: calm, tactile and quiet. Cool neutral surfaces, one petrol accent, and depth used only to show what lies on what.

## Principles

- **Depth has exactly three levels, each with one meaning.**
  - The **canvas** is the desk; the header and the page title sit on it.
  - A **sheet** is a section of work and lies on the canvas.
  - **Raised** means something you can press, or the item that is selected.
  - Anything inside a sheet that is not a control goes *down*, not up. These are **wells**: inputs, code, query answers, nested forms and the one-time API key.
  - Never put a sheet inside a sheet.
- **Status is text and an edge, never a badge.**
  - State values are coloured words, e.g. "failed" under Status, or "synced" / "failed" in the sync history.
  - Notices and lists that need attention carry a 3px bar on their leading edge.
  - There are no pills or emoji, and no status is shown by an icon. The word always carries the meaning; colour only repeats it.
- **One accent.** Petrol marks links, the primary button, focus and the info notice. It is used for nothing else.
- **Numbers are a ledger, not tiles.** Overview figures are a term | value list with right-aligned tabular numbers.
- **Mono only for machine strings:** slugs, commit hashes, snippet IDs, file paths, cron expressions, exclusions, the API key and snippet markdown.

## Colors

Every colour is a token with a light and a dark value, written with `light-dark()`:

```css
:root { color-scheme: light dark; }
[data-theme=light] { color-scheme: light; }
[data-theme=dark] { color-scheme: dark; }
```

| Token | Light | Dark | Use |
|---|---|---|---|
| `--canvas` | `#E3E6EA` | `#111418` | page background |
| `--sheet` | `#F6F8FA` | `#1A1E24` | sections |
| `--well` | `#ECEFF2` | `#13161B` | inputs, code, answers, nested forms, nav and switch tracks, table heads in flush sheets |
| `--raised` | `#FFFFFF` | `#282E36` | buttons, selected nav or switch item, focused input |
| `--line` | `#D6DBE1` | `#2C323A` | hairlines between rows and parts |
| `--edge` | `#7B828C` | `#7A828D` | control borders (at least 3:1 against well, sheet and raised) |
| `--ink` | `#1A1F26` | `#E8ECF0` | text |
| `--ink-2` | `#4A525D` | `#A6AEB8` | secondary text, labels of facts, table heads |
| `--accent` | `#0C5876` | `#7FC2DD` | links, primary button, focus ring |
| `--accent-hover` | `#08455D` | `#9DD2E7` | hover of the above |
| `--on-accent` | `#FFFFFF` | `#0A1C26` | text on `--accent` |
| `--accent-well` | `#DEE9EF` | `#142B38` | background of status notices |
| `--ok` | `#2B6A3C` | `#8FD1A0` | "synced", "Copied." |
| `--warn` | `#7A5200` | `#E5BC6A` | warning edge ("never synced", sync warnings, paused) |
| `--warn-well` | `#F4EBD8` | `#2F2611` | background of warning notices |
| `--err` | `#A02A1E` | `#F2998D` | "failed", "yes" under Sync error, error edge, danger button |
| `--err-well` | `#F7E4E0` | `#361D1A` | background of alerts |
| `--err-ink` | `#6E1C13` | `#FBD3CC` | text on `--err-well` |

Every text pair meets WCAG AA in both schemes: at least 4.5:1, or 3:1 for large text. The lowest pair is above 5:1. A new colour has to pass the same check in light and dark before it is used.

## Theme switch

The switch offers "System", "Light" and "Dark":

- **Default:** with no stored choice, the page follows `prefers-color-scheme` and changes with it.
- **A choice:** a stored choice sets `data-theme` on `<html>` and wins over the system setting. Choosing "System" removes the stored choice.
- **First paint:** the page must render in the chosen scheme from the first paint, with no flash of the other one.

It sits in the header of every page, next to the language switch. Both use the same segmented track (see Components).

## Typography

- **Fonts:**
  - Text is **IBM Plex Sans**: 400 for text, 500 for labels and emphasis, 600 for headings.
  - Machine strings are **IBM Plex Mono**, 400 and 500.
  - Both are under the SIL Open Font License and self-hosted as woff2, with no font CDN.
  - Fallbacks are `system-ui` and `ui-monospace`.

| Element | Size / line height | Weight |
|---|---|---|
| body | 15px / 1.55 | 400 |
| `h1` | 26px (23px below 40rem), tracking -0.015em | 600 |
| `h2` | 18px | 600 |
| `h3` | 15px | 600 |
| `h4` | 14px | 500 |
| labels, legends | 14px | 500 |
| table cells | 14px; table heads 13px | 400 / 500 |
| hints, meta | 13px | 400 |
| mono in running text | 0.9em | 400 |

## Space, shape, depth, motion

- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48 px.
  - Use 24px between sheets and as sheet padding (16px below 40rem).
  - Use 16px between form fields.
- **Width:**
  - Header, nav and content are at most 78rem wide and centred.
  - Single-form pages (setup, login, password pages, account, error) use a 30rem column aligned left with the header, not centred.
- **Radius:** 12px for sheets and the nav track, 8px for controls, notices and wells, 6px for small parts.
- **Shadows**, with `--shade` = `rgb(28 38 52 / .10)` light / `rgb(0 0 0 / .45)` dark and `--shade-deep` = `.22` / `.65`:
  - sheet: `0 1px 2px var(--shade), 0 14px 32px -20px var(--shade-deep)`
  - raised: `inset 0 1px 0 <highlight>, 0 1px 2px var(--shade), 0 2px 5px -2px var(--shade-deep)`. The highlight is `rgb(255 255 255 / .9)` light and `rgb(255 255 255 / .06)` dark.
  - well (sunk): `inset 0 1px 2px var(--shade)`
- **Motion:** colour, background and shadow transitions of 180ms `cubic-bezier(.2, .7, .3, 1)`. Nothing moves or scales. Under `prefers-reduced-motion: reduce` the duration is 0.
- **Focus:** a 3px `--accent` outline at 2px offset on every focusable element.
- **Touch:** on `pointer: coarse` every control is at least 44px high.
- **Narrow screens:** below 40rem paddings shrink as noted above. Tables scroll inside their own container; nothing else scrolls sideways. Code, hashes and keys wrap.

## Components

- **Header.** It sits on the canvas, not on a sheet. On the left is the wordmark "grimoire" linking to the start page. On the right are the session links ("Logged in as" + email, "Manage", "Log out") followed by the Language and Theme switches. "Manage" is a link that looks exactly like the "Log out" button: a raised control, ink colour, no underline. Before the header, a "Skip to content" link is the first stop of the keyboard: hidden until focused, then a raised button at the top left.
- **Footer.** It sits on the canvas below the content, as wide as the header, separated by a `--line` rule. It holds the product name "grimoire" at the start of the line, 13px, weight 500, `--ink-2`, whatever `INSTANCE_NAME` calls the instance, followed by the version at weight 400; a release version links to its release notes in the same colour, `--accent` on hover, and the icon links to the GitHub repository and the documentation side by side at the end.
- **Icons.**
  - Line icons from Lucide (`@lucide/svelte`), imported one by one; brand marks Lucide lacks, such as the GitHub mark, as an inline SVG in the same box.
  - 20px, stroke width 2, `currentColor`: `--ink-2` at rest, `--accent` on hover, with the transition. The hit area is at least 32px, 44px at `pointer: coarse`.
  - An icon link has a text name for assistive technology and as tooltip; the SVG itself is hidden from it.
  - An icon may stand beside a word; it replaces one only where the target is known by its mark, such as the footer links.
- **Segmented track** (Language, Theme):
  - A recessed `--well` groove with a small label.
  - The chosen option is raised out of it: `--raised` plus the raised shadow, ink colour, weight 500.
  - The other options are plain `--ink-2` text.
- **Management nav.** The same track, larger, below the header: items 38px high, current page raised. "Change the password" is pushed to the far end, apart from the area's pages. Below 40rem it wraps.
- **Sheet:**
  - A section with an `h2` head row; a section's primary action (e.g. "Sync now", "New source") sits right in that head row.
  - Sub-parts inside a sheet are separated by a hairline and a 16px gap, not by another sheet.
  - Tables that fill a sheet use a *flush* sheet: no padding, the head row padded, the table head on `--well`.
- **Page layout on wide screens (from 64rem):**
  - Overview: "Needs attention" first, the numbers ledger (19rem) to its right at the same height, with Sources full width below. Below 64rem they stack in that order.
  - Source page: status, history, pages and preview on the left, followed by Change the slug and Delete; a 25rem column on the right holds Settings alone, so no column runs far past the other. Change the slug and Delete keep the 30rem width of a single form. Below 64rem they stack: status, Settings, Change the slug, Delete.
  - Start page: Sources full width, then "Try a query" next to "Connect an agent". It has no page title on the canvas: the heading of the Sources sheet is the page's `h1`, set at the `h2` size.
- **Facts (description list).** A two-column ledger: term in `--ink-2` at 14px, value in ink, hairlines between rows. The numbers variant right-aligns tabular values at weight 500.
- **Tables:**
  - Heads in `--ink-2` at 13px / 500, no wrap. Rows separated by hairlines, 12px cell padding.
  - Numbers right-aligned and tabular.
  - The source cell stacks the name (500), the slug (mono, `--ink-2`) and the description.
- **Notices:**
  - All share one shape: a tinted band with a 3px leading edge and an 8px radius.
  - Status (`role=status`) uses `--accent-well` with an `--accent` edge. A warning uses `--warn-well` with a `--warn` edge.
  - An alert (`role=alert`, used for form errors) uses `--err-well`, an `--err` edge and `--err-ink` text.
- **Needs attention:**
  - One item per problem of a source, most severe first: sync errors, then warnings and dead links, then paused polling and never synced.
  - Each item carries the leading edge: `--err` for a sync error, `--warn` for everything else. The slug link is in mono; a dead-link count is a plain link.
  - A sync error is followed by its fix as a sentence in `--ink-2`.
  - Nested warnings are one step quieter: a 1px `--line` edge in `--ink-2`.
- **Inputs:**
  - A `--well` field with an 8px radius, a 1px `--edge` border, a sunk shadow and a minimum height of 42px.
  - On focus it rises: `--raised` background and `--accent` border. An invalid field gets an `--err` border.
  - Read-only fields drop the well and get a dashed border in `--ink-2`.
  - Machine-string fields (slug, exclusions, cron) use mono.
  - Labels sit above the field, 6px apart.
  - Checkboxes are 18px with `accent-color: var(--accent)`, their label to the right.
- **Buttons:**
  - Raised, 40px high, 8px radius, 14px / 500.
  - Secondary: `--raised` with a soft edge border.
  - Primary: `--accent` background with `--on-accent` text.
  - Danger ("Delete source", "Revoke"): `--err` text and border on raised, never filled red.
  - Pressed state: the button sinks into a well.
- **Nested forms** ("Change {name}" for an API key) open from a `<details>` summary in accent colour, inside an inset well.
- **One-time API key:** the key sits in a dashed, mono `output` inside a well, next to "Copy key". The copy result follows as coloured text: "Copied." in `--ok`, the failure text in `--err`.
- **Code and answers:** `<pre>` in a well, mono 13px / 1.6, wrapping (`pre-wrap`). Snippet previews are a numbered list: the number in mono `--ink-2` before each title path.

## Not part of this design

These would break its character:
- gradients, glow, translucency or blur
- coloured page backgrounds
- badges or pills for values
- stat cards
- emoji
- a second accent colour
- shadows on anything that is not a sheet or a raised control
- motion that moves or scales elements
