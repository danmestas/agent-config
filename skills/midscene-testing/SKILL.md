---
name: midscene-testing
description: Use when performing ad-hoc browser testing, smoke testing workflows, validating UI after frontend changes, or testing Datastar/HTMX/SSE reactive features that unit tests cannot cover. Also use when consolidating Midscene HTML reports into a single navigable document.
---

# Midscene Ad-Hoc Browser Testing

## Overview

Use Midscene's headless Puppeteer mode to smoke-test web application workflows through screenshot-driven browser automation. Each CLI call takes a screenshot, sends it to a vision model, and executes natural-language UI interactions. You act as the brain — deciding what to do next based on what you see.

**Requires:** The `browser-automation` skill for raw Midscene command reference. This skill covers the **testing methodology** on top of it.

## When to Use

- Smoke-testing multi-step workflows (login → create → edit → submit)
- Validating reactive UI features (SSE, Datastar, HTMX) that need a real browser
- Exploratory testing after a frontend change
- Verifying bug fixes visually before closing a ticket
- Testing form behaviors (double-submit, clear-on-success, validation)

## When NOT to Use

- Regression testing (write Puppeteer scripts instead — deterministic, no AI cost)
- Testing backend logic (use Go/unit tests)
- Testing static HTML rendering (use template render tests)

## Quick Reference

| Command | Purpose |
|---------|---------|
| `connect --url <url>` | Open page in headless Chrome (persistent session) |
| `act --prompt "..."` | Interact with page via natural language |
| `take_screenshot` | Capture current state |
| `close` | Shut down browser |

Every command requires env vars: `MIDSCENE_MODEL_API_KEY`, `MIDSCENE_MODEL_NAME`, `MIDSCENE_MODEL_BASE_URL`, `MIDSCENE_MODEL_FAMILY`.

## Testing Workflow

### 1. Setup

```bash
# Build and start the app server
make build && ./bin/server &

# Set env vars (inline on every command since shell state doesn't persist)
export MIDSCENE_VARS="MIDSCENE_MODEL_API_KEY=... MIDSCENE_MODEL_NAME=... MIDSCENE_MODEL_BASE_URL=... MIDSCENE_MODEL_FAMILY=..."
```

### 2. Connect and Verify

```bash
npx @midscene/web@1 connect --url http://localhost:3737/login
# Read the screenshot to verify page loaded before proceeding
```

### 3. Execute Workflow Steps

```bash
# Batch related actions into ONE act call
npx @midscene/web@1 act --prompt "fill email with 'user@example.com' and password with 'test', then click Sign In"

# Read screenshot after EVERY act — don't trust "task finished" message
# Navigate by URL when click-navigation fails
npx @midscene/web@1 act --prompt "navigate to http://localhost:3737/repair-orders/new"
```

### 4. Document Findings

After each step: record what worked, what broke, exact error text. At the end, compile a bug report with severity ratings.

### 5. Consolidate Reports

Midscene generates one HTML report per CLI call. Use `merge-reports.mjs` (included in this skill) to combine them into a single navigable document.

```bash
node merge-reports.mjs
open combined-report.html
```

## Hard-Won Lessons

| Lesson | Detail |
|--------|--------|
| **Always use Puppeteer mode** | CDP mode loses page context between CLI calls. Headless Puppeteer persists the session. |
| **Inline env vars on every command** | Shell state doesn't persist between Bash tool calls. |
| **Read every screenshot yourself** | Midscene's model sometimes reports "task finished" when nothing happened. |
| **Use URL navigation as fallback** | `act --prompt "navigate to <url>"` is more reliable than clicking JS-routed links. |
| **Batch form interactions** | "fill email, fill password, click submit" as one `act` — faster and more reliable than three. |
| **Be specific about UI targets** | "click the pencil edit icon on the Oil Filter row" not "click edit". |
| **Budget for API flakiness** | ~15% of commands fail with transient model errors. Just retry. |
| **Page navigation kills sessions** | Form submits that redirect will close the CDP page. Reconnect after. |

## What Midscene Can't Tell You

- Whether search requires Enter key vs. live filtering (read the source)
- Whether an empty result is "search is broken" vs. "no matching data" (check the DB)
- Whether a status button is stale vs. correct (understand the state machine)

Always supplement visual testing with source code reading for ambiguous results.

## Bug Classification

| Severity | Criteria | Example |
|----------|----------|---------|
| **HIGH** | Blocks a core workflow entirely | Search returns no results, dialog never loads |
| **MEDIUM** | Workflow completes but with errors or wrong state | Status button stale after payment, error page with no nav |
| **LOW** | Cosmetic or minor UX issue | Double-submit creates duplicates, input not cleared |

## Report Consolidation

Midscene generates `~2MB` HTML reports per command (mostly React boilerplate). The merge script:
- Discards failed reports (black screen, session errors)
- Keeps one copy of the React UI boilerplate
- Collects all action data and deduplicates images
- Injects step names into `playwright_test_title` HTML attributes for the dropdown

Run from the `midscene_run/` directory where reports are generated. See `merge-reports.mjs` in this skill directory.
