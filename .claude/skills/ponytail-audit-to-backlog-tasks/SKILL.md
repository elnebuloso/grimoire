---
name: ponytail-audit-to-backlog-tasks
description: Turn the findings of a ponytail audit or review (Must fix / Should fix / Nice to have) into self-contained Backlog.md tasks. Proposes which findings to take, asks the user per group, re-checks each chosen finding in the code, enriches it with what an implementer needs, creates the tasks with the backlog CLI and does not start them. Use after /ponytail:ponytail-audit or /ponytail:ponytail-review, or when the user asks to turn audit or review findings into backlog tasks.
---

# Audit findings to Backlog tasks

The input is a report with numbered findings in the groups **Must fix**, **Should fix** and **Nice to
have**, each with *What this is*, *Problem*, *Fix* and *If we skip it*. Usually it is the last
ponytail-audit or ponytail-review in this conversation; otherwise the user pastes it. No report: say
so and stop.

The goal is a task anyone can work on **without the audit and without this conversation**. A task
that only makes sense next to the report is not done.

## 1. Propose

For every finding, decide *take*, *take as spike* or *skip*, with a one-line reason:

- **Already tracked:** search the backlog (`backlog search "<key words>" --plain`) and point to the
  task. Skip, or take only what the existing task misses.
- **Decided on purpose:** a decision record, the handoff, a code comment or an earlier
  conversation says the behaviour is intended. Skip and name where it was decided.
- **Reasoned, not measured:** the finding says so, or the case cannot be reproduced from the code
  alone. Take as a spike: measure first, decide later.
- **No concrete case:** skip; the audit's own rule is "no case, no finding".
- Otherwise: take.

## 2. Ask

Use AskUserQuestion with one question per group (Must fix, Should fix, Nice to have), skipping
empty groups, `multiSelect: true`. Each option is one finding: label `<number> <short title>`,
description with your proposal and its reason. Put the recommended ones first and mark them
"(Recommended)".

A question holds at most four options. A group with more findings is split into several
questions ("Nice to have 1/2", "2/2"); at most four questions go in one call, so make a second
call for the rest. Take only what the user selected.

## 3. Re-check and enrich each chosen finding

Read the code yourself; the report may be wrong or out of date. For each finding:

- **Confirm the case** by re-reading the lines and grepping the callers. If it does not hold,
  drop it and tell the user why. If it holds only partly, write the task for what holds.
- **Exact places:** files with line numbers or function names as they are written, so the
  implementer can search for them.
- **Where the test goes:** the existing spec or test file that already covers the neighbouring
  case, and how that file sets up what the test needs (module state reset, fixtures, mocks). If
  the case is hard to provoke (a crash at a precise moment, a race), describe a test that gets
  there without it.
- **Everything else the change reaches:** user-facing texts and their translations, user
  documentation that describes the behaviour, stories or end-to-end tests of a changed flow,
  migrations, configuration, scripts that mirror a changed type.
- **Traps:** check the proposed fix against what runs at the same time or shares the data
  (concurrent jobs, caches, other callers). A fix that is safe only under a condition names the
  condition and how to confirm it.
- **Commit type** per the project's release rules (for example `fix` for released behaviour,
  which may cut a release).

## 4. Create the tasks

One task per finding, created with the backlog CLI only, never by editing its files.

- **Title:** `<Area>: <what changes>`, as an imperative or a statement of the result.
- **Type and priority:** Must fix → `High`, Should fix → `Medium`, Nice to have → `Low`. Type
  from the configured ones: a defect is `bug`, an improvement `enhancement`, a spike `spike`.
  Never leave either off.
- **Labels** from the vocabulary already in use (read them off existing tasks); none rather than a new one.
- **Description**, in this order, each section a `###` heading:
  1. `### What this is`: the part of the system and what it is for, so a stranger understands it.
  2. `### Problem`: the concrete case, input or situation leading to the wrong result, with the
     places in the code.
  3. `### Fix`: the smallest fix that works, the places to change, the test and where it goes,
     and what else the change reaches (texts, docs, other tests).
  4. `### If we skip it`: what users or operators live with.
  5. `### Notes for the implementer`: commit type, traps, commands to run (for example the
     project's targeted test command), anything you found while checking that the report did not say.
- **Acceptance criteria** (`--ac`, repeatable): observable outcomes, each one checkable, including
  the test that covers it.
- A spike's criteria are a measurement and a written recommendation, and they say that nothing is
  built before the user decides.

Write the description to a temporary file in the scratchpad and pass it with
`-d "$(cat <file>)"`; quoting Markdown on the command line breaks it.

## 5. Check every task against a stranger

Read each task with `backlog task view <id> --plain` and ask: could someone who has never seen the
audit or this conversation do this, without searching for anything the task could have told them?
Typical gaps: a test location that was only guessed, "do it like X" without saying what X does, a
user-doc page not named, a claim from the report taken over unchecked. Close the gaps with
`backlog task edit <id> -d …` before reporting.

## 6. Finish

- Commit the new task files on their own, if the project commits its backlog
  (`chore(backlog): …`, plus the project's attribution lines). Never push.
- Report a table: group, task ID, title, type and priority. Below it, what you dropped and why,
  and every point you could not verify, as an open question in the task that needs it.
- **Do not start any task.** Starting work is the user's call.
