# TAXONOMY

Canonical reference for the 8-category taxonomy used to classify skills, agents, rules, hooks, and MCP configs in this repo. Categories are **tags**, not directories. A component carries a `primary` category and an optional `secondary[]` list. The taxonomy informs plugin bundling, README grouping, per-harness config slicing, and audit tooling — it does not move files.

## Section 1: The 8 categories

### 1. Economy

Cost-shaping skills and configs. Anything whose primary job is to compress, cap, redirect, or otherwise reduce the four scarce budgets an agent burns: **output**, **context**, **cache**, **model**.

| Sub-axis | What it shapes | Example |
|----------|----------------|---------|
| output   | Tokens emitted by the model | `caveman` (terse output mode; lives in scion) |
| context  | Tokens flowing into the window | `context-mode` (raw tool output stays in sandbox; only summaries cross the boundary) |
| cache    | Prompt-cache hit rate / TTL | model-side breakpoint discipline; cache-aware harness wiring |
| model    | Model selection / routing | route Haiku for triage, Opus for synthesis; per-task model selection |

**Examples in this repo:** `context-mode` (context axis).

**Engineering concern:** dollars-per-task and headroom in the working window. Without explicit Economy wiring, an agent will saturate the window on raw tool spew and pay full input rates for content it could have summarized, cached, or routed away.

**Differs from Tooling:** Tooling adds capability; Economy shapes the *cost* of using capability. A tool can be both — `context-mode` is `primary: tooling` and `secondary: [economy]` because it adds a sandbox capability *and* shrinks context spend.

### 2. Workflow

Orchestration patterns that drive a task forward through ordered phases. The brainstorm → spec → plan → execute pipeline lives here.

**Examples:** `superpowers:brainstorming`, `superpowers:writing-plans`, `superpowers:executing-plans`, `superpowers:finishing-a-development-branch`, `superpowers:test-driven-development`, `superpowers:requesting-code-review`.

**Engineering concern:** without an explicit phase model, agents conflate exploration with implementation, skip planning, and produce diffs no one asked for. Workflow skills enforce a forward gradient with checkpoints.

**Differs from BackPressure:** Workflow is the rail moving you forward; BackPressure is the gate that pulls you back. A failing review (BackPressure) feeds back into the next Workflow iteration.

### 3. BackPressure

Quality feedback skills that pull the agent **back** to revisit work that already exists. Reviews, audits, philosophical critiques.

**Examples:** `ousterhout` (deep modules / cognitive load review), `hipp` (zero-config simplicity audit), `norman` (UI usability audit), `tigerstyle` (NASA Power-of-Ten safety review), `idiomatic-go` (Go-style refactor pass), `dx-audit` (workflow friction scoring).

**Engineering concern:** agents over-produce. Without BackPressure, every plan becomes a diff and every diff ships. BackPressure introduces structured "is this actually good?" loops — applied to design, code, UX, or process.

**Differs from Workflow:** Workflow says "next step." BackPressure says "go back and fix." Both are needed; neither replaces the other.

### 4. Tooling

Capability extensions — new senses or abilities the agent can invoke. CLIs, MCPs, code-search engines, browser drivers, telemetry builders.

**Examples:** `mgrep-code-search`, `apm-builder`, `signoz-dashboard-builder`, `midscene-testing`, `deterministic-simulation-testing`, `datastar-tao`, `datastar-patterns`, `context-mode` (also Economy).

**Engineering concern:** what the agent *can do* at all. Without Tooling skills, an agent is limited to the harness's built-in tools and reasons about systems it has no levers on.

**Differs from Integrations:** Tooling is generic capability that may use any backing service or none. Integrations point at a specific external system (Linear, Jira, Cloudflare). The line is fuzzy — `signoz-dashboard-builder` is `primary: tooling, secondary: [integrations]` because the capability is dashboard authoring; SigNoz is the substrate.

### 5. Integrations

External-service hookups. The skill exists to talk to one named system.

