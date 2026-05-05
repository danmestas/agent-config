---
name: landing
version: 1.0.0
targets: [claude-code]
type: skill
description: Post-merge cleanup workflow. Discusses uncommitted worktree changes per-worktree before deleting; handles local + remote merged branches, stale refs, dist/ build artifacts, and surfaces today's memory entries for review. Use when the user wants to wrap up after merging a PR, clean up worktrees, tidy branches, do post-merge cleanup, "land the plane", "land", remove stale feature branches, or close out a development session.
category:
  primary: workflow
---

# Landing

Post-merge cleanup. Methodical taxi-in: inventory first, decide section-by-section, never destroy uncommitted work without an explicit per-worktree decision.

## When to use

- After a PR is merged and you want to delete the local + remote feature branch
- When `.worktrees/` has accumulated multiple stale checkouts
- At the end of a development session to clean up the working environment
- When the user says "land the plane", "clean up", "tidy worktrees", "wrap up after merge", or similar

## Workflow

Walk the user through cleanup in this order. Run the inventory first, then handle items section-by-section. Be terse — say what you're doing and ask only the questions that need an answer.

### 1. Inventory

Run these in one batch and present the results to the user as a single inventory block before doing anything destructive. Use absolute paths and don't assume cwd:

```bash
git worktree list
echo '---per-worktree status---'
for wt in $(git worktree list --porcelain | awk '/^worktree/ {print $2}' | grep -v "^$(git rev-parse --show-toplevel)$"); do
  echo "=== $wt ==="
  (cd "$wt" 2>/dev/null && git status --porcelain) || echo "(unable to enter)"
done
echo '---local merged branches (excluding main)---'
git branch --merged main 2>/dev/null | grep -vE '^\*|main$|master$'
echo '---remote merged feat/* branches---'
gh pr list --state merged --limit 50 --json headRefName,number --search "head:feat/" 2>/dev/null \
  | jq -r '.[] | select(.headRefName | startswith("feat/")) | "\(.headRefName) (#\(.number))"' \
  | head -20
echo '---remote refs to prune (dry-run)---'
git remote prune origin --dry-run 2>&1 | grep -E 'would prune|^ ' | head -20
echo '---dist/ size---'
[ -d dist ] && du -sh dist 2>/dev/null || echo "(no dist/)"
echo '---memory entries authored today---'
MEMDIR=$(find ~/.claude/projects -maxdepth 2 -name "memory" -type d -path "*$(basename "$(pwd)")*" 2>/dev/null | head -1)
if [ -n "$MEMDIR" ]; then
  find "$MEMDIR" -name '*.md' -mtime -1 -type f 2>/dev/null | grep -v MEMORY.md | head -10 \
    || echo "(no recent entries)"
else
  echo "(no project-specific memory dir found)"
fi
```

After the inventory runs, present a concise summary:

> **Inventory** (cleanup candidates):
> - Worktrees to consider: N (M dirty)
> - Local merged branches: N
> - Remote merged feat/* branches: N
> - Stale remote refs: N
> - dist/: <size> or absent
> - Today's memory entries: N (informational only)
>
> Proceed? (y/N)

If user says no/abort → stop. Otherwise continue to step 2.

### 2. Worktrees (per-worktree decisions)

For each non-main worktree from the inventory:

- **Clean** (per-worktree status was empty): announce "removing clean worktree at `<path>`" and run `git worktree remove <path>`. No prompt.
- **Dirty** (per-worktree status had output): STOP. Show the user:
  > Worktree at `<path>` has uncommitted changes:
  >
  > ```
  > <paste the porcelain output>
  > ```
  >
  > Options:
  > - **(s)** stash to a named stash (e.g. `pre-cleanup-<branch>`), then remove worktree
  > - **(c)** commit on the current branch, then remove worktree
  > - **(d)** delete losing changes (`git worktree remove --force`)
  > - **(k)** keep this worktree, skip cleanup
  > - **(q)** abort cleanup entirely
  >
  > Choice for `<path>`?

  Honor the user's per-worktree choice:
  - **s**: `(cd <path> && git stash push -m "pre-cleanup-$(git branch --show-current)")` then `git worktree remove <path>`
  - **c**: ask for a commit message; `(cd <path> && git add -A && git commit -m "<msg>")` then `git worktree remove <path>`
  - **d**: `git worktree remove --force <path>` (after confirming once more — destructive)
  - **k**: skip; note in final report
  - **q**: stop the whole flow, jump to step 6

### 3. Local + remote branches (batch confirm)

After worktrees are handled:

- List the local merged branches (excluding `main`/`master`). Ask: "Delete these N local branches? (y/N)" — single confirm, then `git branch -d <each>`. If `git branch -d` refuses any branch (unmerged commits), pause and ask user before `-D`.
- List the remote merged feat/* branches. Ask: "Delete these N remote branches? (y/N)" — single confirm, then `git push origin --delete <branch1> <branch2> ...` in one batch.
- After remote deletions: `git remote prune origin` (no prompt — implicit in the user's confirmation).

If either list is empty, skip its prompt.

### 4. dist/ directory

If `dist/` exists from the inventory, ask: "Remove `dist/` (size: X)? (y/N)". If yes, `rm -rf dist`.

### 5. Memory entries (informational only)

If the inventory found memory entries authored today: list them with paths. Tell the user:

> These memory entries were authored today. Review them at `<dir>` and prune any that are too narrow or session-specific. **I won't touch memory automatically.**

Do NOT delete or modify any memory file. Move on.

### 6. Final report

Run `git status` and `git worktree list`. Show the user:

> **Cleanup complete.**
>
> - Worktrees removed: N (kept: M)
> - Local branches deleted: N
> - Remote branches deleted: N
> - Stale refs pruned: N
> - dist/: removed / kept / absent
>
> ```
> <output of git status>
> ```

If anything was kept (dirty worktrees user opted to keep, etc.), list it explicitly so the user knows what's left.

## Composition with other skills

- **`bones-powers:finishing-a-bones-leaf`** — after fan-in + git push + PR merge, hand off to `land-the-plane` to clean up the feature branch and worktree.
- **`superpowers:finishing-a-development-branch`** — same handoff pattern for non-bones workflows.

## Safety rules

- **Never** delete a worktree with uncommitted changes without the user picking option (s/c/d) for that specific worktree.
- **Never** force-delete (`-D`) a local branch that isn't merged without explicit user confirmation for that branch.
- **Never** delete a remote branch that doesn't match `feat/*` (or is `main`/`master`).
- **Never** modify memory files. List only.
- If any step errors out, surface the error verbatim and ask the user before retrying or skipping.

## Tone

Terse. Don't narrate intent — just say what you're doing and ask the targeted question. Match the "land the plane" framing: end of flight, methodical taxi-in.
