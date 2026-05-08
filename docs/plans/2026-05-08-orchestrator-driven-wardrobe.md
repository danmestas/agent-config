# Orchestrator-Driven Wardrobe Implementation Plan

> **For agentic workers:** Use `bones-powers:subagent-driven-development` (recommended for parallel work) or `bones-powers:executing-plans` to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Many tasks are content-only (YAML/markdown authoring) and bypass the TDD red-green pattern; the validation gate for those is `npm run validate` + `npm run build -- --target all --dry-run`. Suit code tasks follow standard TDD.

**Goal:** Reshape wardrobe so an orchestrator session can spawn role-specific subharness sessions (implementer, reviewer, planner, spy) using nothing but vanilla `suit claude --outfit <role> --cut <stack> --accessory <project>` — without changes to suit's CLI surface.

**Architecture:** Three-axis composition. **Outfit = role** (who you are), **cut = tech stack** (what you're working on), **accessory = project context + behavior packs** (where you are + what extra). Outfits compose via venn-diagram set algebra (`+` union, `-` difference, by name or by `category` tag) on skills/accessories/hooks; system-prompt prose only unions in declared order, brief wins on conflict. Composition resolves lazily in suit at `suit claude` / `suit up` time — no DB, no cache. Agent-harness gains a `--cmd` flag on `harness-spawn` so the orchestrator can pass a stateless suit launch as the spawn command (multi-role-per-project requires stateless to avoid `.claude/` race). The old domain-shaped outfits and postural cuts stay alive in v1 for solo dressing; deprecation comes after the new model proves out.

**Tech stack:** wardrobe (YAML frontmatter + markdown bodies, `suit-build` pipeline) · suit (TypeScript, ts-node CLI, adapter-per-harness) · agent-harness (bash binaries, tmux, file-based registry at `~/.cache/harness-registry/`)

---

## Scope check

This plan covers two coordinated subsystems but they ship together to deliver a single capability (orchestrator can spawn role-shaped subharnesses). Splitting them would leave each side useless until the other lands. Keep as one plan.

What is **out of scope:**

- Retiring old domain outfits (backend, frontend, kb, etc.) — deferred to a follow-up plan after the new model has 2-3 real orchestrated runs under it
- Brief-template authoring as a wardrobe primitive — deferred per design decision; revisit if multiple orchestrators start re-implementing the same brief shape
- Cross-vendor diversity rules (claude-implementer + codex-reviewer) — current orchestrator skill in darkish-factory has these; lifting them into the suit-driven pattern is a separate plan
- Wardrobe-restructure-v3 work that's already in flight (see `docs/plans/wardrobe-restructure-v3.md`) — this plan is additive to v3, not a replacement

---

## File structure

**New files in wardrobe** (all content authoring):

- `outfits/implementer/outfit.md` — role outfit; loads tdd, golang-patterns/typescript-patterns/etc., systematic-debugging, finishing-a-bones-leaf
- `outfits/reviewer/outfit.md` — role outfit; loads code-reviewer prompt, philosophy accessory's skills, requesting/receiving-code-review
- `outfits/planner/outfit.md` — role outfit; loads writing-plans, brainstorming, dispatching-parallel-agents, no implementer skills
- `outfits/spy/outfit.md` — role outfit; loads spy-on-session (or spy-on-bones-session if accessory matches), investigating-agent-sessions
- `outfits/orchestrator/outfit.md` — role outfit; loads dispatching-parallel-agents, harness-orchestration, the new orchestrator-suit skill below
- `outfits/quick/outfit.md` — composition outfit `compose: implementer + planner + reviewer`, for solo-flow generalist work (the post-Q3 answer)
- `cuts/go-backend/cut.md` — stack cut; declares Go conventions, testing patterns, idiomatic refs
- `cuts/ts-frontend/cut.md` — stack cut; declares TypeScript + React conventions, datastar refs
- `cuts/python-data/cut.md` — stack cut; declares pandas, polars, ETL conventions
- `cuts/infra-cloudflare/cut.md` — stack cut; declares wrangler, workers conventions, cloudflare skills
- `cuts/bones-tooling/cut.md` — stack cut; for working ON bones itself (Go + fossil + nats)
- `accessories/bones/accessory.md` — project context for `~/projects/bones`; conventions, ADR layout, swarm patterns
- `accessories/serverdom/accessory.md` — project context for `~/projects/serverdom`; Go + JSX + the codegen DSL
- `accessories/dagnats/accessory.md` — project context for `~/projects/dagnats`
- `skills/orchestrator-suit/SKILL.md` — new skill that documents the orchestrator-spawn pattern using stateless suit + harness-spawn

**Modified files:**

- `wardrobe/AGENTS.md` — add taxonomy section documenting role/stack/accessory model + worked example of orchestrator spawn
- `wardrobe/CHANGELOG.md` — `[Unreleased] ### Added` entry for the new outfits/cuts/accessories/skill; `### Changed` for AGENTS.md taxonomy
- `suit/src/lib/composer.ts` (or wherever resolution happens — locate in Task 5) — extend resolver with `+` and `-` operators
- `suit/src/lib/outfit-schema.ts` (or equivalent) — extend YAML schema to allow `compose:` field
- `suit/src/tests/composer.test.ts` (or new) — coverage for the algebra
- `agent-harness/bin/harness-spawn` — add `--cmd "<launch>"` flag

**Files deferred to follow-up plan (not this one):**

- Existing outfits in `outfits/{aviation,backend,bones,code,engineer,frontend,kb,meta,personal,stasi}/outfit.md` — keep alive in v1
- Existing postural cuts in `cuts/{debugging,planning,reviewing,executing,focused,...}/cut.md` — keep alive in v1; some collapse into role outfits in v2

---

## Slot legend

- `[slot: wardrobe-yaml]` — content authoring (outfits, cuts, accessories, skills, AGENTS.md, CHANGELOG)
- `[slot: suit-typescript]` — TypeScript work in `~/projects/suit`
- `[slot: agent-harness-bash]` — Bash work in `~/projects/agent-harness/bin`
- `[slot: validation]` — end-to-end runs and proofs

---

## Phase 1 — Wardrobe taxonomy additions (non-breaking)

### Task 1: Author the 6 role outfits  `[slot: wardrobe-yaml]`

**Files:**

- Create: `outfits/implementer/outfit.md`
- Create: `outfits/reviewer/outfit.md`
- Create: `outfits/planner/outfit.md`
- Create: `outfits/spy/outfit.md`
- Create: `outfits/orchestrator/outfit.md`
- Create: `outfits/quick/outfit.md`

**Reference:** existing `outfits/backend/outfit.md` for frontmatter conventions.

- [ ] **Step 1.1: Author `outfits/implementer/outfit.md`**

```markdown
---
name: implementer
version: 0.1.0
description: >-
  Implementer role outfit. Loads test-driven-development, systematic-debugging,
  finishing-a-bones-leaf, and the writing-plans/executing-plans pair. Use when
  you are spawning or being a coding worker — tasks with concrete deliverables,
  not planning or review.
type: outfit
targets:
  - claude-code
category:
  primary: workflow
  secondary:
    - role
skills_include:
  - test-driven-development
  - systematic-debugging
  - executing-plans
  - finishing-a-bones-leaf
  - subagent-driven-development
  - verification-before-completion
---

# Implementer

You are an implementer. Your output is working, tested code that makes the next
acceptance criterion green. Plan only what you must to write the test; review
only what you must to ship the diff. Defer architectural redesign to the
planner role; defer cross-cutting code-quality calls to the reviewer role.

Make the failing test fail for the right reason. Write the minimum to make it
pass. Refactor with the test still green. Commit at every green. Don't surface
work the orchestrator didn't ask for.
```

- [ ] **Step 1.2: Author `outfits/reviewer/outfit.md`**

```markdown
---
name: reviewer
version: 0.1.0
description: >-
  Reviewer role outfit. Loads requesting-code-review, receiving-code-review,
  the philosophy accessory's design lenses, and the architect-review subagent.
  Use when you are spawning or being a review worker — block-or-ship verdicts
  on diffs, not implementation.
type: outfit
targets:
  - claude-code
category:
  primary: workflow
  secondary:
    - role
skills_include:
  - requesting-code-review
  - receiving-code-review
  - hipp
  - ousterhout
  - norman
accessories_force:
  - philosophy
---

# Reviewer

You are a reviewer. Your output is a block-or-ship verdict with citations.
Review in passes — correctness first, then design, then tests, then docs — so
each pass has a single lens and findings don't blur. Separate must-fix from
suggestion explicitly. Apply Ousterhout-style structural critique to design,
not just style. Verify before declaring complete.

You do not implement fixes. You name what's wrong, where, and why. The
implementer fixes.
```

- [ ] **Step 1.3: Author `outfits/planner/outfit.md`**

```markdown
---
name: planner
version: 0.1.0
description: >-
  Planner role outfit. Loads writing-plans, brainstorming, dispatching-parallel-agents.
  Use when you are spawning or being a planning worker — produces a written plan
  with bite-sized tasks, not implementation.
type: outfit
targets:
  - claude-code
category:
  primary: workflow
  secondary:
    - role
skills_include:
  - writing-plans
  - brainstorming
  - dispatching-parallel-agents
  - subagent-driven-development
skills_exclude:
  - executing-plans
---

# Planner

You are a planner. Your output is a written plan, not code. Defer
implementation; defer review of code that doesn't yet exist. Brainstorm the
problem space cheaply before settling on an approach. Ask one question at a
time. Reflect on the draft before declaring it done. Pressure-test before
shipping.
```

- [ ] **Step 1.4: Author `outfits/spy/outfit.md`**

```markdown
---
name: spy
version: 0.1.0
description: >-
  Spy role outfit. Loads spy-on-session (and spy-on-bones-session when the bones
  accessory is present), investigating-agent-sessions. Use when you are spawning
  or being an audit worker — fingerprint, monitor, classify findings, no
  mutating commands.
type: outfit
targets:
  - claude-code
category:
  primary: evolution
  secondary:
    - role
skills_include:
  - spy-on-session
  - investigating-agent-sessions
---

# Spy

You are a spy. Read-only. You audit what a tool does to a Claude Code session.
You do not run mutating verbs. You write classified findings — bug /
inconvenience / improvement — with severity, source pointer, observed,
expected, repro hint. The bones-specific path activates when the bones
accessory is loaded.
```

- [ ] **Step 1.5: Author `outfits/orchestrator/outfit.md`**

```markdown
---
name: orchestrator
version: 0.1.0
description: >-
  Orchestrator role outfit. Loads harness-orchestration, dispatching-parallel-agents,
  and the new orchestrator-suit skill. Use when you are the parent session
  driving role-shaped subharness children — you dispatch, you do not implement.
type: outfit
targets:
  - claude-code
category:
  primary: workflow
  secondary:
    - role
skills_include:
  - orchestrator-suit
  - harness-orchestration
  - tmux-agent-panes
  - dispatching-parallel-agents
skills_exclude:
  - test-driven-development
  - executing-plans
---

# Orchestrator

You drive subharness children — implementer, reviewer, planner, spy — via
stateless suit launches. You do not write code, run tests, or implement
features. If you reach for Edit / Write / Bash to do worker-shaped work, stop
and dispatch a subharness instead. Receive intent → classify → dispatch →
batch escalations → merge worktrees → audit log.
```

- [ ] **Step 1.6: Author `outfits/quick/outfit.md`**

```markdown
---
name: quick
version: 0.1.0
description: >-
  Quick generalist outfit composed from implementer + planner + reviewer for
  solo flow. Use when you are working alone on a small task and don't want to
  pick a single role. Not appropriate for orchestrated work — use the
  individual role outfits there.
type: outfit
targets:
  - claude-code
category:
  primary: workflow
  secondary:
    - role
compose:
  - implementer
  - planner
  - reviewer
---

# Quick

Solo generalist mode. You play implementer, planner, and reviewer as the work
shape demands. For orchestrated multi-pane work, use the role-specific outfits
instead — quick is for the case where you're alone and the role keeps shifting.
```

- [ ] **Step 1.7: Lint pass — these outfits won't validate yet** because the `compose:` field doesn't exist in the suit schema (added in Task 5). Run `npm run validate` and confirm the error references `outfits/quick`. Skip the validation gate for `quick` until Task 5 lands; the other 5 outfits should validate cleanly.

```bash
cd /Users/dmestas/projects/wardrobe && npm run validate 2>&1 | tail -20
```
Expected: 5 of 6 new outfits pass; `quick` errors with "unknown key: compose" or similar. That's expected pre-Task-5.

- [ ] **Step 1.8: Commit** (omit `quick` if blocking; commit the 5 that validate)

```bash
cd /Users/dmestas/projects/wardrobe && git add outfits/{implementer,reviewer,planner,spy,orchestrator}/outfit.md && git commit -m "feat(outfits): add role-shaped outfits (implementer, reviewer, planner, spy, orchestrator)"
```

---

### Task 2: Author the 5 stack cuts  `[slot: wardrobe-yaml]`

**Files:**

- Create: `cuts/go-backend/cut.md`
- Create: `cuts/ts-frontend/cut.md`
- Create: `cuts/python-data/cut.md`
- Create: `cuts/infra-cloudflare/cut.md`
- Create: `cuts/bones-tooling/cut.md`

**Reference:** existing `cuts/reviewing/cut.md` for frontmatter conventions; postural cuts (planning, reviewing, executing) stay alive — these are stack cuts, a new flavor.

- [ ] **Step 2.1: Author `cuts/go-backend/cut.md`**

```markdown
---
name: go-backend
version: 0.1.0
description: >-
  Go backend stack cut. Use when working on Go services, CLIs, or libraries.
  Loads golang-patterns, idiomatic Go skills, golangci awareness.
type: cut
targets:
  - claude-code
category:
  primary: workflow
  secondary:
    - stack
skills_include:
  - golang-patterns
---

# Go Backend

You are working on Go code. Idiomatic Go: small interfaces, composition over
inheritance, errors as values, table-driven tests, contexts threaded through.
Match the codebase's existing patterns for error handling, logging, and
config. If golangci.yml is present, your work must pass `golangci-lint run`
before commit.
```

- [ ] **Step 2.2: Author `cuts/ts-frontend/cut.md`**

```markdown
---
name: ts-frontend
version: 0.1.0
description: >-
  TypeScript frontend stack cut. Use when working on React, Vue, Svelte, or
  vanilla TypeScript UI code. Loads tailwindcss-fundamentals, frontend-design,
  and React patterns.
type: cut
targets:
  - claude-code
category:
  primary: workflow
  secondary:
    - stack
skills_include:
  - frontend-design
  - tailwindcss-fundamentals-v4
---

# TypeScript Frontend

You are working on TypeScript UI code. Composable components, prop-drilling
only when context is overkill, accessibility from token zero (semantic HTML,
focus management, keyboard support). If the project uses Tailwind, follow v4
conventions. If it uses shadcn/ui, prefer the component primitives over
hand-rolling.
```

- [ ] **Step 2.3: Author `cuts/python-data/cut.md`**

```markdown
---
name: python-data
version: 0.1.0
description: >-
  Python data stack cut. Use when working on data pipelines, ETL, ML, or
  notebook-style analysis. Pandas/polars, type hints, no surprise mutation.
type: cut
targets:
  - claude-code
category:
  primary: workflow
  secondary:
    - stack
skills_include: []
---

# Python Data

You are working on Python data code. Pure functions where possible; explicit
mutation when not. Type hints everywhere — `from __future__ import annotations`
and `dict[str, int]` style, not `Dict[str, int]`. Polars over pandas when
performance matters. Notebooks for exploration, modules for reuse.
```

- [ ] **Step 2.4: Author `cuts/infra-cloudflare/cut.md`**

```markdown
---
name: infra-cloudflare
version: 0.1.0
description: >-
  Cloudflare infrastructure stack cut. Workers, Pages, R2, D1, KV, Queues,
  Durable Objects, Workflows. Loads cloudflare and wrangler skills.
type: cut
targets:
  - claude-code
category:
  primary: workflow
  secondary:
    - stack
skills_include:
  - cloudflare
  - wrangler
  - workers-best-practices
---

# Cloudflare Infrastructure

You are working on Cloudflare infrastructure. Wrangler is the only deploy
mechanism; manual dashboard edits are not allowed in checked-in projects.
Workers are stateless by default; reach for Durable Objects only when
coordination is the actual requirement. R2 for blobs, D1 for SQL, KV for
small key-value, Queues for async. Bindings declared in wrangler.jsonc.
```

- [ ] **Step 2.5: Author `cuts/bones-tooling/cut.md`**

```markdown
---
name: bones-tooling
version: 0.1.0
description: >-
  Bones tooling stack cut. For working ON the bones binary itself — Go +
  fossil + nats coord layer. Different from working IN a bones-instrumented
  project (use accessory: bones for that).
type: cut
targets:
  - claude-code
category:
  primary: workflow
  secondary:
    - stack
skills_include:
  - golang-patterns
---

# Bones Tooling

You are working on the bones source code. ADRs in `docs/adr/`. Strict
fmt-check, vet, lint, race, todo-check via `make check`. Run CI commands
locally before push (especially `go test -tags=otel -short ./...` per the
project CI policy memory).
```

- [ ] **Step 2.6: Validate** — `npm run validate` should now pass for all new cuts.

```bash
cd /Users/dmestas/projects/wardrobe && npm run validate 2>&1 | tail -10
```
Expected: cuts pass; `outfits/quick` still errors per Task 1 Step 7.

- [ ] **Step 2.7: Commit**

```bash
cd /Users/dmestas/projects/wardrobe && git add cuts/{go-backend,ts-frontend,python-data,infra-cloudflare,bones-tooling}/cut.md && git commit -m "feat(cuts): add stack-shaped cuts (go-backend, ts-frontend, python-data, infra-cloudflare, bones-tooling)"
```

---

### Task 3: Author 3 project context accessories  `[slot: wardrobe-yaml]`

**Files:**

- Create: `accessories/bones/accessory.md`
- Create: `accessories/serverdom/accessory.md`
- Create: `accessories/dagnats/accessory.md`

**Reference:** existing `accessories/philosophy/accessory.md` for frontmatter conventions.

- [ ] **Step 3.1: Author `accessories/bones/accessory.md`**

```markdown
---
name: bones
version: 0.1.0
description: >-
  Project context accessory for the bones repo. Loads bones-specific skills
  (using-bones-powers, using-bones-swarm, spy-on-bones-session). Apply this
  when working in or against a project that uses bones for task coordination.
type: accessory
targets:
  - claude-code
category:
  primary: integrations
  secondary:
    - project
skills_include:
  - using-bones-powers
  - using-bones-swarm
  - spy-on-bones-session
  - finishing-a-bones-leaf
---

# Bones project context

You are operating in or against a bones-instrumented project. The bones binary
is on PATH; `.bones/` carries hub state; `.claude/skills/` may include the
bones-installed skill manifest. Task coordination flows through `bones tasks`
verbs and the NATS hub. ADRs live in `docs/adr/`. Read CLAUDE.md for project
specifics.
```

- [ ] **Step 3.2: Author `accessories/serverdom/accessory.md`**

```markdown
---
name: serverdom
version: 0.1.0
description: >-
  Project context accessory for the serverdom repo. Go + JSX codegen DSL.
  Apply when working in /Users/dmestas/projects/serverdom.
type: accessory
targets:
  - claude-code
category:
  primary: integrations
  secondary:
    - project
skills_include: []
---

# Serverdom project context

You are operating in the serverdom repo. Go service with a JSX-style codegen
DSL for ServerDOM components. PR #54 (feat/sdom-v1) is the active branch.
Standard Go patterns; Makefile drives builds. Use Doppler for secrets per
the doppler.yaml manifest.
```

- [ ] **Step 3.3: Author `accessories/dagnats/accessory.md`**

```markdown
---
name: dagnats
version: 0.1.0
description: >-
  Project context accessory for the dagnats repo. NATS-based DAG coordination.
  Apply when working in /Users/dmestas/projects/dagnats.
type: accessory
targets:
  - claude-code
category:
  primary: integrations
  secondary:
    - project
skills_include: []
---

# Dagnats project context

You are operating in the dagnats repo. NATS-coordinated DAG runner.
Litestream for backup; Cloudflare Tunnel for ingress. Read CLAUDE.md
in the project root for current operational state.
```

- [ ] **Step 3.4: Validate**

```bash
cd /Users/dmestas/projects/wardrobe && npm run validate 2>&1 | tail -10
```
Expected: accessories pass.

- [ ] **Step 3.5: Commit**

```bash
cd /Users/dmestas/projects/wardrobe && git add accessories/{bones,serverdom,dagnats}/accessory.md && git commit -m "feat(accessories): add project context accessories (bones, serverdom, dagnats)"
```

---

### Task 4: Phase 1 validation gate  `[slot: validation]`

**Files:** none modified

- [ ] **Step 4.1: Full validate**

```bash
cd /Users/dmestas/projects/wardrobe && npm run validate 2>&1 | tail -10
```
Expected: 110 → ~123 components (5 outfits + 5 cuts + 3 accessories = 13 added). 12 pre-existing warnings. `outfits/quick` still errors per pre-Task-5 state.

- [ ] **Step 4.2: Build dry-run**

```bash
cd /Users/dmestas/projects/wardrobe && npm run build -- --target all --dry-run 2>&1 | tail -10
```
Expected: builds pass for all components except `quick`.

- [ ] **Step 4.3: Smoke launch — load an implementer for go-backend in bones project**

```bash
cd /Users/dmestas/projects/bones && SUIT_CONTENT_PATH=/Users/dmestas/projects/wardrobe suit list outfits | grep -E '^(implementer|reviewer|planner|spy|orchestrator)$'
```
Expected: all 5 role outfits appear in the list.

```bash
SUIT_CONTENT_PATH=/Users/dmestas/projects/wardrobe suit show outfit implementer
```
Expected: shows the implementer outfit's resolved skill set.

---

## Phase 2 — Suit composition algebra

### Task 5: Locate the resolver and extend the outfit YAML schema  `[slot: suit-typescript]`

**Files:**

- Read: `suit/src/cli.ts` and `suit/src/ac.ts` (entry points; locate the resolver call)
- Read: `suit/src/lib/` (locate composer / resolver module)
- Modify: outfit YAML schema definition (path TBD by Step 5.1) — add `compose:` field as optional `string[]` of expressions
- Modify: composer module — add no-op acceptance of `compose` field (errors away when present, but doesn't fail validation)

- [ ] **Step 5.1: Locate the schema and the resolver**

```bash
cd /Users/dmestas/projects/suit && grep -rn 'outfit\|compose\|skills_include' src/ | grep -v test | head -40
```
Expected: pinpoints the YAML schema declaration and the resolver function. Update this task's "Modify" line above with the actual paths before continuing.

- [ ] **Step 5.2: Write the failing test for `compose` field acceptance**

```typescript
// suit/src/tests/composer.test.ts (new file or append)
import { resolveOutfit } from '../lib/composer';

describe('compose: field', () => {
  it('accepts compose in outfit YAML without erroring', async () => {
    const yaml = `
name: testq
version: 0.1.0
type: outfit
targets: [claude-code]
compose:
  - implementer
`;
    const resolved = await resolveOutfit(yaml, /* fixtures with implementer outfit available */);
    expect(resolved).toBeDefined();
  });
});
```

- [ ] **Step 5.3: Run test to verify it fails**

```bash
cd /Users/dmestas/projects/suit && npm test -- --run composer.test 2>&1 | tail -10
```
Expected: FAIL with "unknown property: compose" or schema validation error.

- [ ] **Step 5.4: Add `compose` to the YAML schema**

In whichever module declares the outfit schema (located in Step 5.1), add:
```typescript
compose: z.array(z.string()).optional(),  // if zod
// OR equivalent for the schema lib in use
```

- [ ] **Step 5.5: Run test — should pass even without resolver doing anything**

```bash
cd /Users/dmestas/projects/suit && npm test -- --run composer.test 2>&1 | tail -10
```
Expected: PASS for the schema-acceptance test.

- [ ] **Step 5.6: Commit**

```bash
cd /Users/dmestas/projects/suit && git add -p && git commit -m "feat(composer): accept compose field in outfit YAML (no-op resolution)"
```

---

### Task 6: Implement `+` (union) operator  `[slot: suit-typescript]`

**Files:**

- Modify: composer module from Task 5
- Modify: `suit/src/tests/composer.test.ts`

- [ ] **Step 6.1: Write the failing test**

```typescript
it('+ operator unions skills from referenced outfits', async () => {
  const yaml = `
name: combined
version: 0.1.0
type: outfit
targets: [claude-code]
compose:
  - implementer + planner
`;
  const resolved = await resolveOutfit(yaml, /* fixtures with implementer (skills: [tdd, debug]) and planner (skills: [writing-plans]) */);
  expect(resolved.skills_include).toEqual(expect.arrayContaining(['tdd', 'debug', 'writing-plans']));
});
```

- [ ] **Step 6.2: Run test — should fail**

```bash
cd /Users/dmestas/projects/suit && npm test -- --run composer.test 2>&1 | tail -10
```
Expected: FAIL — `+` not parsed.

- [ ] **Step 6.3: Implement `+` parsing in the composer**

In the composer module, add:
```typescript
function parseComposeExpression(expr: string, registry: OutfitRegistry): ResolvedSkills {
  // tokenize on +, -, &
  const tokens = expr.split(/(\+|\-|\&)/).map(t => t.trim()).filter(Boolean);
  let acc = new Set<string>();
  let op: '+' | '-' | '&' = '+';
  for (const tok of tokens) {
    if (tok === '+' || tok === '-' || tok === '&') { op = tok as any; continue; }
    const operandSkills = new Set(registry.get(tok).skills_include);
    if (op === '+') for (const s of operandSkills) acc.add(s);
    if (op === '-') for (const s of operandSkills) acc.delete(s);
    if (op === '&') acc = new Set([...acc].filter(s => operandSkills.has(s)));
  }
  return [...acc];
}
```

Wire into `resolveOutfit` so the composer uses it when `compose:` is present. Same logic applies to `accessories_force`, `hooks` (when those slots compose).

- [ ] **Step 6.4: Run test — should pass**

```bash
cd /Users/dmestas/projects/suit && npm test -- --run composer.test 2>&1 | tail -10
```
Expected: PASS.

- [ ] **Step 6.5: Commit**

```bash
cd /Users/dmestas/projects/suit && git add -p && git commit -m "feat(composer): + (union) operator on compose field"
```

---

### Task 7: Implement `-` (difference) operator by name  `[slot: suit-typescript]`

**Files:** same as Task 6.

- [ ] **Step 7.1: Write the failing test**

```typescript
it('- operator removes skills present in subtrahend outfit', async () => {
  const yaml = `
name: implementer-no-finishing
version: 0.1.0
type: outfit
targets: [claude-code]
compose:
  - implementer - finishing-bundle
`;
  const resolved = await resolveOutfit(yaml, /* fixtures: implementer has [tdd, debug, finishing]; finishing-bundle has [finishing] */);
  expect(resolved.skills_include).toEqual(expect.arrayContaining(['tdd', 'debug']));
  expect(resolved.skills_include).not.toContain('finishing');
});
```

- [ ] **Step 7.2: Run test — passes already** (the `-` branch was implemented in Step 6.3). Confirm.

```bash
cd /Users/dmestas/projects/suit && npm test -- --run composer.test 2>&1 | tail -10
```

If FAIL, the issue is in the parsing of `-` (might be conflated with hyphenated outfit names like `implementer-planner`). Fix: tokenize using whitespace as the separator and require operators to be padded with spaces. Update the `parseComposeExpression` function to:
```typescript
const tokens = expr.split(/\s+/).filter(Boolean);
```

Re-run; expected PASS.

- [ ] **Step 7.3: Commit**

```bash
cd /Users/dmestas/projects/suit && git add -p && git commit -m "test(composer): - (difference) operator coverage and whitespace tokenization fix"
```

---

### Task 8: Implement tag-based subtraction  `[slot: suit-typescript]`

**Files:** same as Task 6.

The user spec called out `category` tags (primary + secondary) as the basis for tag selection. A subtractive operand of the form `tag:planning` removes any skill whose `category.secondary` contains `planning`.

- [ ] **Step 8.1: Write the failing test**

```typescript
it('- operator with tag: prefix removes skills by category secondary tag', async () => {
  const yaml = `
name: implementer-no-planning
version: 0.1.0
type: outfit
targets: [claude-code]
compose:
  - implementer - tag:planning
`;
  const resolved = await resolveOutfit(yaml, /* fixtures: implementer has [tdd, brainstorm (category.secondary=[planning]), debug] */);
  expect(resolved.skills_include).toContain('tdd');
  expect(resolved.skills_include).not.toContain('brainstorm');
});
```

- [ ] **Step 8.2: Run test — should fail**

Expected: FAIL because the parser doesn't yet special-case `tag:` operands.

- [ ] **Step 8.3: Extend `parseComposeExpression` to handle tag operands**

```typescript
function resolveOperand(tok: string, registry: OutfitRegistry, skillRegistry: SkillRegistry): Set<string> {
  if (tok.startsWith('tag:')) {
    const tag = tok.slice(4);
    return new Set(skillRegistry.allWithSecondaryTag(tag).map(s => s.name));
  }
  return new Set(registry.get(tok).skills_include);
}
```

Plumb the skill registry through; `allWithSecondaryTag` walks the wardrobe skill index for any skill where `category.secondary` contains the tag.

- [ ] **Step 8.4: Run test — should pass**

Expected: PASS.

- [ ] **Step 8.5: Commit**

```bash
cd /Users/dmestas/projects/suit && git add -p && git commit -m "feat(composer): tag:<name> selector for tag-based set ops"
```

---

### Task 9: Wardrobe-lint rule for hook ordering  `[slot: suit-typescript]`

**Files:**

- Locate: the wardrobe-lint module (likely `suit/src/lib/lint.ts` or `suit/src/modes/validate.ts`)
- Modify: add hook-ordering-detection rule

The rule: scan all skill / accessory hooks for any explicit ordering claim — markers like `must run before X`, `must run after X`, `requires X to have run`, `depends on X output`. If found, fail the lint with a clear message naming the skill and the offending hook.

- [ ] **Step 9.1: Write the failing test**

```typescript
it('lint fails when a skill declares an ordering-dependent hook', async () => {
  const skill = `
---
name: ordering-dep
hooks:
  SessionStart:
    - command: must-run-before context-mode
---
`;
  const result = await lintSkill(skill);
  expect(result.errors).toContainEqual(expect.objectContaining({ rule: 'no-hook-ordering' }));
});
```

- [ ] **Step 9.2: Run — should fail** (rule doesn't exist yet)

- [ ] **Step 9.3: Implement the rule**

In the lint module, add:
```typescript
const ORDERING_PATTERNS = [/before/i, /after/i, /requires.*to have run/i, /depends on.*output/i];
function lintHookOrdering(skill: ParsedSkill): LintError[] {
  const errors: LintError[] = [];
  for (const [event, hooks] of Object.entries(skill.hooks ?? {})) {
    for (const h of hooks) {
      const blob = JSON.stringify(h);
      if (ORDERING_PATTERNS.some(p => p.test(blob))) {
        errors.push({ rule: 'no-hook-ordering', skill: skill.name, hookEvent: event });
      }
    }
  }
  return errors;
}
```

- [ ] **Step 9.4: Run — should pass**

- [ ] **Step 9.5: Commit**

```bash
cd /Users/dmestas/projects/suit && git add -p && git commit -m "feat(lint): no-hook-ordering rule (hooks compose by union, run parallel)"
```

---

### Task 10: Phase 2 validation gate  `[slot: validation]`

- [ ] **Step 10.1: Re-run wardrobe validate from suit's new build**

```bash
cd /Users/dmestas/projects/wardrobe && SUIT_BIN=/Users/dmestas/projects/suit/dist/cli.js npm run validate 2>&1 | tail -20
```
Expected: 100% of components validate, including `outfits/quick` (which uses `compose:`).

- [ ] **Step 10.2: Smoke a real composition**

```bash
SUIT_CONTENT_PATH=/Users/dmestas/projects/wardrobe SUIT_BIN=/Users/dmestas/projects/suit/dist/cli.js suit show outfit quick
```
Expected: shows the union of implementer + planner + reviewer skills.

- [ ] **Step 10.3: Commit Phase 2 (suit side) and PR**

```bash
cd /Users/dmestas/projects/suit && git push -u origin feat/composer-venn-algebra
gh pr create --title "feat(composer): venn-diagram composition algebra (+, -, tag:)" --body "$(cat <<'EOF'
## Summary

- Adds compose: field to outfit YAML (string list of compose expressions)
- Implements + (union), - (difference), & (intersect) operators on skills/accessories/hooks
- Adds tag:<name> selector for category.secondary tag-based ops
- Adds no-hook-ordering lint rule

## Test plan

- [x] composer.test.ts covers +, -, tag: ops and acceptance of compose field
- [x] lint test covers no-hook-ordering rule
- [x] wardrobe smoke: outfits/quick (compose: implementer + planner + reviewer) resolves correctly
- [ ] CI green
EOF
)"
```

---

## Phase 3 — Agent-harness extension

### Task 11: Add `--cmd` flag to `harness-spawn`  `[slot: agent-harness-bash]`

**Files:**

- Modify: `agent-harness/bin/harness-spawn`
- Modify: `agent-harness/skills/tmux-agent-panes/SKILL.md` (document new flag)

**Why:** orchestrator needs to spawn `suit claude --outfit implementer --cut go-backend --accessory bones --append-system-prompt-file <brief>` rather than bare `claude`. Today `harness-spawn <agent>` only accepts an agent name and applies a hardcoded wrap. New flag `--cmd "<launch>"` overrides the hardcoded wrap.

- [ ] **Step 11.1: Write a smoke test**

```bash
# agent-harness/tests/cmd-flag-smoke.sh (new)
#!/usr/bin/env bash
set -e
PANE_ID=$(harness-spawn claude --cwd /tmp --cmd "echo SPAWNED-WITH-CMD; sleep 60")
sleep 2
tmux capture-pane -t "$PANE_ID" -p | grep -q SPAWNED-WITH-CMD || { echo FAIL; exit 1; }
tmux kill-pane -t "$PANE_ID"
echo OK
```

- [ ] **Step 11.2: Run smoke — fails** (flag doesn't exist)

```bash
chmod +x agent-harness/tests/cmd-flag-smoke.sh && agent-harness/tests/cmd-flag-smoke.sh
```
Expected: error, `harness-spawn: unknown flag --cmd`.

- [ ] **Step 11.3: Add the flag to harness-spawn**

Read `bin/harness-spawn` (it's a bash script). Find the argument parsing loop. Add:
```bash
CMD_OVERRIDE=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --cmd)
      CMD_OVERRIDE="$2"; shift 2 ;;
    # ... existing cases ...
  esac
done

# Where the launch line is computed:
if [ -n "$CMD_OVERRIDE" ]; then
  LAUNCH_CMD="$CMD_OVERRIDE"
else
  LAUNCH_CMD="$DEFAULT_AGENT_WRAP"
fi
```

The `tmux split-window` should use `$LAUNCH_CMD`.

- [ ] **Step 11.4: Run smoke — passes**

```bash
agent-harness/tests/cmd-flag-smoke.sh
```
Expected: OK.

- [ ] **Step 11.5: Update `tmux-agent-panes/SKILL.md`** with a section on `--cmd` and a worked example.

- [ ] **Step 11.6: Commit + PR**

```bash
cd /Users/dmestas/projects/agent-harness && git add -p && git commit -m "feat(harness-spawn): --cmd flag for custom launch command (enables suit-driven orchestrator spawn)"
git push -u origin feat/harness-spawn-cmd-flag
gh pr create --title "feat(harness-spawn): --cmd flag for custom launch command" --body "Enables orchestrator to spawn role-shaped subharnesses via 'suit claude --outfit X --cut Y --accessory Z' instead of bare claude. See wardrobe plan 2026-05-08-orchestrator-driven-wardrobe.md."
```

---

## Phase 4 — Orchestrator pattern as wardrobe skill

### Task 12: Author `skills/orchestrator-suit/SKILL.md`  `[slot: wardrobe-yaml]`

**Files:**

- Create: `wardrobe/skills/orchestrator-suit/SKILL.md`

**Reference:** `wardrobe/skills/orchestrator-mode/SKILL.md` (the darkish-factory orchestrator) — same shape, different spawn primitive.

- [ ] **Step 12.1: Author the skill**

```markdown
---
name: orchestrator-suit
version: 0.1.0
description: >-
  Use when you are the orchestrator session driving role-shaped subharness
  children. Loads at session start when the orchestrator outfit is active.
  Documents the loop: receive intent → classify → spawn role-shaped child via
  stateless suit + harness-spawn → monitor → cherry-pick worktree → escalate
  → audit log. Triggers on "orchestrate", "dispatch a worker", "spawn an
  implementer / reviewer / planner / spy", "run the multi-role pipeline".
type: skill
targets:
  - claude-code
category:
  primary: workflow
  secondary:
    - role
    - integrations
---

# Orchestrator (suit-driven)

You drive subharness children — implementer, reviewer, planner, spy — via
stateless suit launches passed through harness-spawn. You do not write code,
run tests, or implement features. If you reach for Edit / Write / Bash to do
worker-shaped work, stop and dispatch a subharness instead.

## The loop

1. **Receive intent.** Read the operator's request fully. Identify success
   criteria, minimal deliverable, explicit out-of-scope.
2. **Classify.** Light (single role, single dispatch) or heavy (multi-role
   pipeline)?
3. **Compose the brief.** Write a task brief to `.scion/briefs/<task-id>-<role>.md`
   capturing intent, context, acceptance criteria. Same brief = same child
   behavior; diffable across runs.
4. **Spawn the child.** For each role needed, in sequence:
   ```bash
   PANE=$(harness-spawn claude --cwd <project> --cmd "suit claude --outfit <role> --cut <stack> --accessory <project> -- --append-system-prompt-file .scion/briefs/<task-id>-<role>.md")
   ```
5. **Monitor.** `harness-listen` for the child's Stop event. Read output.
6. **Cherry-pick.** Pull the child's commits into the orchestrator's working
   branch.
7. **Dispatch next.** Implementer → reviewer → … per the pipeline.
8. **Escalate batched decisions.** Decisions outside the brief route back to
   the operator.

## Precedence

When the role outfit's standing instructions and the task brief conflict, the
**brief wins**. The brief is more recent, more specific, more authorised.
Document the override in the brief itself for audit clarity.

## Briefs as artifacts

Briefs are saved files, not regenerated prose. `.scion/briefs/<task-id>-<role>.md`.
This makes orchestration reproducible and auditable: re-running the same task
spawns a child with the same context.

## Stateless not stateful

Always use `suit claude --outfit X` (stateless) for child spawns, never
`suit up --outfit X` (stateful). Stateful writes the project's `.claude/`
tree, which races when two children of different roles target the same
project simultaneously. Stateless composes config in memory and bypasses the
write entirely.

## Audit log

Append a JSON line per dispatch / classification / escalation to
`.scion/audit.jsonl`. RFC3339 timestamp, decision_id UUID, pane_id, role,
brief path. Use `.scion/` if it exists, else `<workspace>/.orchestrator/`.

## What this is NOT

- Not a substitute for darkish-factory's container-based orchestrator
  (`orchestrator-mode` skill); that one runs containerised workers, this one
  runs tmux-pane workers via suit composition.
- Not the same as `subagent-driven-development` superpowers skill; that's for
  in-process subagents, this is for cross-pane subharnesses.
- Not for running the pipeline yourself in a turn. Dispatch. Don't implement.
```

- [ ] **Step 12.2: Validate**

```bash
cd /Users/dmestas/projects/wardrobe && npm run validate 2>&1 | grep orchestrator-suit
```
Expected: passes.

- [ ] **Step 12.3: Commit**

```bash
cd /Users/dmestas/projects/wardrobe && git add skills/orchestrator-suit/SKILL.md && git commit -m "feat(skills): add orchestrator-suit skill (suit-driven multi-role spawn pattern)"
```

---

## Phase 5 — Documentation & migration notes

### Task 13: Update `wardrobe/AGENTS.md` with new taxonomy section  `[slot: wardrobe-yaml]`

**Files:**

- Modify: `wardrobe/AGENTS.md` (append a new section)

- [ ] **Step 13.1: Append "Taxonomy v2: role / stack / accessory" section**

Add at end of AGENTS.md:

````markdown
## Taxonomy v2 — role / stack / accessory

The composition axes have been refactored to support orchestrator-driven
multi-role workflows in addition to solo dressing.

| Axis | What it answers | Examples |
|---|---|---|
| **Outfit** | Who you are (role) | `implementer`, `reviewer`, `planner`, `spy`, `orchestrator`, `quick` (compose) |
| **Cut** | What tech stack you're working on | `go-backend`, `ts-frontend`, `python-data`, `infra-cloudflare`, `bones-tooling` |
| **Accessory** | Where you are + what extra behavior | `bones` / `serverdom` / `dagnats` (project context); `philosophy` / `vault` / `gh-project` (behavior packs) |

### Composition (venn-diagram set algebra)

Outfits can declare a `compose:` field with set operators on other outfits:

```yaml
compose:
  - implementer + planner + reviewer  # union
  - implementer - tag:planning        # remove anything tagged planning
  - reviewer & implementer            # intersect
```

`+` unions skills/accessories/hooks. `-` removes by name or by `category.secondary` tag (`tag:<name>`). `&` intersects. Operators apply only to *sets* — system-prompt prose only unions, in declared order, with brief-wins on conflict per the orchestrator-suit skill's precedence rule.

### Orchestrator-driven spawn

See `skills/orchestrator-suit/SKILL.md` for the worked loop. The TL;DR: orchestrator session in the `orchestrator` outfit dispatches role-shaped children via:

```bash
PANE=$(harness-spawn claude --cwd <project> --cmd "suit claude --outfit implementer --cut go-backend --accessory bones -- --append-system-prompt-file .scion/briefs/<task-id>-implementer.md")
```

Stateless suit (no `.claude/` write) means multiple roles can target the same project simultaneously without contention.

### Migration from v1 (domain outfits)

The pre-v2 outfits (backend, frontend, kb, bones, etc.) and postural cuts (planning, reviewing, executing) remain alive in v1 for solo dressing. They will be revisited in a follow-up plan after the v2 model has 2-3 real orchestrated runs through it. Solo flow can use the `quick` outfit (compose: implementer + planner + reviewer) as the v2 generalist replacement for v1 domain outfits.
````

- [ ] **Step 13.2: Validate**

```bash
cd /Users/dmestas/projects/wardrobe && npm run validate 2>&1 | tail -5
```
Expected: still green.

- [ ] **Step 13.3: Commit**

```bash
cd /Users/dmestas/projects/wardrobe && git add AGENTS.md && git commit -m "docs(AGENTS): document taxonomy v2 — role / stack / accessory + compose algebra + orchestrator-suit pattern"
```

---

### Task 14: Update CHANGELOG  `[slot: wardrobe-yaml]`

**Files:**

- Modify: `wardrobe/CHANGELOG.md`

- [ ] **Step 14.1: Append CHANGELOG entry under `[Unreleased] ### Added`**

Append after the `spy-on-session` entry:

```markdown
- **Taxonomy v2: role / stack / accessory composition.** Adds 6 role outfits
  (`implementer`, `reviewer`, `planner`, `spy`, `orchestrator`, `quick`),
  5 stack cuts (`go-backend`, `ts-frontend`, `python-data`,
  `infra-cloudflare`, `bones-tooling`), 3 project context accessories
  (`bones`, `serverdom`, `dagnats`), and `skills/orchestrator-suit` for the
  spawn pattern. Outfits can now declare a `compose:` field with set
  operators (`+` union, `-` difference by name or by `tag:<name>`,
  `&` intersect) — composition resolves lazily in suit at `suit claude` /
  `suit up` time. Hooks compose by union and run in parallel; ordering
  dependencies are caught by the new `no-hook-ordering` lint rule. v1
  outfits and postural cuts remain alive for solo dressing; deprecation is
  a follow-up plan. See `docs/plans/2026-05-08-orchestrator-driven-wardrobe.md`
  for the full implementation plan and `skills/orchestrator-suit/SKILL.md`
  for the spawn loop. Compatible with `@agent-ops/suit` ≥ <next version>
  (the version that ships the composer venn algebra).
```

- [ ] **Step 14.2: Commit**

```bash
cd /Users/dmestas/projects/wardrobe && git add CHANGELOG.md && git commit -m "docs(changelog): taxonomy v2 entry"
```

---

## Phase 6 — End-to-end proof

### Task 15: Re-run a real audit with the new model  `[slot: validation]`

**Files:** none modified — this is a behavioral proof.

The bones spy audit on `serverdom` was a real workflow; re-doing it with the v2 model proves the orchestrator → suit → harness-spawn → role-outfit chain end-to-end.

- [ ] **Step 15.1: From the orchestrator pane, dress as orchestrator**

```bash
cd /Users/dmestas/projects/serverdom
suit up --outfit orchestrator --cut bones-tooling --accessory bones
claude   # orchestrator session loads with orchestrator outfit
```

- [ ] **Step 15.2: From the orchestrator session, write the spy brief**

```bash
mkdir -p .orchestrator/briefs
cat > .orchestrator/briefs/spy-serverdom-bones.md <<'EOF'
# Spy brief — serverdom

Audit how bones behaves on serverdom. Fingerprint before and after `bones up`,
spy a live session, classify findings as bug / inconvenience / improvement.
Output report to `/tmp/spy-audit/FINAL-ISSUES.md` and inline summary to chat.

Out of scope: code changes to bones itself. Read-only.
EOF
```

- [ ] **Step 15.3: Spawn the spy child**

```bash
PANE=$(harness-spawn claude --cwd /Users/dmestas/projects/serverdom --cmd "suit claude --outfit spy --cut bones-tooling --accessory bones -- --dangerously-skip-permissions --append-system-prompt-file /Users/dmestas/projects/serverdom/.orchestrator/briefs/spy-serverdom-bones.md")
echo "spy spawned at $PANE"
```

- [ ] **Step 15.4: Verify the child is configured correctly**

```bash
sleep 5
tmux capture-pane -t "$PANE" -p | tail -30
```
Expected: claude shows the spy outfit's skills loaded (look for the `2 CLAUDE.md | N MCPs | M hooks` status line; it should show the spy + bones-tooling + bones composition's hook count).

- [ ] **Step 15.5: Drive the child via harness-tell, observe via harness-listen**

```bash
harness-tell "$PANE" "Run the spy audit per the brief in .orchestrator/briefs/spy-serverdom-bones.md. Report findings inline when done."
harness-listen 1800   # block for up to 30 min
```

- [ ] **Step 15.6: Cherry-pick / read the report**

If the spy committed a report file or printed inline summary, capture it. Compare to the original spy report at `/tmp/spy-audit/FINAL-ISSUES.md` — they should overlap substantially. Differences indicate either (a) the bones state has actually changed, or (b) the role-outfit composition is missing skills that were present in the original ad-hoc spy session.

- [ ] **Step 15.7: Tear down the child**

```bash
harness-tell "$PANE" "/exit"
sleep 5
tmux kill-pane -t "$PANE"
```

- [ ] **Step 15.8: Document the result**

Write a short post-mortem to `docs/plans/2026-05-08-orchestrator-driven-wardrobe-postmortem.md` capturing: did the role boundaries hold, did any composition fail to load, did the brief precedence work, what would you change. This becomes the basis for any v2.1 follow-up plan.

---

## Self-review

**1. Spec coverage** — locked architectural decisions:

- [x] Outfit = role, cut = stack, accessory = project + behavior — Tasks 1, 2, 3
- [x] Venn-diagram composition (`+`, `-` by name, `-` by tag, `&` optional) — Tasks 5–8
- [x] Lazy in-memory resolution at suit-up/suit-claude time — Task 5 (the resolver runs at request time, no persistence)
- [x] Hooks compose by union, no-ordering rule — Task 9
- [x] No new suit verb (`suit spawn` not added) — Tasks 11 + 12 use existing `suit claude` stateless mode + `harness-spawn --cmd`
- [x] Brief as artifact, brief wins on conflict — Task 12 SKILL.md
- [x] Cross-vendor injection stays inside suit — Task 12 documents calling suit, not vendor binaries directly
- [x] `quick` generalist outfit composes implementer + planner + reviewer — Task 1.6
- [x] Stateless not stateful suit for orchestrated children — Task 12 + Task 15
- [x] End-to-end proof — Task 15

**2. Placeholder scan** — checked for "TBD", "implement later", vague handwaves:

- Task 5.1 has "path TBD by Step 5.1" — that's intentional; the resolver location depends on suit's current code layout, and the discovery step is the first action. Acceptable.
- Task 9 lints for ordering language with regexes — the regex set may need expansion as authors invent new ways to express "must run after." Acceptable for v1; expand on first false-negative.
- No other placeholders found.

**3. Type consistency** — checked that names referenced across tasks match:

- `compose:` field — used in Task 1.6 (the `quick` outfit), Tasks 5–8 (the resolver). Consistent.
- `category.secondary` tag selector — used in Task 8 (resolver) and the role outfit declarations in Task 1 (which set `category.secondary: [role]`). Consistent.
- `--cmd` flag on `harness-spawn` — used in Task 11 (added) and Task 12 / Task 15 (consumed). Consistent.
- Brief file path: `.scion/briefs/<task-id>-<role>.md` in Task 12; `.orchestrator/briefs/spy-serverdom-bones.md` in Task 15. Mismatch — Task 12 uses `.scion/`, Task 15 uses `.orchestrator/`. Resolved: the orchestrator-suit skill says `.scion/` if it exists else `<workspace>/.orchestrator/`. The serverdom workspace doesn't have `.scion/` (that's a darkish-factory thing), so Task 15 correctly falls through to `.orchestrator/`. Documented in Task 12 SKILL.md, no fix needed.

---

## Plan → tasks

This plan is for the **wardrobe** and **suit** repos, not bones. Skip the `bones tasks create` materialization step — track work via GitHub issues or local task list. If desired, the operator can manually translate each numbered task into a GitHub issue per repo (Tasks 1-4, 12-14 → wardrobe; Tasks 5-10 → suit; Task 11 → agent-harness; Task 15 → cross-repo, attach to whichever repo's PR closes the loop).

## Execution

Recommended order:

1. **Phase 1 (Tasks 1–4)** — wardrobe content. Non-breaking, can land standalone. PR + merge.
2. **Phase 2 (Tasks 5–10)** — suit composer. Required before the `quick` outfit fully validates. PR + merge.
3. **Phase 3 (Task 11)** — agent-harness `--cmd` flag. Parallel-able with Phase 2. PR + merge.
4. **Phase 4 (Task 12)** — orchestrator-suit skill. Depends on Tasks 11. Wardrobe PR.
5. **Phase 5 (Tasks 13–14)** — docs + changelog. Bundle with Phase 4 PR.
6. **Phase 6 (Task 15)** — end-to-end proof. Standalone session work, write postmortem.

Each phase ships its own PR; full delivery probably takes 3–4 focused days (matches the original DX-audit estimate).
