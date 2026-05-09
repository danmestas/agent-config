---
name: pr-policy
version: 1.0.0
type: rules
description: Force PR-policy + local-CI rules — no direct commits to main, run CI locally before declaring PR ready.
targets: [claude-code, codex, gemini, copilot, pi]
category:
  primary: workflow
  secondary: [backpressure]
---

# PR Policy + Local CI

This rule enforces two paired workflow constraints: never commit or push directly to `main`/`master` (always feature-branch + PR), and never declare a PR "ready" until the equivalent CI checks have been run locally. Force-load via `--accessory pr-policy` on any session where the agent might otherwise take a shortcut on either rail.

## PR policy: never push directly to main

In almost all circumstances, do NOT commit or push changes directly to `main` (or `master`). Always:

1. Create a feature branch and open a PR for review.
2. Wait for me to merge manually — do not auto-merge.
3. After I confirm the merge, clean up artifacts: delete the local branch, delete the remote branch, prune stale refs, and remove any temporary worktrees or scratch files created for the change.

Exceptions are rare (e.g., I explicitly say "commit straight to main" or the repo has no `main` branch protection model). When in doubt, ask before pushing to `main`.

## CI policy: run it locally after every PR push

If a project has CI configured (look for `.github/workflows/`, `.gitlab-ci.yml`, `.circleci/`, `azure-pipelines.yml`, `Jenkinsfile`, etc.), do NOT consider a PR "ready" until I've run the equivalent checks locally and they pass.

After every push to a PR branch:

1. Identify what the CI runs (read the workflow files; common surface: `npm test`, `npm run validate`, `npm run typecheck`, `pytest`, `cargo test`, `go test ./...`, lint, build).
2. Run those same commands locally — replicate the matrix where feasible (e.g., the Node version CI uses). If a step relies on infra I can't reproduce locally (Docker images, deployed services), say so explicitly rather than skip silently.
3. If anything fails, fix it before reporting back. Do not declare the PR ready while local CI is red.
4. After remote CI runs, also check `gh pr checks <num>` (or the platform equivalent). Distinguish transient infra failures (registry timeouts, runner outages) from real failures — surface the distinction explicitly when reporting status.

This applies even when the PR description says "tests pass" — local skill tests are not the same as CI.
