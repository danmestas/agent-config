# Third-Party Licenses

This file records the upstream provenance and license terms for skills vendored from external repositories. New attributions are appended; nothing here is overwritten.

---

## mattpocock/skills

- **Source:** https://github.com/mattpocock/skills
- **License:** MIT
- **Copyright:** Copyright (c) 2026 Matt Pocock
- **Vendored skills (with `pocock-` prefix):**
  - `pocock-caveman` — from `skills/productivity/caveman/SKILL.md`
  - `pocock-handoff` — from `skills/productivity/handoff/SKILL.md`
  - `pocock-diagnose` — from `skills/engineering/diagnose/SKILL.md` (plus `scripts/hitl-loop.template.sh`)
  - `pocock-git-guardrails` — from `skills/misc/git-guardrails-claude-code/SKILL.md` (plus `scripts/block-dangerous-git.sh`)
  - `pocock-setup-pre-commit` — from `skills/misc/setup-pre-commit/SKILL.md`

Adaptations applied: rewrote frontmatter to the wardrobe schema (added `version`, `targets`, `type`, `category`; rewrote `description` into "Use when..." triggering form), renamed the skills with the `pocock-` prefix, and lightly neutralised first-person / personal-directory references. Body content is otherwise as-published upstream.

### MIT License Text

```
MIT License

Copyright (c) 2026 Matt Pocock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## obra/superpowers

- **Source:** https://github.com/obra/superpowers
- **License:** MIT
- **Copyright:** Copyright (c) 2025 Jesse Vincent
- **Vendored skills (refreshed 2026-05-14):**
  - `brainstorming/` — refreshed body from upstream
  - `dispatching-parallel-agents/` — refreshed body from upstream
  - `executing-plans/` — refreshed body from upstream
  - `receiving-code-review/` — refreshed body from upstream
  - `requesting-code-review/` — refreshed body from upstream
  - `subagent-driven-development/` — refreshed body from upstream
  - `systematic-debugging/` — refreshed body from upstream
  - `test-driven-development/` — refreshed body from upstream
  - `using-superpowers/` — new (vendored from upstream)
  - `verification-before-completion/` — refreshed body from upstream
  - `writing-plans/` — refreshed body from upstream
  - `writing-skills/` — new (vendored from upstream)

Adaptations applied: preserved wardrobe-schema YAML frontmatter (name, version, targets, type, category) on refreshed skills; bumped version 1.0.0 → 1.1.0 to mark the refresh. Two new skills (`using-superpowers`, `writing-skills`) were authored with the wardrobe schema. Performed a no-git scrub — replaced version-control-tool-specific terminology (worktrees, commits, PRs, push, branch, merge, rebase) with tool-agnostic equivalents (isolated work area, checkpoint, request review, publish, integrate) so skills work in harnesses without git. Two upstream skills (`using-git-worktrees`, `finishing-a-development-branch`) were intentionally dropped. Did NOT vendor the upstream skills' supporting files (templates, reference markdown, code samples) — only the SKILL.md bodies were refreshed.

### MIT License Text

```
MIT License

Copyright (c) 2025 Jesse Vincent

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## rtk-ai/rtk

