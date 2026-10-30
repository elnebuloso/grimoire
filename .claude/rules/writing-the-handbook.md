# User Documentation Guidelines

The docs are a functional manual for the people who use the product, not a record of how it was built. Write strictly for the single reader role named at the top of each page. Content for another role belongs on that role's page.

---

## Focus on what the reader cannot see

The reader has the product in front of them. Do not describe what is self-evident in the interface: no visual descriptions, no button-by-button walkthroughs, and no explanations of obvious UI state. If an action requires a paragraph of UI description to be found, treat it as a product design flaw.

> **Rule of Thumb:** A sentence earns its place only if it passes the Actionability Test: *Will the reader do or decide anything differently knowing this?* If not, delete it.

### Permitted Content

A sentence is justified **only** if it covers one of the following:

1. **Invisible Rules & Limits:** Durations, rate limits, lockouts, quotas, validation criteria, data retention, or elements displayed only once.
2. **Navigation Anchors:** Direct, minimal path hints (e.g., `Settings > Team > Roles`) when an item is nested or hard to locate.
3. **Actionable Errors:** Exact error texts, why they occur, and the explicit step to resolve them.
4. **Irreversible Warnings:** Critical risks, data loss, or system-wide side effects before an action is taken.
5. **Decisions & Outcomes:** Necessary context required to choose between options and what happens after a selection is made.

---

## Never in user docs

* **Implementation Details:** Algorithms, encryption internals, database architecture, storage types, framework names, or tech stack comparisons.
* **Product History & Design Rationale:** Why a feature was built this way, legacy behavior, discarded alternatives, or roadmap promises.
* **Vague Reassurances:** Avoid empty phrases like *"Don't worry, this is safe"*. State the exact technical guarantee or boundary instead.
* **Inaccessible Paths & Variables:** Settings, environment variables, or config files the current reader role cannot access or modify.

*Note: If a detail matters to maintainers or developers, move it to code comments or internal architecture docs.*

---

## Structure & Form

* **Lead with the Point:** Start directly with the rule, error, or warning. 
* **Style:** Use short, imperative sentences and active voice. Limit each paragraph to a single core idea.
* **No Filler:** Omit introductory fluff, welcome notes, and summaries. If removing unneeded text leaves a section empty, delete the section header.

---

## Document Types & Intent

To keep reference documentation lean without blocking new users, separate content by intent:

| Doc Type | Purpose | Allowed Content |
| :--- | :--- | :--- |
| **Reference Docs** | Day-to-day operation & lookup | Strict adherence to the rules above. Zero narrative. |
| **Getting Started / Concepts** | Mental models & onboarding | High-level workflows, key concepts, and architecture overviews. |

---

## Reviewing docs

When reviewing any sentence, ask:
1. *Who is the target reader for this page?* (If it's another role, move it).
2. *What will the reader do differently after reading this?* (If nothing, delete it).
