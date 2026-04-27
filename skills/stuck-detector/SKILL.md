---
name: stuck-detector
version: 0.1.0
description: >
  Use when the user says "stuck", "I'm stuck", "this isn't working", "tool keeps failing",
  "give up on this", "we're going in circles", "/stuck", or when the agent itself
  notices it has hit N consecutive tool errors in a session window. Generates a handoff
  summary so progress can resume in a fresh session, escalate to a stronger model,
  or pause for user input. Stops the doom-loop of blind retries.
type: skill
targets:
  - claude-code
category:
  primary: evolution
---

# stuck-detector

The off-ramp. When the agent (or the user) realizes the current path isn't working, this skill stops the retry loop and produces a structured handoff so progress can resume elsewhere.

## When to invoke

- User explicit: "stuck", "we're going in circles", "this isn't working", "give up on this", "/stuck".
- Self-firing: the agent notices its own pattern. Heuristics that suggest stuckness:
  - Same tool errored 3+ times with the same error class within the last ~20 turns.
  - The same file has been edited and re-edited without the user expressing satisfaction.
  - The user has corrected the agent's interpretation of the task 2+ times.
  - The agent is about to retry an action it already tried and failed.

The skill is invoked when the agent *judges* it's stuck. Don't build complex auto-detection — the prompt itself is the detector.

## Workflow

### 1. Acknowledge directly

Stop work. Tell the user, in one sentence: "I'm stuck on <X>. Generating a handoff summary." Do NOT keep retrying while this skill runs.

### 2. Generate the handoff

Write to:

```
~/.claude/evolution-reports/<project>/stuck/<YYYY-MM-DD>-<topic-slug>.md
```

The handoff has four sections:

#### a. Original ask

What did the user ask for? Quote them as exactly as you can. If multiple asks layered, list them in order.

#### b. What was tried and failed

Bullet list. For each attempt:
- One-line summary of the approach.
- Specific failure: tool error message, test output, user correction.
- Why the agent thought it would work.

#### c. What information would unblock progress

This is the **load-bearing section**. Be specific:

- "The contents of `<file>` — I've been guessing at its shape."
- "Whether the user wants behavior A or behavior B — they said both at different points."
- "Which version of `<library>` is installed — error suggests version mismatch."
- "Access to `<command>` — kept hitting permission prompts."

If the answer is "I genuinely don't know what would unblock me", say that. It's a valid handoff.

#### d. Recommended next action

Pick ONE:

- **Escalate to Opus** — if the issue feels like it needs deeper reasoning, not more context.
- **Fresh session paste** — if the issue is context pollution / long-conversation drift. Provide a clean version of the task that can be pasted into a new session.
- **Ask user for input** — if the unblocking info is something only the user has.
- **Pause** — if the right move is for the user to come back later with a different framing.

### 3. Print the path and ask

After writing, print the file path. Then ask the user one question — exactly:

> Continue with reduced scope, escalate, or pause?

Wait for their answer. Do NOT pick for them.

## Anti-patterns

- **Do NOT keep retrying while writing the handoff.** The whole point is to stop the loop.
- **Do NOT build heavy stuck-detection logic.** The skill is invoked when the agent thinks it's stuck. Don't try to build a deterministic stuck-detector — that's a different problem.
- **Do NOT auto-escalate.** The user picks the next move. Even if Opus seems right, ask first.
- **Do NOT make the handoff long.** Cap each section at 5 bullets. A long handoff that nobody reads is worse than a short one that gets actioned.

## See also

- `skills/reflect/SKILL.md` — for *post-task* critique. This skill is for *mid-task* unsticking.
- `skills/evolution-engine/SKILL.md` — running this skill regularly seeds evolution-engine with "tool kept failing" signal.
- The Voyager paper (curriculum self-correction): the "skill library refresh" idea, reduced to one simple action — write down what's broken, ask the human.
