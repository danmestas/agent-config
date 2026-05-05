---
name: engineer
version: 1.0.0
type: outfit
description: General software engineering — language-agnostic discipline pack with philosophy, review, testing, and self-correction.
targets:
  - claude-code
  - apm
  - codex
  - gemini
  - copilot
  - pi
categories:
  - economy
  - workflow
  - backpressure
  - evolution
  - context-management
disable:
  plugins:
    - frontend-design
    - frontend-design-codex
    - swift-lsp
  mcps: []
  hooks: []
skill_include:
  - writing-plans
  - brainstorming
  - subagent-driven-development
  - systematic-debugging
  - ousterhout
  - tigerstyle
  - hipp
  - farley
  - executing-plans
  - dispatching-parallel-agents
  - verification-before-completion
  - course-correct
  - stuck-detector
  - reflect
  - requesting-code-review
  - receiving-code-review
  - test-driven-development
  - dx-audit
skill_exclude:
  - datastar
  - datastar-tao
  - datastar-patterns
  - shadcn-forms
---

# Engineer Outfit

Language-agnostic software engineering discipline pack. Heavy on philosophy, review, testing, debugging, and self-correction — every safety rail loaded. The rigor-heavy alternative to `code`: use `code` when you want a light baseline, use `engineer` when you want a session that knows how to engineer regardless of the project domain.

## Force-loaded skills (18)

**Core4** (every outfit): writing-plans, brainstorming, subagent-driven-development, systematic-debugging.

**Philosophy** (4): `ousterhout` (deep modules / cognitive load), `tigerstyle` (NASA Power-of-Ten safety review), `hipp` (zero-config simplicity), `farley` (continuous delivery / testing discipline).

**Workflow** (2): `executing-plans` (work the plan you wrote), `dispatching-parallel-agents` (split work across agents when it's parallelizable).

**Discipline** (4): `verification-before-completion` (don't declare done early), `course-correct` (mid-task pivot when you've gone wrong), `stuck-detector` (off-ramp from doom loops — N consecutive failures triggers a handoff summary), `reflect` (post-task critique).

**Review** (2): `requesting-code-review`, `receiving-code-review`.

**Testing** (1): `test-driven-development`.

**DX** (1): `dx-audit` (workflow friction scoring).

## Excluded skills

Frontend-specific (`datastar`, `datastar-tao`, `datastar-patterns`, `shadcn-forms`) — use the `frontend` outfit for that work.

## Excluded globals

- `swift-lsp` plugin — only useful for iOS work
- `frontend-design` and `frontend-design-codex` plugins — UI/UX layout, off-domain for backend-leaning engineering

`gopls-lsp` stays on (most engineering work here is Go-flavored). All MCPs (signoz / axiom / doppler) stay on — observability and secrets are engineering territory.

## Pairing

| With | When |
|---|---|
| `--cut executing` | active development against a known plan |
| `--cut debugging` | hunting a bug (re-adds context-mode + signoz/axiom MCPs) |
| `--cut planning` | designing before code |
| `--cut reviewing` | running the review checklist |
| `--accessory pr-policy` | recommended default — pins PR + local-CI discipline |
| `--accessory philosophy` | adds Norman + Vitaly + the architect-review agent |
| `--accessory subagent-heavy` | sessions that will spawn many agents (singleton `--accessory subagent-driven-development` works too) |

## Distinct from neighboring outfits

- **vs `code`**: `code` is light and language-agnostic; `engineer` is rigor-heavy and language-agnostic. Same range of projects, different demands.
- **vs `backend`**: `backend` adds Go-specific (`idiomatic-go`) + observability + deterministic-simulation-testing skills. `engineer` is the language-agnostic discipline floor that `backend` builds on.
- **vs `meta`**: `meta` is for wardrobe / suit / agent-skills authoring; `engineer` is for shipping software in general.