**Examples:** `linear-method`, `gh-project-charter`, `gh-project-setup`, `gh-project-operations`, `gh-project-shared`, `atlassian-cli-jira`, `doppler`, `cloudflare-email`, `apple-contacts`.

**Engineering concern:** organizational reality. Real work touches Linear, Jira, GitHub, secrets stores, mail, address books. Integration skills encode the auth, idioms, and pitfalls of each system once.

**Differs from Tooling:** see above. The test: would this skill make sense if you swapped the backing service for a competitor? If yes, it's Tooling. If no, it's Integrations.

### 6. ContextManagement

Runtime session strategies. How the agent allocates, isolates, rewinds, or hands off context inside a single working session.

**Examples:** `superpowers:subagent-driven-development`, `superpowers:dispatching-parallel-agents`, `superpowers:executing-plans` (the harness side), `superpowers:using-git-worktrees`.

**Engineering concern:** the working window is finite. Subagent dispatch, worktree isolation, and parallel-task fan-out are the levers for keeping the lead agent's context small while still doing large work.

**Differs from Economy:** Economy reduces the *cost* of context tokens (compress, cache, route). ContextManagement reorganizes *who holds which context* (delegate, isolate, fan out). They compose: a subagent (ContextManagement) running with `context-mode` (Economy) is the canonical pattern.

**Differs from MemoryManagement:** ContextManagement is intra-session; MemoryManagement is across-session.

### 7. MemoryManagement

Persistent, cross-session memory. State that survives the harness restart.

**Examples:** `knowledge-base` (long-running LLM-maintained Obsidian-compatible wikis), the auto-memory system itself (CLAUDE.md, settings.json scaffolding, hook-driven capture).

**Engineering concern:** session amnesia. Without a memory layer, every new session re-derives facts, re-reads the same files, and re-discovers the same gotchas.

**Differs from ContextManagement:** time horizon. If the artifact dies with the session, it is ContextManagement. If it persists to disk and is read by a later session, it is MemoryManagement.

### 8. Evolution

Meta-skills that observe session history → detect patterns → propose updates to other skills, configs, or rules based on evals.

**Examples in this repo:** none yet. This is the missing layer. See the Evolution spec doc (separate, local) for the first proposed primitive.

**Engineering concern:** every other category produces feedback signal (failed reviews, repeated questions, low-quality outputs, missing tools). Without Evolution, that signal is wasted — humans hand-tune skills indefinitely. Evolution closes the loop: the skill stack adapts itself.

**Differs from BackPressure:** BackPressure improves a single artifact in flight. Evolution improves the *skills that produce artifacts*, based on evals across many sessions.

## Section 2: Tags, not homes

A component declares its category in frontmatter. Categories are tags — a component has one `primary` and zero or more `secondary`.

```yaml
# context-mode/SKILL.md frontmatter
---
name: context-mode
type: skill
category:
  primary: tooling
  secondary: [economy]
---
```

```yaml
# ousterhout/SKILL.md frontmatter
---
name: ousterhout
type: skill
category:
  primary: backpressure
---
```

Files do not move. `skills/` stays flat. The taxonomy is a query layer over the existing tree.

## Section 3: How the taxonomy informs the repo

| Surface | How taxonomy shows up |
|---------|------------------------|
| `skills/` layout | Flat. No category subdirectories. |
| `plugins/` | Two flavors live side-by-side. **Functional bundles** (existing): `software-philosophy`, `gh-project-management`. **Category bundles** (new): `backpressure-essentials`, `economy-toolkit`, `integrations-pack`, `workflow-superpowers`, `context-strategies`. |
| `README.md` catalog | Components grouped by `primary` category inside the marker-bounded auto-region. Regenerated by `apm-builder docs` once the `category:` field lands. |
| `apm-builder.config.yaml` | Reshape from flat `<harness>.<key>` to `<harness>.<category>.<key>` slices. Per-category overrides become first-class. |
| Audit | `apm-builder validate --category <name>` lists components carrying that category (primary or secondary) — see Section 5. |