- **Source:** https://github.com/rtk-ai/rtk
- **License:** Apache License 2.0
- **Upstream commit:** `3ba1634` (`dev-0.40.1-rc.222`)
- **Vendored components:**

  **Skills (under `skills/`, all prefixed with `rtk-`):**
  - `rtk-triage/SKILL.md` — from `.claude/skills/rtk-triage/SKILL.md`
  - `rtk-tdd/SKILL.md` — from `.claude/skills/rtk-tdd/SKILL.md`
  - `rtk-tdd-rust/SKILL.md` and `rtk-tdd-rust/references/testing-patterns.md` — from `.claude/skills/tdd-rust/`
  - `rtk-issue-triage/SKILL.md` and `rtk-issue-triage/templates/issue-comment.md` — from `.claude/skills/issue-triage/`
  - `rtk-pr-triage/SKILL.md` and `rtk-pr-triage/templates/review-comment.md` — from `.claude/skills/pr-triage/`
  - `rtk-pr-review/SKILL.md` — from `.claude/skills/pr-review/SKILL.md`
  - `rtk-security-guardian/SKILL.md` — from `.claude/skills/security-guardian/SKILL.md`
  - `rtk-code-simplifier/SKILL.md` — from `.claude/skills/code-simplifier/SKILL.md`
  - `rtk-design-patterns/SKILL.md` — from `.claude/skills/design-patterns/SKILL.md`
  - `rtk-performance/SKILL.md` — from `.claude/skills/performance/SKILL.md`
  - `rtk-ship/SKILL.md` — from `.claude/skills/ship/SKILL.md`
  - `rtk-repo-recap/SKILL.md` — from `.claude/skills/repo-recap/SKILL.md`

  **Agents (under `agents/`):**
  - `rtk-testing-specialist/AGENT.md` — from `.claude/agents/rtk-testing-specialist.md`
  - `rtk-rust-expert/AGENT.md` — from `.claude/agents/rust-rtk.md` (upstream name `rust-rtk` renamed to `rtk-rust-expert` for prefix consistency)

  **Hooks (under `hooks/`):**
  - `rtk-suggest/` (HOOK.md + `hooks/rtk-suggest.sh`) — from `.claude/hooks/rtk-suggest.sh`
  - `rtk-rewrite/` (HOOK.md + `hooks/rtk-rewrite.sh`) — from `.claude/hooks/rtk-rewrite.sh`
  - `rtk-pre-commit-format/` (HOOK.md + `hooks/rtk-pre-commit-format.sh`) — from `.claude/hooks/bash/pre-commit-format.sh`

Adaptations applied:
- **Renames for provenance**: every skill, agent, and hook was prefixed `rtk-` to make upstream provenance unambiguous. Components already prefixed (`rtk-triage`, `rtk-tdd`, `rtk-rewrite`, `rtk-suggest`, `rtk-testing-specialist`) kept their names. The upstream agent `rust-rtk` was renamed to `rtk-rust-expert` for prefix consistency. The upstream hook subdirectory script `bash/pre-commit-format.sh` was promoted to a top-level hook component named `rtk-pre-commit-format`.
- **Frontmatter**: rewrote upstream Anthropic-style skill spec (`name`, `description`, `allowed-tools`, `effort`, `tags`, `triggers`, `model`) into the wardrobe schema (`name`, `version`, `targets`, `type`, `category`, `license`). Hook frontmatter mapped to the wardrobe hook schema (`hooks:` block with event matchers + commands). Descriptions were rewritten into directive "Use when..." triggering form. All `category.primary` values are drawn from the wardrobe-validated set (workflow, backpressure, economy, etc.).
- **Cross-references**: internal references to upstream skill names (`/issue-triage`, `/pr-triage`, `/repo-recap`) were rewritten to their renamed equivalents (`/rtk-issue-triage`, `/rtk-pr-triage`, `/rtk-repo-recap`) inside `rtk-triage`, `rtk-issue-triage`, `rtk-pr-triage`, and `rtk-pr-review`. Template footers ("Triaged via … `/issue-triage`") were updated to the new names. The `code-reviewer` agent reference in `rtk-pr-triage` was left as-is — the wardrobe already provides an `agents/code-reviewer` component.
- **Hook scripts**: payload `.sh` files copied verbatim except for emoji removal in user-facing system messages (`⚡`, `🦀`, `🚀`, `✅`, `❌`) and the upstream "Generated with Claude Code" / "Co-Authored-By: Claude" trailers in template commit messages. No behavioural changes — `command -v rtk` graceful pass-through in `rtk-rewrite.sh` and the `rtk rewrite` exit-code protocol (0/1/2/3) are preserved intact.
- **Body content**: skill and agent bodies are largely as-published upstream, with light emoji stripping and AI-attribution trailers removed in keeping with wardrobe conventions. The full rtk-specific guidance (lazy_static regex, 60-90% token-savings assertions, fallback patterns, cross-platform shell escaping, security threat model) was preserved intact — it is the substance of the pack.

### Apache License 2.0 (excerpt)

```
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

Full Apache-2.0 license text is preserved at the upstream source: https://github.com/rtk-ai/rtk/blob/main/LICENSE
