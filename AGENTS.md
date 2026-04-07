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

No build system is required by default.
- If validation tooling is added, document commands here (e.g., `make lint`, `make test`).

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
