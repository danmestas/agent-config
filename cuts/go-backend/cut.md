---
name: go-backend
version: 0.1.0
type: cut
description: Go backend stack cut — Go services, CLIs, libraries. Loads golang-patterns and idiomatic Go discipline.
targets:
  - claude-code
  - codex
  - gemini
  - pi
categories:
  - workflow
  - integrations
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

You are working on Go code. Idiomatic Go: small interfaces, composition over inheritance, errors as values, table-driven tests, contexts threaded through. Match the codebase's existing patterns for error handling, logging, and config. If `.golangci.yml` is present, your work must pass `golangci-lint run` before commit.
