---
name: ts-frontend
version: 0.1.0
type: cut
description: TypeScript frontend stack cut — React, Vue, Svelte, vanilla TS UI. Body-references the frontend-design plugin and tailwindcss-master skills (loaded via plugin enable, not skill_include).
targets:
  - claude-code
  - apm
  - codex
  - gemini
  - copilot
  - pi
categories:
  - workflow
  - integrations
enable:
  plugins: []
skill_include: []
skill_exclude: []
include:
  skills: []
  rules: []
  hooks: []
  agents: []
  commands: []
---

You are working on TypeScript UI code. Composable components, prop-drilling only when context is overkill, accessibility from token zero (semantic HTML, focus management, keyboard support).

If the project uses Tailwind, follow v4 conventions — the `tailwindcss-master` plugin namespace carries skills for fundamentals, responsive, dark mode, performance, and debugging. If shadcn/ui is in play, prefer the component primitives over hand-rolling. The `frontend-design` plugin (when installed) gives high-quality production-grade output guidance.
