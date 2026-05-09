---
name: golang-patterns
version: 0.1.0
description: >-
  Use when writing, reviewing, or refactoring Go code. Triggers on .go files,
  go.mod presence, or any task involving Go programming — concurrency
  (goroutines, channels, context), interfaces, generics, error handling,
  table-driven testing, or microservice/CLI architecture. Pairs with the
  `golang-pro` agent, which delegates pattern detail here.
type: skill
targets:
  - claude-code
  - codex
  - gemini
  - pi
category:
  primary: backpressure
---

# Golang Patterns

Idiomatic Go reference pack — concurrency, interfaces, generics, testing,
project structure, plus the anti-patterns agents most commonly get wrong.
Two-thesis stack:

- **Clear is better than clever.** Boring, explicit, maintainable Go (Jon Bodner,
  *Learning Go*, 2nd ed.).
- **Production-grade by default.** Bounded goroutine lifetimes, context
  threading, race-detector-clean tests, gofmt + golangci-lint on every change.

## Reference Guide

Load detailed guidance based on context:

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Concurrency | `references/concurrency.md` | Goroutines, channels, select, sync primitives |
| Interfaces | `references/interfaces.md` | Interface design, io.Reader/Writer, composition |
| Generics | `references/generics.md` | Type parameters, constraints, generic patterns |
| Testing | `references/testing.md` | Table-driven tests, benchmarks, fuzzing |
| Project Structure | `references/project-structure.md` | Module layout, internal packages, go.mod |
| Idiomatic Go (anti-patterns) | `references/idiomatic-go.md` | Quick anti-pattern → idiomatic-fix tables, decision rules, agent-specific rationalization counters |

## Core Workflow

1. **Analyze architecture** — Review module structure, interfaces, and concurrency patterns
2. **Design interfaces** — Small, focused, defined at the consumer; composition over inheritance
3. **Implement** — Idiomatic Go with proper error handling and context propagation; run `go vet ./...` before proceeding
4. **Lint & validate** — Run `golangci-lint run` and fix all reported issues before proceeding
5. **Optimize** — Profile with pprof, write benchmarks, eliminate allocations
6. **Test** — Table-driven tests with `-race`, fuzzing, 80%+ coverage; race detector must pass before committing

## Core Pattern Example

Goroutine with context cancellation and error propagation:

```go
// worker runs until ctx is cancelled or an error occurs.
// Errors are returned via errCh; the caller must drain it.
func worker(ctx context.Context, jobs <-chan Job, errCh chan<- error) {
    for {
        select {
        case <-ctx.Done():
            errCh <- fmt.Errorf("worker cancelled: %w", ctx.Err())
            return
        case job, ok := <-jobs:
            if !ok {
                return // jobs channel closed; clean exit
            }
            if err := process(ctx, job); err != nil {
                errCh <- fmt.Errorf("process job %v: %w", job.ID, err)
                return
            }
        }
    }
}

func runPipeline(ctx context.Context, jobs []Job) error {
    ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
    defer cancel()

    jobCh := make(chan Job, len(jobs))
    errCh := make(chan error, 1)

    go worker(ctx, jobCh, errCh)

    for _, j := range jobs {
        jobCh <- j
    }
    close(jobCh)

    select {
    case err := <-errCh:
        return err
    case <-ctx.Done():
        return fmt.Errorf("pipeline timed out: %w", ctx.Err())
    }
}
```

Key properties: bounded goroutine lifetime via `ctx`, error propagation with
`%w`, no goroutine leak on cancellation.

## Constraints

### MUST DO
- Run gofmt and golangci-lint on all code
- Add `context.Context` as first param on all blocking operations
- Handle every error explicitly (no naked `_` discards without justification)
- Write table-driven tests with subtests
- Document all exported functions, types, and packages
- Use `X | Y` union constraints for generics (Go 1.18+)
- Propagate errors with `fmt.Errorf("...: %w", err)`
- Run race detector on tests (`-race` flag)

### MUST NOT DO
- Ignore errors (no `_ = thatMightFail()` without a comment)
- Use `panic` for normal error handling
- Spawn goroutines without a clear lifecycle
- Skip context cancellation handling
- Reach for reflection without a measured performance reason
- Mix sync and async patterns carelessly
- Hardcode configuration (functional options or env vars)

## Output Templates

When implementing Go features, provide:
1. Interface definitions (contracts first)
2. Implementation files with proper package structure
3. Test file with table-driven tests
4. Brief explanation of any concurrency patterns used

## Pairing

- **`golang-pro` agent** — broader architectural / DevOps coverage; delegates
  pattern detail here. Load both when active Go development is in scope.

## Provenance

Initial content adapted from
[jeffallan/claude-skills](https://github.com/jeffallan/claude-skills) (MIT,
`skills/golang-pro`) and the prior wardrobe `idiomatic-go` skill (Bodner-derived
anti-pattern tables, now at `references/idiomatic-go.md`). See [`LICENSES.md`](../../LICENSES.md).
