# User Documentation Guidelines

The docs are a functional manual for the people who use the product, not a record of how it was built. Write strictly for the single reader role named at the top of each page. Content for another role belongs on that role's page. *(If a target user frequently fulfills multiple roles, use clear in-page role banners or collapsible sections instead of duplicating pages).*

---

## Prerequisites & Availability

At the top of every feature or section page, explicitly state any operational barriers using a standardized header block:
- **Plan / Tier Requirements:** (e.g., `Requires Enterprise Plan`)
- **Version / Feature Flags:** (e.g., `Available in v2.4+`)
- **Required Permissions:** (e.g., `Role: Admin or Workspace Owner`)
- **Deprecation Warning (if applicable):** (e.g., `⚠️ Deprecated in v3.0, scheduled for removal in v4.0. Use [New Feature] instead.`)

---

## Focus on what the reader cannot see

The reader has the product in front of them. Do not describe what is self-evident in the interface: no visual descriptions, no button-by-button walkthroughs, and no explanations of obvious UI state. If an action requires a paragraph of UI description to be found, treat it as a product design flaw.

> **Rule of Thumb (The Actionability Test):** A sentence earns its place only if it answers: *Will the reader do or decide anything differently knowing this?* If not, delete it.

### Permitted Content

A sentence is justified **only** if it covers one of the following:

1. **Invisible Rules & Limits:** Durations, rate limits, lockouts, quotas, validation criteria, data retention, or elements displayed only once.
2. **Navigation Anchors:** Direct, minimal path hints (e.g., `Settings > Team > Roles`) to orient the user without full walkthroughs when UI elements are nested or deep.
3. **Actionable Errors:** Exact error texts, why they occur, and explicit steps to resolve them. *(Embed troubleshooting steps directly under the relevant feature; avoid generic FAQ pages).*
4. **Irreversible Warnings:** Critical risks, data loss, or system-wide side effects before an action is taken.
5. **Decisions & Outcomes:** Necessary context required to choose between options and what happens after a selection is made.
6. **Working Examples & Edge Cases:** Realistic, copy-pasteable snippets, payloads, or parameters. Always prefer concrete domain examples (e.g., `user_id: "usr_99x"`) over abstract placeholders like `foo/bar` or `test123`.

---

## Never in user docs

- **Implementation Details:** Algorithms, encryption internals, database architecture, storage types, framework names, or tech stack comparisons.
- **Product History & Design Rationale:** Why a feature was built this way, legacy behavior, discarded alternatives, or roadmap promises.
- **Vague Reassurances:** Avoid empty phrases like *"Don't worry, this is safe"*. State the exact technical guarantee or boundary instead.
- **Inaccessible Paths & Variables:** Settings, environment variables, or config files the current reader role cannot access or modify.
- **Generic FAQ Pages:** Avoid standalone, unsearchable FAQ pages. Integrate questions and answers directly into the context of the relevant feature.

*Note: If a detail matters to maintainers or developers, move it to code comments or internal architecture docs.*

---

## Structure & Form

- **Lead with the Point:** Start directly with the rule, error, or warning.
- **Style:** Use short, imperative sentences and active voice. Limit each paragraph to a single core idea.
- **Exact UI String Matching:** Always spell UI elements, buttons, and labels **exactly** as they appear in the product (including casing). Never adapt labels for grammatical harmony.
- **No Filler:** Omit introductory fluff, welcome notes, and summaries. If removing unneeded text leaves a section empty, delete the section header.

---

## Code & Visual Assets

- **Self-Contained Code:** Code blocks must be copy-paste ready and syntactically valid. Clearly highlight variables that the user *must* replace (e.g., `<YOUR_API_KEY>`).
- **Screenshots & Motion as Exception:**
  - *Forbidden:* Screenshots of standard forms, single buttons, or static UI text.
  - *Allowed:* Annotations/Hotspots for complex multi-pane layouts (e.g., node editors) or short (< 5s) UI micro-animations for non-standard UI flows.
  - *Maintenance Requirement:* Prefer automated UI snapshots (e.g., via CI/CD test runs) to prevent visual drift during redesigns.
- **Zero Text in Images:** Never bake instructions, paths, or labels into image files. Images must only illustrate, never instruct.
- **Accessibility:** All visual assets must include descriptive alt text explaining the structural layout or action.

---

## Document Types & Intent

To keep reference documentation lean without blocking new users, separate content by intent:

| Doc Type | Purpose | Allowed Content & Rules |
| :--- | :--- | :--- |
| **Reference Docs** | Day-to-day operation & lookup | Strict adherence to the rules above. Zero narrative. Must include a standard top banner linking to the conceptual guide: *"New to [Feature]? Read the Concepts guide first."* |
| **Getting Started / Concepts** | Mental models & onboarding | High-level workflows, key concepts, and architecture overviews. Direct links back to specific Reference pages for parameters. |

---

## Maintainability & Product Feedback

- **Single Source of Truth (Smart DRY & Localization):** Never repeat non-trivial rules, paths, or limits. Use documentation transclusion / re-usable content snippets, but **only for full paragraphs or independent blocks** (never partial sentences) to preserve context for translation workflows.
- **UI Flaw Protocol & Workaround Auto-Expiry:** If documenting a feature requires explaining a confusing UI workaround:
  1. Write the minimal workaround step to unblock the user immediately.
  2. **Open a high-priority UX/Product issue** referencing the doc section.
  3. **Workaround Governance:** Label the doc block with a review tag. Workarounds are automatically flagged for review every **90 days**. If the UX issue is resolved, remove the workaround in the same PR as the product release.

---

## Discoverability & Scanning

- **Search Intent Headings:** Headings must include the exact terms users search for when encountering a problem (e.g., use *"Rate Limit Exceeded (429)"* instead of *"API Throttling Considerations"*).
- **Scanning Support:** Use bolding **strictly for UI element names** or **critical parameters**. If everything is bolded, nothing stands out.

---

## Reviewing Docs (The Checklist)

When reviewing any sentence or PR, ask:
1. *Who is the target reader for this page?* (If it's another role, move it or wrap it in a role-specific container).
2. *What will the reader do or decide differently after reading this?* (If nothing, delete it).
3. *Is this feature accessible to this reader right now?* (If conditional, add prerequisite headers).
4. *Does this page include a temporary workaround?* (If yes, ensure a UX ticket is attached and tagged with a 90-day review date).
