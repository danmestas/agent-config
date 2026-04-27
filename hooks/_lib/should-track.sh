#!/usr/bin/env bash
# Bash port of apm-builder/lib/should-track.ts. Hooks call this at the top
# and bail early when tracking is disabled for the current cwd.
#
# Usage:
#   if ! should_track_project "$PWD"; then exit 0; fi

# shellcheck shell=bash

should_track_project() {
  local cwd="${1:-$PWD}"
  cwd="$(cd "${cwd}" 2>/dev/null && pwd -P || echo "${cwd}")"

  # Built-in default excludes.
  local defaults=(
    "/tmp"
    "/var"
    "/private/tmp"
    "/private/var"
    "${HOME}/.config"
    "${HOME}/Downloads"
    "${HOME}/Desktop"
    "${HOME}/Library/Caches"
  )

  local prefix
  for prefix in "${defaults[@]}"; do
    if [[ "${cwd}" == "${prefix}" || "${cwd}" == "${prefix}"/* ]]; then
      return 1
    fi
  done

  # Per-project + global JSON. We don't depend on jq; we look for any line in
  # `exclude.json` matching `"<prefix>"`. This is intentionally lenient — hooks
  # are fail-safe so a malformed file just means default behavior.
  local files=(
    "${cwd}/.agent-config/exclude.json"
    "${HOME}/.config/agent-config/exclude.json"
  )

  local file
  for file in "${files[@]}"; do
    [[ -f "${file}" ]] || continue
    while IFS= read -r line; do
      # Strip surrounding whitespace and JSON noise.
      local entry="${line//[\"\\,\[\]]/}"
      entry="${entry//[[:space:]]/}"
      [[ -z "${entry}" || "${entry}" == "exclude:" || "${entry}" == "{" || "${entry}" == "}" ]] && continue
      # Expand leading tilde.
      [[ "${entry}" == "~/"* ]] && entry="${HOME}/${entry#~/}"
      [[ "${entry}" == "~" ]] && entry="${HOME}"
      if [[ "${cwd}" == "${entry}" || "${cwd}" == "${entry}"/* ]]; then
        return 1
      fi
    done < "${file}"
  done

  return 0
}
