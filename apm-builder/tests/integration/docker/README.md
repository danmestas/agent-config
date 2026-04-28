# Docker Test Matrix

End-to-end test scaffold that exercises `ac` against all 4 real harness CLIs inside a clean Docker environment.

## What it tests

5 scenarios × 4 harnesses = 20 scenarios total.

| # | Scenario | What it verifies |
|---|---|---|
| 01 | no-flags | `AC_WRAPPED=1` set; `AC_RESOLUTION_PATH` unset |
| 02 | persona-only | `--persona backend` sets a readable resolution JSON with `persona=backend` |
| 03 | mode-only | `--mode focused` sets resolution JSON with `mode=focused` and non-empty `mode_prompt` |
| 04 | persona-and-mode | Both persona and mode are reflected in the resolution JSON |
| 05 | no-filter | `--no-filter` bypasses resolution; `AC_RESOLUTION_PATH` unset |

Harnesses: `claude`, `codex`, `gemini`, `pi`.

If an API key env var is absent, all scenarios for that harness print `SKIP` (not `FAIL`).

## Build

Run from repo root so the Dockerfile can `COPY . /workspace`:

```bash
docker build \
  -f apm-builder/tests/integration/docker/Dockerfile \
  -t agent-config-test \
  .
```

Build time: ~3–5 min (npm installs 4 harness CLIs).  
No API keys are needed at build time.

## Run (full matrix)

```bash
docker run --rm \
  -e ANTHROPIC_API_KEY \
  -e OPENAI_API_KEY \
  -e GEMINI_API_KEY \
  agent-config-test
```

Env vars are forwarded from the host shell. Omit any key to skip that harness.

## Run (single harness)

```bash
docker run --rm -e ANTHROPIC_API_KEY agent-config-test claude
docker run --rm -e OPENAI_API_KEY agent-config-test codex
docker run --rm -e GEMINI_API_KEY agent-config-test gemini
docker run --rm -e ANTHROPIC_API_KEY agent-config-test pi
```

## Dry run (no API calls)

```bash
docker run --rm agent-config-test --dry-run
```

Prints the test plan without executing any scenarios or calling any APIs.

## Cost estimate

Scenarios use stub harness shims for env-plumbing tests — they do **not** call the LLM APIs.  
Estimated cost per full run with real API calls: **~$0.00** (stubs only; no real prompts sent).  
If you modify scenarios to use real harness invocations, budget ~$0.04 per full run.

## Harness auth notes

| Harness | Key var | Notes |
|---|---|---|
| Claude Code | `ANTHROPIC_API_KEY` | passed via env |
| Codex | `OPENAI_API_KEY` | `codex login` not needed when key is in env |
| Gemini CLI | `GEMINI_API_KEY` | passed via env |
| Pi | `ANTHROPIC_API_KEY` | same key as Claude; `--provider anthropic` implied |

## Running a single scenario script

Each scenario script is self-contained and accepts the harness name as `$1`:

```bash
bash apm-builder/tests/integration/docker/scenarios/02-persona-only.sh claude
```

Requires `tsx` and `ac.ts` on the expected paths (`/workspace/...` inside Docker,  
or adjust `WORKSPACE` env var for local runs).
