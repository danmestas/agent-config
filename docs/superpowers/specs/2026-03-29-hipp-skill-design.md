# Hipp Philosopher Skill — Design Spec

## Overview

A skill that turns the coding agent into a disciplined software designer following Dr. D. Richard Hipp's philosophy as embodied in SQLite. The guiding axiom: **"Small. Fast. Reliable. Choose any three."**

The skill lives at `skills/hipp/SKILL.md` in the agent-skills repo, following the existing repo convention (YAML frontmatter + markdown body, no scripts or references needed).

## Decisions

- **"Design It Twice"** is a lightweight evaluation step — sketch two approaches (obvious/complex vs Hipp-simple/reliable), score against principles, pick the winner. Not a full build-out of each.
- **No interaction with other philosophy skills** — completely independent, no cross-references.
- **No system prompt section** — follows repo convention. Principles and execution guidance only.
- **Approach: Principles + Reasoning Flow** — clean reference section of principles, plus a short reasoning checklist for applying them.
- **8 principles** (all stand alone, including "Flexible Where It Helps, Strict Where It Matters").

## Activation

```yaml
---
name: hipp
description: Use when designing libraries, modules, or data layers that must be simple, reliable, and self-contained. Use when choosing between embedded vs server-based solutions. Use when reviewing code for unnecessary complexity, dependencies, or configuration. Triggers on requests involving zero-config design, embedded systems, long-term maintainability, or first-principles thinking.
---
```

## Skill Structure

### 1. Intro
Attribution to Dr. D. Richard Hipp and SQLite. Central thesis: "Small. Fast. Reliable. Choose any three." Code should solve more problems than it creates and remain viable for decades.

### 2. Core Principles (8)

1. **Simplicity is Supreme** — Design so the solution "just works" with zero configuration, zero maintenance, and minimal cognitive load. Complexity is the enemy.

2. **Reliability Through Ruthless Testing** — Prioritize correctness above all. Aviation-grade testing (100% coverage, regression suites that prove invariants). Bugs should "dry up" after release.

3. **Economy & Independence** — Keep it small, compact, portable, and self-contained. Avoid servers, heavy dependencies, or runtimes. Embeddable is almost always better.

4. **First-Principles Thinking** — Derive the design from the actual problem. Ignore "what experts do" if it adds unnecessary complexity. Solve your problem, not someone else's.

5. **Resist Feature Creep** — Say "no" early and often. Every added feature must justify itself or it gets cut.

6. **Long-Term Viability** — Write code readable and maintainable by people not yet born. Plan for decades of support.

7. **Solve More Problems Than You Create** — The finished design should reduce overall system complexity. No config hell, no hidden state, no fragile abstractions.

8. **Flexible Where It Helps, Strict Where It Matters** — Make the common case simple; make the dangerous case impossible or loudly obvious. Dynamic behavior is a feature when it removes unnecessary rigidity.

Each principle gets a short code example showing a before/after or good/bad contrast. Python and TypeScript examples for: Simplicity (zero-config vs config-heavy), Economy & Independence (embedded vs client-server), Resist Feature Creep (minimal API vs kitchen-sink), and Flexible/Strict (permissive input handling vs rigid).

### 3. Red Flags

| Red Flag | What It Means |
|----------|---------------|
| Configuration files or setup rituals | Should "just work" — zero-config is the goal |
| Server-based when embedded would suffice | Unnecessary complexity, deployment burden, and failure modes |
| "Might need it later" features | Feature creep — cut it until proven necessary |
| Over-engineered abstractions | OO patterns or layers that add complexity without solving the actual problem |
| Untested or lightly-tested paths | Reliability failure — every path must be proven correct |
| External dependencies that break portability | Independence violation — can it run anywhere without help? |
| Designs that won't be readable in 10+ years | Long-term viability failure |
| Hidden state or implicit behavior | Creates more problems than it solves — make behavior obvious |

### 4. Reasoning Flow

1. **Restate the core problem** — What must "just work"? One sentence.
2. **Spot complexity** — Scan for red flags: config, dependencies, servers, bloat, fragility.
3. **Design from first principles** — Derive a minimal solution directly from the problem, not from conventions.
4. **Design it twice** — Sketch the obvious/complex approach and a Hipp-simple/reliable alternative. Score each on: small, fast, reliable, independent, long-term viable.
5. **Pick and justify** — Choose the simplest, most reliable option. Reference specific principles by name.
6. **Implement or recommend** — Provide concrete code, module structure, or architecture with test strategy.
7. **Comment only the why** — Comments for contracts and non-obvious decisions. Good design should be self-evident.

### 5. Common Mistakes

| Mistake | Hipp Fix |
|---------|----------|
| "Let's add a config file for that" | Zero-config is the goal. Derive sensible defaults from the problem. |
| "We need a server for this" | Can it be embedded? If yes, skip the server. |
| "Let's add this feature while we're here" | Does it justify itself? If not, cut it. Say no early and often. |
| "Use the standard framework/ORM/pattern" | Does it solve your actual problem, or someone else's? Think from first principles. |
| "We can test that later" | Test now. 100% coverage enables fearless refactoring. Untested code is broken code you haven't caught yet. |
| "Add this dependency, it saves time" | Every dependency is a portability risk and a reliability risk. Can you write the 50 lines yourself? |
| "Make it flexible for future use cases" | Flexibility you don't need today is complexity you pay for forever. |
