# UI and Storybook

## UI

- In a message of `app/messages/<locale>.json`, `{…}` is a placeholder: a literal `{ }` in the
  text becomes an input named " ". Name braces in words instead ("curly braces").

- A `ConfirmAction` inside a popover (`ActionMenu`) keeps its dialog inside the popover: hiding
  the popover hides the open dialog with it. `ActionMenu` therefore stays open behind the dialog
  and closes on the dialog's `close`.
- axe fails a button whose `aria-label` does not contain its visible text
  (`label-content-name-mismatch`): `buttonLabel` messages start with the visible label, e.g.
  „Password link for {email}“.
- `getByLabel('Name')` also matches the `SourcePicker` search; use
  `getByRole('textbox', { name: 'Name' })`.

## Storybook

- A native `popover` opened through `popovertarget` gives its button no `aria-expanded` attribute
  to assert, and `userEvent.keyboard('{Escape}')` does not close it: check closing and focus in the
  real browser instead.
- Storybook's `$app/forms` `enhance` never runs the submit function; it dispatches
  `storybook:enhance` on `window` with the submit event, and its `goto` dispatches `storybook:goto`
  with goto's arguments. A story listens to these to see what a form posts or a table navigates to.
- `play` cannot use Storybook's deferred `mount` through the Svelte CSF wrapper
  (`MountMustBeDestructuredError`): stub timers after mount instead.
- Stories run twice, in a light and a dark Chromium instance (`vite.config.ts`), so axe checks
  the contrast of both schemes.
