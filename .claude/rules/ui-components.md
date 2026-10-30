# UI components

Shared UI components live in `app/src/lib/components/`, each with `<Component>.stories.svelte`
next to it.

## When something becomes a component

- **The catalog is the inventory.** Before writing markup for a form field, a table or a list,
  look through `app/src/lib/components/` (or `make storybook`, `http://localhost:6006`) and extend
  what is there instead of writing a second one. No list of components is kept anywhere else; it
  would go stale with the next one.
- **The second use earns a component.** Markup one route needs stays in that route; once a second
  route needs the same building block, it moves to `app/src/lib/components/`.
- **Only building blocks become components:** a group of elements with a structure or behaviour of
  its own. A single element, such as a back link or an empty-state sentence, stays where it is; a
  component around it adds nothing.
- **Share the parts when the wholes differ.** Two forms with the same fields under different rules
  (the setup form and the login form) share the field components, not one component for the whole
  set.

## Styling

`docs/design.md` is the binding source of the visual design; a value it doesn't name isn't used.

- **Design values only through tokens.** Colours, shadows, radii, spacing, fonts and the transition
  are custom properties in `app/src/app.css`; components and pages use `var(--…)` and contain no
  raw colour value. A new token comes into `docs/design.md` first, with a light and a dark value
  that pass its contrast check.
- **`app/src/app.css` holds what every page shares:** the tokens, the fonts, the base of native
  elements (type, links, focus ring, inputs, buttons, tables, code) and the page primitives
  `.sheet`, `.notice`, `.table-scroll` and `.muted`. Nothing else goes there.
- **Component styles live in the component's own `<style>` block**, page arrangements in the
  page's. A style a second page needs moves into a component, not into `app.css`.
- **Both schemes, always.** Check a change in light and dark; the Theme switch in the Storybook
  toolbar sets `data-theme` on `<html>` as the product does.

## Stories

- **Every component comes with stories**, one per state it can be in: the usual one, empty, and
  error or validation states where it has them. Each has a `play` function that checks what the
  state shows; input, toggles and form state are checked by clicking and typing as a user would.
- **Stories pass the accessibility check.** Every story runs axe (`@storybook/addon-a11y`); a
  violation fails it. Fix the component; switch a rule off only for a single story, in its
  `parameters.a11y`, with the reason next to it – never globally.
- **Stories are tests.** They run in a headless Chromium in `make test` and in CI; a broken story
  fails the build.
- **Storybook stays out of the product.** It is a development dependency; nothing but
  `*.stories.svelte` imports it, and neither the build nor the image contains it.

## Texts and languages

- **No text in markup.** Every text of a component or page is a message in each
  `app/messages/<locale>.json`, used as `m.<key>()` from `#lib/paraglide/messages.js`. A new text
  gets its key in every message file; English is the base language and the fallback.
- **A new language is data, not code:** `app/messages/<locale>.json` with every key, and the locale
  in `locales` of `app/project.inlang/settings.json`. The switch in the header lists it on its own.
- **Code that plain Node loads returns codes, not texts.** The messages are not available there
  (e.g. `app/src/lib/server/admin/auth.ts`, used by `scripts/`); the route translates the code.
