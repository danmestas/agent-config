---
name: course-correct
description: Rewind a bad chunk of work by capturing what was tried + learned to a summary file, then telling the user how to rewind their session context per harness. Use when an approach has failed, work has gone down the wrong path, the agent went in circles, the user wants to undo recent decisions, or the user says "course correct", "rewind", "we went down the wrong path", "this isn't working start over", or "roll back what we just did". Captures session learnings without destroying git history or the working tree.
---

# Course correct

Bad path. Capture what was tried + learned, write the summary to disk, then tell the user how to rewind their session context. Does not modify git history or the working tree — files stay; the user manages git state separately if they want to discard them.

## When to use

- An approach has failed and circling back to a prior approach is the right call
- The agent's been going in circles on a problem and a clean restart would help
- The user wants to undo recent decisions but keep the learnings
- User says "course correct", "rewind", "we went down the wrong path", "start over from <point>", "this isn't working"

## Workflow

### 1. Reflect on the session

The agent reviews the recent session and answers internally:
- What was the goal at the rewind point?
- What approach(es) were tried?
- What didn't work and why?
- What concrete learnings should survive the rewind (so future-you doesn't re-tread the same dead-end)?

### 2. Inventory recent changes

```bash
echo '---recent commits on this branch---'
git log --oneline -20 "$(git merge-base HEAD main 2>/dev/null || echo HEAD~10)..HEAD" 2>/dev/null \
  || git log --oneline -10
echo '---uncommitted changes---'
git status --porcelain | head -20
echo '---files modified this session (uncommitted)---'
git diff --name-only HEAD 2>/dev/null | head -20
```

### 3. Draft the summary

Compose a draft summary covering:
- **Goal**: what we were trying to do
- **What was tried**: specific approaches, in order
- **Why it didn't work**: root causes if known, symptoms if not
- **Learnings**: things to remember next time
- **Suggested rewind point**: which conversation point or commit to fall back to

Show the draft to the user. Get explicit confirmation OR `$EDITOR` for editing.

If `$EDITOR` is unset, fall back to `vi`. Use a temp file:

```bash
TMPFILE=$(mktemp -t course-correct.XXXXXX.md)
cat > "$TMPFILE" <<EOF
# Course correction: <topic>

## Goal
...

## What was tried
...

## Why it didn't work
...

## Learnings
...

## Rewind point
...
EOF
${EDITOR:-vi} "$TMPFILE"
```

### 4. Save the summary

Write the final summary to `docs/course-corrections/YYYY-MM-DD-HH-MM-<topic>.md`. Topic is derived from the summary's title (slugified) or asked-for if absent.

```bash
mkdir -p docs/course-corrections
TOPIC=<slugified-from-title>
DEST="docs/course-corrections/$(date +%Y-%m-%d-%H-%M)-$TOPIC.md"
cp "$TMPFILE" "$DEST"
echo "Saved: $DEST"
```

Optionally `git add` the summary if the user wants it tracked. Don't commit automatically — let the user decide if course-correction artifacts belong in git history for this repo.

### 5. Tell the user how to rewind

Per harness:

- **Claude Code**: "Press Esc twice to rewind to a prior conversation point. Reference the summary at `<path>` to re-orient."
- **Codex / Gemini / Copilot CLI / Pi**: "These harnesses don't have a native rewind. Reference the summary at `<path>` going forward; treat the work above as discarded mentally. If you want a hard reset, exit the session and start a new one."

The skill prints the appropriate guidance based on detected harness (env vars: `CLAUDE_PROJECT_DIR`, `CODEX_HOME`, `GEMINI_CLI`, etc.). When in doubt, print the Claude Code instruction with a fallback note.

### 6. No git operations

`course-correct` does NOT run `git reset`, `git checkout`, `git stash`, or any other git mutation. The course correction is a documentation artifact, not a destructive operation.

If the user wants to discard uncommitted changes after the summary is saved:

```bash
git stash push -m "course-correct-$(date +%Y%m%d-%H%M)"  # safer
# OR
git checkout .  # destructive, prompt user
```

These are user-driven follow-up actions, not part of the skill's flow.

## Composition with other skills

- After invoking `course-correct`, the user typically restarts work with `flight-deck:takeoff` (fresh inventory) OR `superpowers:brainstorming` (if rethinking the design from scratch).
- If the dead-end happened during plan execution, `flight-deck:course-correct` saves the learnings; the user then revises the plan via `superpowers:writing-plans` and re-invokes execution.

## Safety rules

- **Never** modify git history (`git reset`, `git rebase`, `git checkout`).
- **Never** delete files from the working tree.
- **Never** invoke the harness's rewind mechanism for the user — that's their action.
- The summary is the artifact. Everything else is the user's call.

## Tone

Reflective, not panicky. The user is course-correcting deliberately; the skill should match that thoughtful tone. Concise but thorough on the "what was tried + learned" capture.
