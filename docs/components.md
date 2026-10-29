# UI components

Shared UI components live in `app/src/lib/components/`. Markup used by one route only stays in
that route; once a second route needs the same building block, it moves here.

## Look in the catalog first

`make storybook` opens the component catalog at `http://localhost:6006`: every component with
each of its states. Before writing markup for a form field, a table or a list, check whether a
component for it exists, and extend that one instead of writing a second.

## Every component comes with stories

A new component gets a file `<Component>.stories.svelte` next to it, with one story per state it
can be in: the usual one, empty, and error or validation states where it has them. Each story
has a `play` function that checks what the state shows; a component that takes input, toggles
or keeps form state also checks that behaviour there, by clicking and typing as a user would.

The stories run as tests in a headless Chromium in `make test` and in the CI pipeline, so a
story that breaks fails the build. Storybook is a development dependency only: neither the
production build nor the Docker image contains it.
