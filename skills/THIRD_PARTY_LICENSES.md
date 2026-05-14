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
