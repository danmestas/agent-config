# Wardrobe restructure v3 — bullet-proof outfits/modes/accessories

Status: **Draft** — proposal for review.
Date: 2026-05-04
Methodology: systematic-debugging + dx-audit, anchored on session-usage signal mined from `~/.claude/projects/*` across 71 project directories (last 60 days).

---

## 1. Audit findings (current state)

### 1.1 Inventory

| Bucket | Count | State |
|---|---:|---|
| outfits | 6 | aviation, backend, frontend, machines, personal, taxes |
| modes | 4 | code, design, focused, ops |
| accessories | 0 | placeholder README only |
| skills | 70 | flat pool, all `targets:` set, **0 categorized** |
| agents | 6 | architect-review, code-reviewer, debugger, gh-project-expert, golang-pro, observability-engineer |
| hooks | 6 | bones-powers, monorepo-profiles, recall, trace, tts-announcer, _lib |
| commands | 2 | career-interview-setup, monorepo-profile |
| rules | 0 | placeholder README only |

### 1.2 Defects

1. **Outfit `skill_include` is too narrow.** Every outfit force-loads 0–3 skills. Heavy-use skills (planning, brainstorming, debugging, subagent dispatch) are not in any outfit; they rely entirely on description matching. That's not bullet-proof — a session that doesn't surface the right description never loads them.
2. **Modes are body-only.** ADR-0010 made `include:` first-class on modes; none of the 4 modes use it. Modes are just prompt injection.
3. **Zero accessories.** ADR-0010 made accessories first-class for piecemeal opt-in; none exist.
4. **TAXONOMY unused.** `docs/TAXONOMY.md` defines 8 categories. 0 / 70 skills carry a `categories:` field; only outfits do (and inconsistently).
5. **Stale outfits.** `aviation` and `taxes` have empty `skill_include`. `aviation` excludes nothing despite Dan having 4 active aviation repos.
6. **Duplicate domains, missing roles.** No outfit for the bones orchestrator project (Dan's #1 active repo, 36 sessions). No outfit for KB authoring (12 sessions on Knowledge-Base alone). No outfit for wardrobe/suit/agent-skills meta-tooling work (~21 sessions across those repos).
7. **Mode taxonomy doesn't match work shape.** `code` mode injects "you are in code mode" — that overlaps with what every outfit already implies. `ops` mode has no body in current files. Real work shapes that recur: planning, executing, debugging, reviewing, ticketing, writing.

### 1.3 Session-usage signal (last 60 days, 71 projects)

**Top projects by session count:**
| Rank | Project | Sessions |
|---:|---|---:|
| 1 | bones | 36 |
| 2 | (home) | 27 |
| 3 | serverdom | 27 |
| 4 | dagnats | 16 |
| 5 | firestorm-dataworks | 15 |
| 6 | Knowledge-Base | 12 |
| 7 | darken | 11 |
| 8 | EdgeSync | 10 |
| 9 | Flight-Planner | 10 |
| 10 | agent-infra | 10 |

**Top skill invocations (via `Skill` tool, all prefixes pooled):**
| Rank | Skill | Count |
|---:|---|---:|
| 1 | writing-plans | 80 |
| 2 | brainstorming | 73 |
| 3 | subagent-driven-development | 61 |
| 4 | agent-browser | 25 |
| 5 | systematic-debugging | 21 |
| 6 | using-git-worktrees | 19 |
| 7 | orchestrator-mode | 15 |
| 8 | obsidian-markdown | 8 |
| 9 | test-driven-development | 8 |
| 10 | finishing-a-development-branch | 7 |
| 11 | update-config | 6 |
| 12 | investigating-agent-sessions | 6 |
| 13 | ousterhout | 5 |
| 14 | dispatching-parallel-agents | 7 |
| 15 | mgrep | 4 |
| 16 | wiki-ingest | 4 |

Keys:
- The top 4 skills (planning, brainstorming, subagent dispatch, systematic-debugging) are **universal** across project domains.
- `using-git-worktrees`, `update-config`, `mgrep` are external (superpowers / plugin-dev / mgrep) — not in wardrobe today; in scope to mirror or replace.
- `bones` workflow skills (`using-bones-swarm`, `finishing-a-bones-leaf`, `using-bones-powers`) are heavily implied by the bones session count but invoked indirectly via bones-powers hook.

**Tool usage:** Bash (28.9k), Read (8.8k), Edit (7.2k), TaskUpdate (3.6k), Agent (2.8k), Write (2.4k), TaskCreate (2k), Grep (1.8k), `ctx_execute` (818), Skill (428), Monitor (120), AskUserQuestion (68), ScheduleWakeup (54). Backs up: subagents are core, task tracking is core, context-mode is core, scheduling/monitor are common.

---

## 2. Mental model: scope rules (the bullet-proof contract)

Every primitive needs a one-sentence test. If a thing doesn't fit a test, it doesn't go there.

| Primitive | Test |
|---|---|
| **outfit** | "What kind of project is this?" — domain bundle, set once per session, large (5–15 force-loaded skills + agents + hooks + rules). |
| **mode** | "What shape of work am I doing right now?" — work-shape overlay, smaller (3–8 skills), can replace outfit components. Includes a prompt body that biases the session. |
| **accessory** | "What single capability or constraint do I want layered on top?" — repeatable, additive only, 1–4 components per accessory. |
| **skill** | "What's a single capability triggered by description?" — flat pool. Categories are the only structural axis. |

**Invariants:**
1. Outfits never overlap in domain. One project = one outfit choice.
2. Modes never overlap in work-shape. One session-time = one mode (can switch).
3. Accessories are commutative — order doesn't change semantics.
4. The 4 universal skills (`writing-plans`, `brainstorming`, `subagent-driven-development`, `systematic-debugging`) are force-loaded by **every** outfit. No exceptions. This is the bullet-proof core.

---

## 3. Proposed structure

### 3.1 Outfits (9 — replaces current 6)

| Outfit | Test ("this project is...") | Active repos (top sessions) | `skill_include` shape |
|---|---|---|---|
| `code` | a generic coding project, language-agnostic | (default fallback) | core4 + ousterhout + tigerstyle + verification-before-completion + executing-plans |
| `backend` | Go-heavy, server / data / observability | serverdom, dagnats, firestorm-dataworks, EdgeSync, agent-infra | code-outfit + idiomatic-go + signoz-dashboard-builder + deterministic-simulation-testing + farley + tigerstyle |
| `frontend` | Datastar / shadcn / UI work | studs-cycles, studs-cycles-pb, darken | code-outfit + datastar-tao + datastar-patterns + shadcn-forms + obsidian-markdown |
| `bones` | the bones Go orchestrator (or any bones-shaped workspace) | bones | backend-outfit + using-bones-powers + using-bones-swarm + finishing-a-bones-leaf + takeoff |
| `aviation` | flight planning / NOTAM / charts | Flight-Planner, flight-planner-kb, NotamsApi, NOTAMOrganizer, preflightapi.backend | core4 + knowledge-base-overview + obsidian-markdown + autoresearch + apple-contacts |
| `kb` | Obsidian vault / knowledge curation | Knowledge-Base, FirestormKB | core4 + obsidian-markdown + vault-overview + vault-ingest + vault-query + vault-save + vault-lint + obsidian-bases + autoresearch + defuddle |
| `meta` | wardrobe / suit / agent-skills authoring | suit, wardrobe, agent-config, agent-skills, agent-infra | core4 + skill-creator + skill-development + suit-build + verification-before-completion + executing-plans |
| `personal` | journaling / resume / life admin (formerly personal + taxes) | (home), resume, craft-design-group-website, staging-report | core4 + obsidian-markdown + career-interview + memorize + brainstorming |
| `stasi` | reading session info to audit / improve agent behavior — closed-loop wardrobe improvement | (cross-cutting; runs over any project's `.claude/projects/*` history) | core4 + investigating-agent-sessions + spy-on-bones-session + dx-audit + description-linter + skill-gap-detector + skill-eval-runner + stuck-detector + course-correct |

Drop: `taxes` (folds into `personal`).

**stasi outfit notes.** The "spying" outfit. Its job is to read `~/.claude/projects/<repo>/*.jsonl` session transcripts, identify what skills triggered (or should have triggered), surface DX gaps in skills/agents/hooks, and adapt the wardrobe based on real usage. Includes the `recall` hook to pull historical session context. Distinct from `meta`: `meta` is for *authoring* wardrobe content; `stasi` is for *observing and improving* it from session evidence. They overlap on `description-linter` / `skill-eval-runner` (both authors and auditors care about description quality and eval pass rates).

**core4** (every outfit force-loads, defined as a shared yaml fragment or duplicated in each outfit):
```yaml
- writing-plans
- brainstorming
- subagent-driven-development
- systematic-debugging
```

### 3.2 Modes (8 — replaces current 4)

| Mode | "I am doing..." | `include` | Body bias |
|---|---|---|---|
| `focused` (keep) | one task, no scope creep | — | "stay on the task; mention adjacent issues in one line; don't refactor neighbors" |
| `planning` | designing before code | brainstorming + writing-plans + grill-me + reflect | "plan only, don't write code yet; produce a deliverable plan; ask one question at a time" |
| `executing` | working a plan | executing-plans + subagent-driven-development + dispatching-parallel-agents + finishing-a-bones-leaf | "follow the plan; spawn subagents for parallelizable work; mark tasks complete as you go" |
| `debugging` | hunting a bug | systematic-debugging + investigating-agent-sessions + stuck-detector + course-correct | "reproduce → minimize → hypothesise → instrument → fix → regression-test; don't skip steps" |
| `reviewing` | code review (sending or receiving) | requesting-code-review + receiving-code-review + verification-before-completion + ousterhout | "review in passes (correctness, design, tests, docs); separate must-fix from suggestion" |
| `ticketing` | issue / PR writing | linear-method + gh-project-charter + gh-project-operations + writing-plans | "produce tracer-bullet vertical slices; one independently-grabbable issue per ticket" |
| `writing` | prose / KB notes / docs | obsidian-markdown + defuddle + brainstorming | "write for clarity; lead with the why; use callouts and wikilinks; keep it tight" |
| `ops` (keep, populate) | incident / infra change | takeoff + signoz-dashboard-builder + investigating-agent-sessions + course-correct | "observe before changing; take inventory first (takeoff); pull metrics; smallest-blast-radius first" |

Drop: `code`, `design` (collapse — `code` was just "you are coding" which every outfit already implies; `design` collapses into `frontend` + `writing` modes layered).

### 3.3 Accessory-as-role (revised)

**Concept change.** Accessory is a *role* (anything you layer at invocation time), not a *type* (a specific filesystem location). The suit resolver accepts `--accessory <name>` for any wardrobe component — skill, hook, rule, agent, command — by falling through `accessories/` → `skills/` → `hooks/` → `rules/` → `agents/` → `commands/` and synthesizing an accessory manifest from the first match. Real bundles still live in `accessories/<name>/` for genuine multi-component assemblages. See ADR-0013 for the resolver change.

**Hand-curated accessory bundles (4 — shipped):**

| Accessory bundle | Components | When to apply |
|---|---|---|
| `philosophy` | ousterhout + tigerstyle + farley + hipp + norman + vitaly | reviews, refactors, design decisions |
| `skill-author` | skill-creator + skill-development + description-linter + skill-eval-runner + skill-gap-detector | wardrobe / agent-skills / suit work |
| `vault` | vault-ingest + vault-query + vault-save + vault-lint + obsidian-markdown + obsidian-bases + obsidian-canvas | KB ops on a non-`kb` outfit |
| `gh-project` | gh-project-charter + gh-project-setup + gh-project-operations + gh-project-shared + gh-project-expert (agent) | issue tracker / project board work |

**Singleton accessories (no bundle dir — pulled directly via fall-through):**

| `--accessory` invocation | What it pulls | Lives at |
|---|---|---|
| `--accessory pr-policy` | a rule forcing "no commit to main; PR + local CI" | `rules/pr-policy/RULE.md` (new) |
| `--accessory test-driven-development` | TDD skill | `skills/test-driven-development/` |
| `--accessory verification-before-completion` | verification skill | `skills/verification-before-completion/` |
| `--accessory signoz-dashboard-builder` | observability skill | `skills/signoz-dashboard-builder/` |
| `--accessory doppler` | secrets-mgmt skill | `skills/doppler/` |
| `--accessory subagent-driven-development` | subagent dispatch skill | `skills/subagent-driven-development/` |
| `--accessory dispatching-parallel-agents` | parallel-work skill | `skills/dispatching-parallel-agents/` |
| `--accessory observability-engineer` | observability agent | `agents/observability-engineer/` |
| ...any other wardrobe component name | the named component | wherever it lives |

**Net effect:** v3 ships 4 hand-curated bundles in `accessories/`, plus the entire 70-skill / 6-agent / 6-hook / 2-command pool is implicitly available as `--accessory <name>`. Authoring a 1-skill wrapper accessory dir is no longer necessary. If a user wants a short alias for a long skill name (e.g. `--accessory tdd` instead of `--accessory test-driven-development`), they can author a 1-line accessory bundle that includes the skill — but it's optional, not required.

### 3.4 Skill TAXONOMY application

All 70 skills get a `categories:` field. Mapping (one-pass, draft):

| Category | Skill examples |
|---|---|
| Economy | brainstorming, writing-plans, executing-plans, dispatching-parallel-agents, subagent-driven-development, orchestrator-mode |
| Workflow | finishing-a-bones-leaf, using-bones-swarm, using-bones-powers, requesting-code-review, receiving-code-review, takeoff, landing |
| BackPressure | course-correct, stuck-detector, verification-before-completion, reflect, grill-me-equivalent (none yet) |
| Tooling | suit-build, mgrep-equivalent, agent-browser-equivalent, pikchr-generator, skill-creator, skill-eval-runner, description-linter |
| Integrations | linear-method, gh-project-* (charter/setup/operations/shared), atlassian-cli-jira, doppler, cloudflare-email, apple-contacts, signoz-dashboard-builder, shadcn-forms |
| ContextManagement | systematic-debugging, investigating-agent-sessions, defuddle, autoresearch |
| MemoryManagement | knowledge-base, knowledge-base-overview, vault-* (5), obsidian-markdown, obsidian-bases, obsidian-canvas, memorize, career-interview |
| Evolution | evolution-changelog, evolution-engine, ousterhout, tigerstyle, farley, hipp, norman, vitaly, idiomatic-go, datastar-tao, datastar-patterns, datastar, deterministic-simulation-testing, test-driven-development, dx-audit, skill-development, skill-gap-detector, spy-on-bones-session, midscene-testing |

### 3.5 Default-resolution heuristics

Add a `--auto` mode to `suit up` that picks an outfit based on repo signal:

| Signal | Picked outfit |
|---|---|
| `bones-workspace` file present | `bones` |
| `go.mod` present + signoz/dagnats/edgesync naming | `backend` |
| `package.json` + datastar/shadcn deps | `frontend` |
| `.obsidian/` dir | `kb` |
| Repo contains `outfits/` and `skills/` (i.e., is a wardrobe-shaped repo) | `meta` |
| Repo is in `Documents/` or matches aviation naming | `aviation` |
| Otherwise | `code` |

This is a stretch goal — does not block v3 cutover.

---

## 4. Migration plan

Single coordinated PR, like ADR-0011 was. Phases inside the PR:

1. **Phase A — taxonomy backfill.** Add `categories:` to all 70 skills via a script (one-pass mapping per §3.4, hand-correct the long tail). Land on `feat/v3-restructure` branch.
2. **Phase B — outfit rewrite.** Rewrite the 6 existing outfit files to the new `skill_include` shape; add 2 new outfits (`bones`, `kb`, `meta`); delete `taxes`.
3. **Phase C — mode rewrite.** Drop `code` and `design`. Keep `focused`, populate `ops`. Add 6 new modes (`planning`, `executing`, `debugging`, `reviewing`, `ticketing`, `writing`). Each gets `include:` per §3.2.
4. **Phase D — accessories.** Create 10 accessory dirs with `accessory.md` per §3.3. Includes `rules/` fragments for `pr-policy` (this requires `rules/` to actually have content for the first time — write the PR-policy rule directly).
5. **Phase E — validation.** Run `suit list outfits|modes|accessories` against the rewritten wardrobe and verify discovery. Run `suit show outfit <name>` for each. Run `suit prelaunch --dry-run` to confirm strict-include resolution doesn't break.
6. **Phase F — docs.** Update `wardrobe/README.md` "What's in here" table. Update `docs/TAXONOMY.md` if any category got dropped. Add `docs/COMPOSITION.md` documenting the scope rules from §2.

**Suit-side change required:** the accessory-as-role behavior (§3.3) is **not** in the current resolver. ADR-0013 (in suit) documents the change; suit/src/lib/accessory.ts grows fall-through resolution; suit version bumps to 0.6.0. Wardrobe v3 PR depends on suit 0.6.0 being merged + released first.

**Risk:** strict `include:` will fail prelaunch if a referenced skill name is wrong. Mitigation: a single `suit doctor`-like script that walks every outfit/mode/accessory and verifies all `include:` references resolve to a wardrobe component. Run it as the last step of phase E; gate the merge on a clean pass.

---

## 5. Open decisions (need user input)

These are taste / architecture calls — not safe to decide unilaterally:

1. **Naming.** Is `bones` the right outfit name? Or `bones-orch` / `orchestrator`? Same for `meta` — could be `wardrobe-author` or `tooling`.
2. **`code` outfit existence.** Two options: (a) ship a generic `code` outfit as the default fallback, or (b) require every project to pick a domain outfit explicitly. Default-fallback is friendlier; explicit is more disciplined. Recommendation: ship `code` as fallback.
3. **`personal` vs split.** `personal` covers journaling, resume, staging-report, craft-design — these are pretty different. Acceptable to keep as one outfit, or split into `personal` + `client-work`?
4. **External skills.** `using-git-worktrees`, `update-config`, `mgrep` are heavily used but live outside wardrobe (superpowers / plugin-dev / mgrep packs). Three options: (a) ignore, accept that wardrobe is partial, (b) mirror copies into wardrobe with attribution, (c) declare a `wardrobe peers` concept where outfits can reference external-pack skills. Recommendation: (a) for v3, revisit later.
5. **Rules content for `pr-policy`.** The rule itself needs to be written. Source it from the user's `~/.claude/CLAUDE.md` "PR policy" section verbatim, or paraphrase? Recommendation: lift verbatim with attribution.

---

## 6. Out of scope for v3

- Per-harness adapter changes in `suit/`.
- Plugin manifest (`.claude-plugin/manifest.json`) authoring for outfits — defer until first outfit needs distribution.
- The `--auto` outfit picker (§3.5) — stretch goal, separate ADR.
- Backfilling `categories:` on agents/hooks/commands — only skills in v3, others later.
