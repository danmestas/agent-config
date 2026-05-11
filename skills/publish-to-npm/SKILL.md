---
name: publish-to-npm
version: 1.0.0
targets: [claude-code]
type: skill
description: Publish a new package to npm under an existing scope, with GitHub Actions release automation, provenance attestations, and a path to trusted publishing (OIDC). Use when the operator says "publish this to npm", "push this package", "release v0.x", "set up CI for npm publishing", "set up trusted publishing", or "ship this as an npm package". Pairs with `doppler` skill when the npm token lives there.
category:
  primary: workflow
---

# Publish a new project to npm

End-to-end recipe for getting a new package onto npm under an existing scope with publishing automation. Pulls together everything that has historically tripped up first-time setup: the npm 2FA dance, gitignore pitfalls, bin-path normalization, OIDC trusted publishing.

## When to use

- First publish of a brand-new package
- Adding npm distribution to an existing project that's never shipped
- Setting up GitHub Actions to publish on tag-push
- Migrating from token-based publishing to trusted publishing (OIDC)

Not for: bumping a version of an already-published package — that's just `npm version patch && git push --follow-tags` once the workflow is in place.

## Prerequisites

- The scope exists on npm (e.g., `@agent-ops` — verify via `npm view @agent-ops/<some-existing-pkg>`)
- The operator has publish rights to the scope
- `gh` CLI is authenticated (`gh auth status`)
- `npm` CLI is authenticated (`npm whoami` returns the operator's username; if not, `npm login --auth-type=web`)
- The repo is local-only or already pushed to a public GitHub remote
- A LICENSE file exists in the repo (Apache 2.0 / MIT / whatever the project uses)

## The flow at a glance

```
1. Scaffold package.json + scripts/
2. Verify package layout — npm pack --dry-run
3. Run npm pkg fix — normalize bin paths
4. Create GitHub repo if needed
5. Commit + push
6. Set up NPM_TOKEN as GH Actions secret (token bridge)
7. Write the release workflow
8. Tag and publish v0.x.0
9. Configure trusted publishing (eliminates token)
10. Strip token from workflow, delete the secret
```

## 1. Scaffold `package.json`

For a scoped package shipping shell binaries + Claude Code skills/hooks (the orch shape):

```json
{
  "name": "@scope/name",
  "version": "0.1.0",
  "description": "One-line description.",
  "license": "Apache-2.0",
  "author": "Author Name",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/owner/repo.git"
  },
  "homepage": "https://github.com/owner/repo",
  "bugs": { "url": "https://github.com/owner/repo/issues" },
  "engines": { "node": ">=18" },
  "bin": {
    "binary-name": "bin/binary-name"
  },
  "files": ["bin/", "hooks/", "skills/", "scripts/", "LICENSE", "README.md"],
  "scripts": {
    "postinstall": "node scripts/postinstall.js",
    "preuninstall": "node scripts/preuninstall.js"
  }
}
```

**Important:** bin values must NOT start with `./`. If they do, `npm publish` emits the misleading warning "script name X was invalid and removed" (even though they're still packed). Use `bin/X`, not `./bin/X`. Run `npm pkg fix` to auto-normalize.

## 2. postinstall + preuninstall scripts

If the package ships skills or hooks that need to live in `~/.claude/skills/` or `~/.claude/hooks/`, write `scripts/postinstall.js` to symlink them. Refuse to overwrite real files; only replace existing symlinks. Print a clear "do this manual step" line for anything you can't auto-wire (typically `settings.json` merging).

Ship a fallback binary (e.g., `<name>-setup`) that re-runs the postinstall logic, for users who ran `npm install --ignore-scripts`.

`scripts/preuninstall.js`: sweep only symlinks whose target resolves back to the package install dir. Never touch real files.

## 3. Verify the layout

```bash
npm pack --dry-run
```

Read the output. Confirm:

- `name`, `version`, file count look right
- No surprise files (e.g., dotfiles you didn't intend)
- No `harness was invalid and removed` warnings (run `npm pkg fix` if they appear)
- Total size is sensible (< a few MB for tooling packages)

## 4. Create the GitHub repo

If the repo isn't on GitHub yet:

```bash
gh repo create owner/name \
    --public \
    --source=. \
    --remote=origin \
    --push \
    --description "..."
```

`--public` and `--private` are mutually exclusive. Push lands the initial commit on the default branch.

## 5. Gitignore audit

Inheriting `.gitignore` from another project can silently drop critical files. Verify these are NOT excluded:

- `.github/` (workflow files live here)
- `scripts/` (postinstall lives here)
- `package.json`
- `LICENSE`, `README.md`

After fixing `.gitignore`, run `git status` and confirm everything you expect to be tracked is shown.

## 6. Set up NPM_TOKEN secret (bridge)

For the first publish (before trusted publishing is configured), CI needs a token. Two token types:

- **Classic Automation Token** — bypasses 2FA regardless of account mode. Scope is whole-account (no per-package restriction). No expiry by default.
- **Granular Access Token** — per-package scope, expiring. Bypasses 2FA only when account 2FA is set to "Authorization only", NOT "Authorization and writes."

For first-publish CI, Classic Automation works without 2FA-mode wrangling. Generate on npmjs.com → Access Tokens → Generate New Token → Classic Token → Automation type.

Store in GitHub:

```bash
gh secret set NPM_TOKEN --repo owner/name
# prompts for value; paste the token
```

Also store in doppler for local CLI work (token rotation, trust admin, ad-hoc publishes):

```bash
doppler secrets set NPM_TOKEN --project global --config prd
# prompts interactively; paste same token
```

## 7. The release workflow

Write `.github/workflows/release.yml`:

```yaml
name: release

on:
  push:
    tags: ['v*']
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'Dry-run only (npm pack, no publish)'
        type: boolean
        default: false

permissions:
  id-token: write       # OIDC — enables trusted publishing when npmjs side is configured
  contents: read

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - name: Verify package contents
        run: npm pack --dry-run

      # NODE_AUTH_TOKEN is the bridge: npm CLI prefers OIDC when trusted
      # publishing is set up on the npmjs side; falls back to the token
      # otherwise. Drop both env blocks when trust is confirmed working.
      - name: Publish (dry-run)
        if: ${{ inputs.dry_run == true }}
        run: npm publish --dry-run --access public --provenance
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Publish
        if: ${{ inputs.dry_run != true }}
        run: npm publish --access public --provenance
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Critical bits:

- **`id-token: write`** is the OIDC enabler. Required for trusted publishing AND for `--provenance` attestations to be cryptographically tied to GitHub Actions.
- **`--access public`** is required for scoped packages — without it, scoped publishes default to private (a paid feature).
- **`--provenance`** attaches a signed SLSA attestation. Free with `id-token: write`. Always include it.
- **`workflow_dispatch` with dry_run** lets the operator manually test the workflow without pushing a tag — surfaces auth issues before committing to a real version number.

Commit + push. Verify the workflow registered:

```bash
gh workflow list --repo owner/name
```

## 8. First publish

```bash
# Dry-run first via workflow_dispatch:
gh workflow run release.yml --repo owner/name -f dry_run=true
gh run list --workflow=release.yml --repo owner/name --limit 1
gh run watch <run-id>
```

If dry-run succeeds, tag and push for the real publish:

```bash
git tag -a v0.1.0 -m "v0.1.0 — initial release"
git push origin v0.1.0
```

The tag push triggers the workflow. Watch:

```bash
gh run list --workflow=release.yml --repo owner/name --limit 1
```

After it completes, verify:

```bash
npm view @scope/name
npm view @scope/name dist  # check provenance + signatures
```

`dist.attestations.provenance.predicateType` should be `https://slsa.dev/provenance/v1`. That confirms the signed attestation is attached.

## 9. Configure trusted publishing (eliminate the token)

Now that the package exists on npm, you can configure trusted publishing on its settings page.

**Via CLI** (preferred — bypasses some UI friction):

```bash
npm trust github @scope/name \
    --repo owner/name \
    --file release.yml \
    --yes
```

Requires interactive 2FA. The browser auth URL appears in plain text only when run from the operator's own terminal (not when an automation tool wraps `npm`).

**Via web UI** (alternative): https://www.npmjs.com/package/@scope/name/access → Trusted Publishers section → Add Trusted Publisher → GitHub Actions → fill `owner` / `repo` / `release.yml` / blank environment → Save.

**Verify:**

```bash
npm trust list @scope/name
```

Output should show the GitHub repo + workflow filename. If empty, the trust registration didn't persist — re-run `npm trust github ...`.

## 10. Drop the token

Edit `.github/workflows/release.yml`: remove the `env: NODE_AUTH_TOKEN` blocks from both publish steps. The workflow now:

```yaml
      - name: Publish
        if: ${{ inputs.dry_run != true }}
        run: npm publish --access public --provenance
```

`id-token: write` permission is what makes OIDC work; npm CLI auto-detects and uses it.

Bump version (test the trust path), tag, push, watch:

```bash
# bump in package.json from 0.1.0 to 0.1.1
git commit -am "v0.1.1 — switch to npm trusted publishing (OIDC)"
git tag -a v0.1.1 -m "v0.1.1"
git push origin main v0.1.1
```

After it publishes successfully via OIDC, delete the GH secret:

```bash
gh secret delete NPM_TOKEN --repo owner/name
```

Token in doppler is fine to keep — useful for local admin work, token rotation, etc. — but the GH side no longer needs it.

## Common failure modes

### `npm publish` warning: "bin[X] script name X was invalid and removed"

**Cause:** bin values start with `./`. The warning is misleading — they ARE still packed — but it's noise.
**Fix:** `npm pkg fix` (normalizes `./bin/X` → `bin/X`).

### `EOTP` on every npm op

**Cause:** Account's 2FA is set to "Authorization and writes", requiring OTP for both auth and write operations.
**Fix during token-bridge phase:** use a Classic Automation Token (bypasses 2FA-on-writes). Granular Access Tokens do NOT bypass auth-and-writes mode — only Classic Automation Tokens do.
**Permanent fix:** trusted publishing (no token needed at all).

### `404 PUT` from CI publish (token-bridge phase)

**Cause:** npm returns 404 on unauthorized PUT. Most common reasons:
- Token expired or was revoked
- Token doesn't have publish scope for this package
- Package name collision (typo in scope/name)

**Fix:** regenerate the token, update both GH secret and doppler value, retry.

### `404 PUT` from CI publish (trusted-publishing phase)

**Cause:** OIDC token rejected by npm — trust relationship not configured, or workflow filename / repo / ref doesn't match the trust config.
**Fix:** `npm trust list <package>` (with operator 2FA) to see what's actually registered. Compare to the workflow's filename/repo. Revoke and re-add if mismatched.

### `403 Forbidden` on `npm trust list`

**Cause:** The token in use has publish scope but NOT package-management scope. Classic Automation Tokens are publish-only.
**Fix:** for trust admin, use either (a) interactive 2FA via `npm login --auth-type=web`, or (b) a Granular Access Token with "Read and write" on package settings.

### Workflow file not in `.github/`

**Cause:** Inherited `.gitignore` excludes `.github/`.
**Fix:** Edit `.gitignore`, remove the line, `git add -f .github/` if already gitignored.

### `scripts/` directory missing after first push

**Cause:** Inherited `.gitignore` excludes `scripts/`.
**Fix:** Same as above. Verify with `gh api repos/owner/name/contents/scripts` — should return the file list.

### "Trust registration didn't persist" (npm trust list returns empty)

**Cause:** The browser 2FA tap on `npm trust github` didn't complete, or the user pasted a stale OTP, or the workflow filename was misspelled.
**Fix:** Re-run `npm trust github @scope/name --repo owner/name --file release.yml --yes`, watch for the browser flow, confirm in the npmjs.com web UI afterward.

## Token rotation flow

When cycling NPM_TOKEN (Classic Automation Token typical lifespan: every 6–12 months):

```bash
# 1. Generate new token on npmjs.com. Requires interactive 2FA tap.

# 2. Update doppler (single source of truth):
doppler secrets set NPM_TOKEN --project global --config prd

# 3. Mirror to GitHub Actions (until trusted publishing eliminates the secret):
gh secret set NPM_TOKEN --repo owner/name \
    --body "$(doppler secrets get NPM_TOKEN --project global --config prd --plain)"

# 4. Test via dry-run:
gh workflow run release.yml --repo owner/name -f dry_run=true

# 5. Revoke old token on npmjs.com.
```

If trusted publishing is fully set up: there's nothing to rotate. OIDC tokens are ephemeral, signed per-run, expired automatically.

## Tool output redaction caveat

When an LLM tool wrapper runs `npm` commands and prints output, browser-auth URLs that look token-shaped (`https://www.npmjs.com/auth/cli/<long-id>`) often get redacted to `***`. The URL is fine in the operator's own terminal output. Workaround: have the operator run interactive npm commands themselves (with `!` prefix in Claude Code, or directly in their shell). Once trusted publishing is set up, this caveat stops mattering — no more browser auths needed.

## Sanity checks before declaring done

- [ ] `npm view @scope/name versions` shows the version you just published
- [ ] `npm view @scope/name dist` shows `attestations.provenance.predicateType` = `https://slsa.dev/provenance/v1`
- [ ] `npm trust list @scope/name` shows the GitHub trust relationship (if trusted publishing is set up)
- [ ] The workflow ran with `id-token: write` permission (check GH Actions log for the OIDC token request line if curious)
- [ ] `gh secret list --repo owner/name` no longer shows `NPM_TOKEN` (once trust is verified)

## When NOT to use this skill

- Bumping a patch version on an already-published, already-CI'd package: just `npm version patch && git push --follow-tags`
- Publishing under a brand-new scope that doesn't exist yet: scope creation is a separate npmjs.com setup step (org or user-scope must exist first)
- Private packages: the `--access public` flag flips; you also need a paid npm account
- Publishing to a private registry: registry URL changes throughout; the OIDC trust flow is npmjs.com-specific
