---
name: infra-cloudflare
version: 0.1.0
type: cut
description: Cloudflare infrastructure stack cut — Workers, Pages, R2, D1, KV, Queues, Durable Objects, Workflows. Body-references the cloudflare plugin namespace skills (loaded via plugin enable, not skill_include).
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
skill_include: []
skill_exclude: []
include:
  skills: []
  rules: []
  hooks: []
  agents: []
  commands: []
---

You are working on Cloudflare infrastructure. Wrangler is the only deploy mechanism; manual dashboard edits are not allowed in checked-in projects. Workers are stateless by default; reach for Durable Objects only when coordination is the actual requirement. R2 for blobs, D1 for SQL, KV for small key-value, Queues for async. Bindings declared in wrangler.jsonc.

The `cloudflare:` plugin namespace carries comprehensive skills: `cloudflare:cloudflare` (platform overview), `cloudflare:wrangler` (CLI), `cloudflare:workers-best-practices` (production patterns), `cloudflare:durable-objects`, `cloudflare:agents-sdk`, `cloudflare:cloudflare-email-service`, `cloudflare:sandbox-sdk`, `cloudflare:web-perf`. Load via plugin enable when working in this stack.
