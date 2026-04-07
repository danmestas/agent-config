# Ousterhout Philosopher Skill — Design Spec

## Overview

A skill that turns the coding agent into a disciplined software designer following John Ousterhout's *A Philosophy of Software Design* (2018). The guiding axiom: **"The primary goal of software design is to minimize complexity."**

The skill lives at `skills/ousterhout/SKILL.md` in the agent-skills repo, following the existing repo convention (YAML frontmatter + markdown body, no scripts or references needed).

## Decisions

- **"Design It Twice"** is a lightweight evaluation step — sketch two approaches, score against principles, pick the winner. Not a full build-out of each.
- **No interaction with tigerstyle** — completely independent, no cross-references. Users combine however they want.
- **No system prompt section** — follows repo convention. Principles and execution guidance only.
- **Approach: Principles + Reasoning Flow** — clean reference section of principles, plus a short reasoning checklist for applying them.

## Activation

```yaml
---
name: ousterhout
description: Use when designing modules, classes, APIs, or system architecture.
  Use when reviewing or refactoring code for complexity. Use when choosing between
  implementation approaches. Triggers on requests involving abstraction design,
  interface simplicity, information hiding, or reducing cognitive load.
---
```

## Skill Structure

### 1. Intro
One-line attribution to Ousterhout and *A Philosophy of Software Design*. State the central thesis.

### 2. Core Principles (7)

1. **Deep Modules** — Maximize functionality-to-interface ratio. Small, obvious interface hiding rich behavior (deep) beats a large interface with trivial behavior (shallow).

2. **Strategic Programming** — Invest extra time now to keep the design simple for the future. Tactical "quick-and-dirty" only when explicitly justified and time-boxed.

3. **Information Hiding** — Hide every implementation detail not essential to the module's user. The interface should be obvious; internals opaque.

4. **Minimize Cognitive Load** — Reduce the knowledge a developer must hold in their head to use or modify the code. Eliminate "unknown unknowns."

5. **Pull Complexity Downward** — Push messy details into lower layers so higher layers stay clean and simple.

6. **Define Errors Out of Existence** — Make error cases impossible rather than requiring callers to handle them.

7. **Design It Twice** — Before committing to a design, sketch a second, simpler alternative. Evaluate both against the principles above and pick the one that minimizes long-term complexity.

Each principle gets a short code example showing a before/after or good/bad contrast. Language-agnostic with Python and TypeScript examples.

### 3. Red Flags

| Red Flag | What It Means |
|----------|---------------|
| Shallow classes/methods | Tiny interface + tiny behavior — adds abstraction cost without hiding anything |
| Getters/setters that leak state | Internal representation exposed through the interface — information hiding failure |
| God objects / massive config | One thing knows too much — cognitive load and change amplification |
| Change amplification | One logical change requires edits in many places — abstraction boundaries are wrong |
| Obscure dependencies | Module behavior depends on something non-obvious — unknown unknowns |
| Over-generalization | "We might need this someday" — complexity added for hypothetical requirements |
| Pass-through methods | Method that does nothing but delegate to another — shallow by definition |
| Conjoined methods | Two methods that can't be understood independently — hidden coupling |

### 4. Reasoning Flow

Lightweight checklist the agent follows when the skill is active:

1. **State the goal** — Summarize the requirement in one sentence.
2. **Spot complexity** — Scan for red flags from the table above.
3. **Design it twice** — Sketch two approaches. Score each on: interface simplicity, implementation depth, future maintenance cost, cognitive load for the next developer.
4. **Pick and justify** — Choose the design that best minimizes long-term complexity. Reference specific principles by name.
5. **Implement or recommend** — Provide concrete code changes, module structure, or refactoring steps.
6. **Comment only the non-obvious** — Add comments for design decisions and subtle constraints. Never comment what the code already says.

### 5. Common Mistakes

| Mistake | Ousterhout Fix |
|---------|----------------|
| "Let's add a class for that" | Does it hide meaningful complexity? If not, it's a shallow module — merge it. |
| "We should make this configurable" | Configuration pushes complexity upward to the caller. Push it down instead. |
| "Let's handle every edge case at the call site" | Define the error out of existence in the lower layer. |
| "This API needs another parameter" | A growing interface signals a leaking abstraction. Redesign. |
| "I'll clean it up later" | That's tactical programming. Invest the time now or accept the debt explicitly. |
| "One more wrapper layer will fix this" | Pass-through layers add complexity without hiding it. Remove the layer. |
| "The caller should know about this" | If they don't need it to use the module, hide it. |
