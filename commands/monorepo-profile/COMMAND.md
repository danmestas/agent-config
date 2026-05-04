---
name: monorepo-profile
version: 1.0.0
targets: [claude-code]
type: command
description: Manage monorepo profiles. Subcommands: switch, status, validate, diff.
argument-hint: switch <name> | status | validate [name] | diff [name]
---

You are dispatching the `/profile` slash command.

The user invoked: `/profile $ARGUMENTS`

Run the following bash command, then paste its full stdout/stderr to the user verbatim. Do not interpret or rewrite the output.

```
node "${CLAUDE_PLUGIN_ROOT}/bin/mr-profile.mjs" $ARGUMENTS
```

If the command exits non-zero, surface the error message exactly as printed.
After a successful `switch`, the script prints a restart instruction — show it to the user prominently.
