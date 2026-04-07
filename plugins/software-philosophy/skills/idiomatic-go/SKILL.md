---
name: idiomatic-go
description: Use when writing, reviewing, or refactoring Go code. Triggers on .go files, go.mod presence, or any task involving Go programming. Also use when reviewing Go code for idiomaticity, error handling, concurrency patterns, or interface design.
---

# Idiomatic Go

Principles from Jon Bodner's [Learning Go: An Idiomatic Approach to Real-World Go Programming](https://www.oreilly.com/library/view/learning-go/9781098139285/) (2nd edition, 2024). The central thesis: **write boring, explicit, maintainable Go — clarity over cleverness.**

This skill focuses on patterns agents most commonly get wrong.

## Anti-Patterns

### Error Handling

| Anti-Pattern | Idiomatic Go |
|---|---|
| Ignoring errors with `_` | Always handle. If truly ignorable, comment why |
| Bare `return err` without context | Wrap with `fmt.Errorf("doing X: %w", err)` |
| Panic for operational errors | Panic is for programmer bugs only. Return errors for anything recoverable |
| Sentinel errors everywhere | Prefer custom error types. Use `errors.Is`/`errors.As` for checking |

### Slices & Memory

| Anti-Pattern | Idiomatic Go |
|---|---|
| Appending to a sub-slice without understanding capacity | Use full slice expression `s[i:j:k]` to prevent overwrites |
| Returning a slice of a large backing array | Copy what you need — don't hold large arrays in memory |
| Using pointers "just in case" | Value semantics by default. Pointers only for mutation or large structs |

### Interfaces

| Anti-Pattern | Idiomatic Go |
|---|---|
| Declaring large interfaces upfront | Small interfaces (1-2 methods). Define at the consumer, not the implementer |
| `interface{}` / `any` as a crutch | Use generics or concrete types. `any` only at true boundaries |
| Returning interfaces from functions | Return concrete types, accept interfaces |

### Concurrency

| Anti-Pattern | Idiomatic Go |
|---|---|
| Goroutine without cancellation | Always pass `context.Context` as first param. Use `WithCancel`/`WithTimeout` |
| Shared mutable state by default | Channels first. `sync.Mutex` only when channels are awkward |
| Fire-and-forget goroutines | Always ensure goroutines can be waited on or cancelled. Prevent leaks |

### Design & Style

| Anti-Pattern | Idiomatic Go |
|---|---|
| Deep nesting | Early returns and guard clauses |
| Java-style class hierarchies | Composition via embedding. No "Base" structs |
| Constructor returning `*Thing` without validation | Use `NewThing()` constructor functions, validate all inputs, return `(*Thing, error)` |
| Reaching for third-party libs first | Standard library first: `net/http`, `encoding/json`, `context`, `io` |
| Clever concurrent solution for a simple problem | Sequential first. Only add goroutines when you've measured a bottleneck |

## Concurrency Rules

1. **`context.Context` is always the first parameter.** No exceptions. Thread it through every call chain.
2. **Every goroutine must have an exit strategy.** If you can't explain how it stops, don't start it.
3. **Channels for coordination, mutexes for state protection.** Don't use channels as locks or mutexes as signals.
4. **`select` with `ctx.Done()` in every blocking operation.** Never block without a cancellation path.
5. **Don't leak goroutines.** Use `errgroup` or `WaitGroup` to ensure all goroutines complete. Test with `-race`.

## Quick Reference — Go Decision Rules

| Decision | Rule |
|---|---|
| Pointer or value receiver? | Value unless you need mutation or struct is large |
| `:=` or `var`? | `:=` inside functions when type is clear. `var` for zero values or package-level |
| Custom error type or sentinel? | Custom type when caller needs fields. Sentinel only for well-known conditions like `io.EOF` |
| Generics or interface? | Generics when logic is identical across types. Interface when behaviors differ |
| Channel or mutex? | Channel for coordination/signaling. Mutex for protecting shared state |
| Named return or not? | Only for documenting meaning in short functions. Never for naked returns in long functions |

## Reasoning Flow

1. **Identify the task** — writing new Go code, reviewing existing, or refactoring?
2. **Scan for anti-patterns** — check code against the anti-patterns tables above
3. **Apply idiomatic alternative** — replace each anti-pattern with the table's recommendation
4. **Check concurrency rules** — if goroutines, channels, or context are involved, verify all 5 rules
5. **Consult decision rules** — for design choices (pointer vs value, channel vs mutex, etc.)
6. **Explain decisions** — reference Go's design rationale when the choice isn't obvious

## Common Mistakes

Agent rationalizations and their counters:

| Mistake | Fix |
|---|---|
| "I'll use `any` to keep it flexible" | Concrete types or generics. `any` discards the type system's help |
| "Pointer is always faster" | Pointers add GC pressure and indirection. Measure before assuming |
| "Let me add an interface for this" | Don't abstract until you have 2+ implementations. Accept interfaces, return structs |
| "This error can't happen" | Handle it or assert why with a comment |
| "I'll use `init()` for setup" | Explicit initialization in `main` or constructors. `init()` hides execution order |
| "Treating Go like Java/Python" | No classes, no exceptions, no implicit. Explicit is Go's whole point |
| "This needs goroutines for performance" | Sequential loop first. Goroutines add complexity. Measure before parallelizing |

## The Essence

> "Clear is better than clever." — Go Proverb