### Per-harness config reshape (sketch)

Today:

```yaml
claude-code:
  marketplace: claude-plugins-official
codex:
  agents_md_section_order: [rules, agents, skills]
```

After:

```yaml
claude-code:
  economy:
    cache_breakpoints: aggressive
  integrations:
    marketplace: claude-plugins-official
codex:
  workflow:
    agents_md_section_order: [rules, agents, skills]
```

Each harness can opt into category-specific defaults without polluting the top namespace.

## Section 4: Gap analysis

Existing skills slotted by primary category (best inference; subject to retag PR):

| Category | Skills in this repo | Density |
|----------|---------------------|---------|
| Economy | `context-mode` (also tooling) | **Thin** — `caveman` lives in scion, not here |
| Workflow | `superpowers:*` (brainstorming, writing-plans, executing-plans, finishing-a-development-branch, test-driven-development, requesting-code-review, receiving-code-review, verification-before-completion, systematic-debugging, writing-skills) | Rich (via plugin) |
| BackPressure | `ousterhout`, `hipp`, `norman`, `tigerstyle`, `idiomatic-go`, `dx-audit` | **Rich** |
| Tooling | `mgrep-code-search`, `apm-builder`, `signoz-dashboard-builder`, `midscene-testing`, `deterministic-simulation-testing`, `datastar-tao`, `datastar-patterns`, `context-mode` | **Rich** |
| Integrations | `linear-method`, `gh-project-charter`, `gh-project-setup`, `gh-project-operations`, `gh-project-shared`, `atlassian-cli-jira`, `doppler`, `cloudflare-email`, `apple-contacts` | **Rich** |
| ContextManagement | `superpowers:subagent-driven-development`, `superpowers:dispatching-parallel-agents`, `superpowers:using-git-worktrees`, `superpowers:executing-plans` (secondary) | Adequate |
| MemoryManagement | `knowledge-base` | Thin |
| Evolution | — | **Empty** |

**Action items implied:**

- **Economy:** ship a first-party Economy skill in this repo (port of `caveman` or new `output-shaping`). Add cache-discipline and model-routing skills to fill the four sub-axes.
- **Evolution:** stand up the first primitive per the Evolution spec doc. Without it, the repo has no self-improvement loop.
- **MemoryManagement:** consider companion skills to `knowledge-base` (memory hygiene, session-end capture, cross-project recall).

## Section 5: Audit affordance

Once the `category:` field lands in frontmatter and is validated by the schema, `apm-builder` exposes a category-aware audit:

```bash
apm-builder validate --category economy
```

Lists every component whose `primary` *or* `secondary` includes `economy`, with their other categories. Output sketch:

```text
economy/
  context-mode          primary: tooling           secondary: [economy]
  (no primary-economy components)

posture: 1 secondary, 0 primary — Economy axis is undercovered
```

This gives a one-command read on posture along any axis. Combined with `--category evolution` returning empty today, the gap analysis above becomes machine-checkable rather than narrative.

## Spec ambiguities flagged

- **Plugin/skill boundary for Workflow.** `superpowers:*` are skills shipped via a plugin. The taxonomy applies to skills directly; plugins inherit category from their members. Whether plugins themselves carry a category field is open — leaning yes, primary-only.
- **`secondary[]` cardinality.** Spec is silent on max length. Recommend cap at 3 to keep audits readable.
- **Where `context-mode` lives.** Listed as `primary: tooling, secondary: [economy]`. Reasonable case for the inverse (`primary: economy, secondary: [tooling]`) since the *motivating* concern is window cost. Final tag is a judgement call for the retag PR.
- **Evolution scope.** Defined here as observation → eval → proposal. Whether Evolution skills *apply* changes (mutate other skills directly) or only *propose* them (write to a queue for human review) is left to the Evolution spec doc.
- **Functional vs category plugin overlap.** `software-philosophy` (functional) overlaps with `backpressure-essentials` (category). Both can coexist; consumers pick by intent. No deduplication required.
