# Changelog

The `agent-config` repo is a multi-harness component monorepo without a
single canonical version tag at the repo root. Components are released
through the `apm-builder` pipeline; sub-packages may carry their own tags
(e.g. `pikchr-generator@v0.2.0`).

This file tracks notable monorepo-level changes — adoption of new patterns,
harness adapter changes, taxonomy shifts. The format is loosely based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- 5 must-have subagents brought in from `wshobson/agents`.
- 6 claude-mem-inspired patterns: trace, recall, fail-safe, flat-line,
  `shouldTrackProject`, adapters+modes.
- 7 new Evolution skills: gap-detector, reflect, memorize, eval-runner,
  linter, stuck-detector, changelog.
- `career-interview` skill brought in from `agent-plugins`.
- `pikchr-generator@v0.2.0` sub-package release with idempotent release-tag
  pipeline.
