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

## Inventory

The building blocks of the pages in `app/src/routes`. A building block is a group of elements
with a structure or behaviour of its own; a single element, such as the link back to all projects
or a sentence like "No projects yet.", is not one, and a component around it would add nothing.

| Building block | Component | Used in |
|---|---|---|
| Message of a rejected form | `FormError` | login, setup, password, API keys, project, source, project wizard |
| Text, password or read-only field with its label | `TextField` | login, setup, password, API keys, project, source, project wizard |
| Multi-line field with its label | `TextAreaField` | source, project wizard |
| Checkbox or radio button with its label after it | `ChoiceField` | API keys, source, project wizard |
| Form with one button that asks before it posts | `ConfirmForm` | API keys (revoke), project (delete), source (delete) |
| List of terms and values | `DescriptionList` | admin start page, source status, project wizard summary |
| Table of projects with their figures | `ProjectStatsTable` | public start page, admin start page |
| Header with the login action or the logged-in admin | stays in its route, used once | root layout |
| Instructions to connect Claude Code | stays in its route, used once | public start page |
| "Needs attention" list with nested warnings | stays in its route, used once | admin start page |
| Step list of the project wizard | stays in its route, used once | project wizard |
| Sync result, sync error, warnings, dead links and pages of a source | stays in its route, used once | source |
| API key list | stays in its route, used once | API keys |

The fields of a source appear in the source form and in the project wizard alike, but under
different field names and with a token that is stored on one page and only entered on the other.
They share the field components rather than one component for the whole set.
