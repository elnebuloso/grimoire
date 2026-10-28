# Until v1

Rules for the phase before `1.0.0`. Each section says when it ends; delete it then, and delete this
file in the commit that cuts `1.0.0`.

## Releases

- **No breaking-change markers.** A `BREAKING CHANGE:` footer cuts `1.0.0`, and leaving `0.x` is
  the user's call, not a side effect of a commit. `!` after the type is out too: the release config
  doesn't parse it and skips the commit, so the change ships without a release. A change that
  breaks something goes in as `feat` or `fix` and says so in the body.

## Frontend: function first

Ends when the user declares the visual design agreed. Until then the frontend is built for structure
and function, not looks; anything styled before it is thrown away.

- **No own styling.** No colours, fonts, shadows, radii, animations or theming — not in global CSS,
  not in `<style>` blocks, not inline, not as utility classes. Structural CSS only: layout
  (flex/grid), sizes, spacing, visibility. Anything beyond that only where the UI is otherwise not
  operable, with a comment saying why.
- **Native elements keep the browser default.** No reset, no normalize — at most
  `box-sizing: border-box` and `margin: 0` on `body` where the layout needs it.
- **Third-party components use their shipped stylesheet, unmodified.**
- **Design skills stay off.** Don't load a design, styling or animation skill for frontend work
  in this phase, even when its description matches.

## ADR status

Ends when the project owner (`Projectowner`, the ADRs' decider) has reviewed the ADRs, at the
latest with `1.0.0`.

- **Every ADR stays `Proposed`** — whatever it covers, and even when the user agrees with it
  in chat. The project owner reviews them all before `1.0.0` and is the only one who changes a
  status. Until then an ADR may be changed or deleted at any time.
