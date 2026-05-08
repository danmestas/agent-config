---
name: bones-tooling
version: 0.1.0
type: cut
description: Bones tooling stack cut — for working ON the bones binary itself (Go + fossil + nats). Different from working IN a bones-instrumented project (use accessory bones for that).
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
  - tooling
enable:
  plugins: []
skill_include:
  - golang-patterns
skill_exclude: []
include:
  skills: []
  rules: []
  hooks: []
  agents: []
  commands: []
---

You are working on the bones source code. ADRs in `docs/adr/`. Strict fmt-check, vet, lint, race, todo-check via `make check`. Run CI commands locally before push (especially `go test -tags=otel -short ./...` per the project CI policy memory).
