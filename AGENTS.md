<INSTRUCTIONS>
# Repository Guidelines

This repository hosts agent skills (instructions + optional scripts) for AI coding agents. Keep this guide updated as the repo grows.

## Project Structure & Module Organization

Expected layout:
- `skills/`: individual skills, one folder per skill
  - `skills/<skill-name>/SKILL.md`: required instructions
  - `skills/<skill-name>/scripts/`: optional helper scripts
  - `skills/<skill-name>/references/`: optional reference docs
- `scripts/`: repo-level helper scripts (optional)
- `tests/`: any validation tests for skills (optional)

## Build, Test, and Development Commands

Validation and packaging are handled through `@agent-ops/suit` via npm scripts:
- `npm run validate`: validate the repository configuration
- `npm run build`: build generated artifacts
- `npm run watch`: run the build in watch mode
- `npm run docs`: generate documentation artifacts
- `npm run evolve`: run suit evolution tooling
- `npm run init`: initialize suit configuration

This repository intentionally does not track a package lockfile. The scripts use `npx -y -p @agent-ops/suit` so contributors run the current published suit tooling unless a future change pins the toolchain.

## Coding Style & Naming Conventions

Use 2 spaces for indentation unless the chosen language dictates otherwise.
Naming:
- Skills: `kebab-case` directory names
- Scripts: `kebab-case` filenames
- References: `kebab-case` filenames or keep upstream naming

## Testing Guidelines

Add tests only if automated validation is introduced. Document how to run them here.

## Commit & Pull Request Guidelines

Use clear, imperative commit messages (e.g., "Add Atlassian CLI Jira skill").
PRs should include:
- A short description of the skill or update
- Any new dependencies or tooling
- How to validate the change (if applicable)

## Security & Configuration Tips

Never commit credentials or tokens. Use placeholders in skill docs.
</INSTRUCTIONS>
