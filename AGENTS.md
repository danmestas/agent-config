<INSTRUCTIONS>
# Repository Guidelines

This repository is a Claude Code plugin marketplace. Each plugin in `plugins/` is independently installable and contains skills (instructions + optional scripts) for AI coding agents.

## Project Structure

- `.claude-plugin/marketplace.json`: Plugin registry
- `plugins/<plugin-name>/`: Individual plugins
  - `.claude-plugin/plugin.json`: Plugin manifest (required)
  - `skills/<skill-name>/SKILL.md`: Skill instructions (required per skill)
  - `skills/<skill-name>/scripts/`: Helper scripts (optional)
  - `skills/<skill-name>/references/`: Reference docs (optional)
  - `skills/<skill-name>/templates/`: Templates (optional)
  - `skills/<skill-name>/tests/`: Tests (optional)
  - `commands/`: Slash commands (optional)
  - `.mcp.json`: MCP server config (optional)
  - `README.md`: Plugin documentation

## Naming Conventions

- Plugins: `kebab-case` directory names
- Skills: `kebab-case` directory names
- Scripts: `kebab-case` filenames

## Plugin Manifest Rules

- `name`: kebab-case string
- `version`: string (e.g. "1.0.0"), not a number
- `author`: object `{ "name": "...", "email": "..." }`, not a string
- `keywords`: array of strings
- Do NOT include `agents`, `skills`, or `slashCommands` fields — these are auto-discovered

## Commit Guidelines

Use clear, imperative commit messages. PRs should include a short description and how to validate.

## Security

Never commit credentials or tokens. Use placeholders in skill docs.
</INSTRUCTIONS>
