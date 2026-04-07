---
name: norman
description: Use when designing, reviewing, or auditing user interfaces and frontend interactions. Use when evaluating UI usability, accessibility, or interaction patterns. Triggers on requests involving button placement, form design, navigation, error messages, onboarding flows, modal dialogs, or when asked to review a UI for usability.
---

# Norman's Principles of Interaction Design

Principles from Don Norman's [The Design of Everyday Things](https://en.wikipedia.org/wiki/The_Design_of_Everyday_Things) (1988, revised 2013). The central thesis: **"Good design is actually a lot harder to notice than poor design, in part because good designs fit our needs so well that the design is invisible."**

Every interface decision must be judged by whether it helps or hinders the user's ability to form a correct mental model and accomplish their goal.

## Core Principles

### 1. Affordances

An affordance is a relationship between an object and a person — what actions are possible. A button affords pressing. A text field affords typing. A slider affords dragging.

**Bad:** A flat, unstyled `<div>` that is clickable but looks like static text.
**Good:** A visually distinct button with hover/active states that communicates "I can be pressed."

The interface must make possible actions perceivable. If an element is interactive, it must look interactive.

### 2. Signifiers

Signifiers indicate where the action should take place. Affordances determine what's possible; signifiers communicate where and how.

**Bad:** A swipeable card with no visual hint that swiping is possible.
**Good:** A swipeable card with a subtle arrow or peek of the next card visible at the edge.

Every interactive element needs a signifier. Don't rely on users discovering interactions by accident.

### 3. Mapping

The relationship between controls and their effects. Good mapping means the spatial or logical layout of controls matches the layout of the things they affect.

**Bad:** A row of identical toggles labeled "Option 1, Option 2, Option 3" that control unrelated settings scattered across the page.
**Good:** Settings grouped by function with controls positioned next to the things they affect. A volume slider positioned next to the speaker icon.

Natural mapping reduces the need for labels and instructions.

### 4. Feedback

Every action must produce an immediate, obvious response. The user must know: (a) that the system received the input, and (b) what the system is doing about it.

**Bad:** Clicking "Submit" produces no visible change for 3 seconds while the server processes.
**Good:** Clicking "Submit" immediately disables the button, shows a spinner, and displays a success/error message when complete.

Feedback must be immediate (within 100ms for acknowledgment), informative (what happened), and proportional (don't interrupt flow for trivial confirmations).

### 5. Conceptual Models

The user's understanding of how the system works. Good design builds an accurate mental model. The user doesn't need to understand the implementation, but their model of cause and effect must be correct.

**Bad:** A "Save" button that sometimes saves locally and sometimes syncs to cloud with no indication of which.
**Good:** Explicit status indicators: "Saved locally" vs "Synced to cloud" with a visible sync icon.

When the conceptual model is wrong, every interaction becomes a guessing game. Make the system state visible.

### 6. Constraints

Limit the possible actions to prevent errors. Physical constraints (a USB plug only fits one way), logical constraints (greying out invalid options), and cultural constraints (red means stop/danger).

**Bad:** A date picker that accepts February 30th and rejects it on submission.
**Good:** A date picker that only shows valid dates for the selected month.

The best error handling is making the error impossible.

### 7. Error Prevention and Recovery

People will make mistakes. Design for it. Two types of errors:

- **Slips** — right intention, wrong action (clicking the wrong button because it's too close to the right one). Prevent with spacing, confirmation, undo.
- **Mistakes** — wrong intention (user doesn't understand what the action does). Prevent with clear labels, previews, conceptual models.

**Bad:** A "Delete Account" button with no confirmation next to "Update Profile."
**Good:** Destructive actions are visually distinct (red), physically separated from safe actions, require typed confirmation for irreversible operations, and offer undo within a grace period for reversible ones.

## Red Flags

Usability symptoms to call out during review.

| Red Flag | What It Means |
|----------|---------------|
| Mystery meat navigation | Links/buttons with no clear signifier of destination or action |
| Silent failure | Action produces no visible feedback — user doesn't know if it worked |
| Mode confusion | User is in a different mode than they think (editing vs viewing, draft vs published) |
| Invisible state | System state not reflected in UI (unsaved changes, sync status, connection status) |
| Cliff errors | Irreversible action with no confirmation or undo |
| Overchoice | Too many options presented at once — decision paralysis |
| Learned helplessness | Error messages that don't explain what to do ("Something went wrong") |
| Gulf of execution | User knows what they want but can't figure out how to do it |
| Gulf of evaluation | User performed an action but can't tell if it worked |

## Reasoning Flow

When this skill is active, follow these steps:

1. **Identify the user's goal** — What are they trying to accomplish? Not what button they're pressing, but why.
2. **Trace the action cycle** — Goal → Plan → Specify → Perform → Perceive → Interpret → Compare. Where does the cycle break down?
3. **Check each principle** — Affordances visible? Signifiers present? Mapping natural? Feedback immediate? Model accurate? Constraints preventing errors? Recovery possible?
4. **Spot red flags** — Scan for symptoms from the table above.
5. **Recommend with rationale** — Reference specific Norman principles by name. Provide concrete changes, not abstract advice.

## Applying to Code Review

When reviewing frontend code:

- **Components without feedback states** — Does the button have loading, disabled, success, error states? If not, the user gets no feedback.
- **Forms without inline validation** — Waiting until submission to show errors violates error prevention. Validate as the user types.
- **Modals without escape** — Every modal needs a clear close mechanism (X button, click outside, Escape key). Constraints must not trap.
- **State changes without animation** — Abrupt state changes break the conceptual model. Transitions help users understand what happened.
- **Destructive actions styled like safe ones** — Delete buttons that look like Save buttons violate signifier conventions.
- **Error messages without next steps** — "Error 500" teaches nothing. "Couldn't save — check your connection and try again" follows Norman's error recovery principle.

## Common Mistakes

| Mistake | Norman Fix |
|---------|------------|
| "Users will figure it out" | They won't. If it needs figuring out, the design failed. Add signifiers. |
| "We'll add a tooltip" | Tooltips hide information that should be visible. Signifiers > tooltips. |
| "The error message says what happened" | Error messages must say what to DO, not just what happened. |
| "We need a tutorial" | Needing a tutorial means the interface is not self-explanatory. Fix the interface. |
| "Let's add more options" | More options = more cognitive load. Constrain to the common case, hide the rest. |
| "That's an edge case" | If real users hit it, it's not an edge case. Design for error recovery. |
| "The animation is just polish" | Animation communicates state changes. It's feedback, not decoration. |
