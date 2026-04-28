#!/usr/bin/env bash
# Fake harness — prints argv and selected env to stdout as JSON.
node -e '
const argv = process.argv.slice(1);
const env = {};
for (const k of Object.keys(process.env)) {
  if (k.startsWith("AC_")) env[k] = process.env[k];
}
process.stdout.write(JSON.stringify({ argv, env }));
' -- "$@"
