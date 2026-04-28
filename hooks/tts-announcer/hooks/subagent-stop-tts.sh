#!/usr/bin/env bash
# Claude Code SubagentStop hook — announces which agent finished, what it was
# working on, and in which project. Correlates the subagent's transcript back
# to the parent's Agent tool_use to recover `description` and `subagent_type`,
# reads `cwd` from the parent for the project name, and uses a per-project
# voice (first time → random pick, then stable).
set -u
# Fail-safe per CONVENTIONS.md: trap unhandled errors and exit 0 always.
trap 'echo "[tts subagent-stop] hook error at line $LINENO" >&2; exit 0' ERR
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

payload="$(cat)"
transcript="$(echo "$payload" | jq -r '.transcript_path // empty')"
[[ -z "$transcript" || ! -f "$transcript" ]] && exit 0

# Subagent id = filename minus 'agent-' prefix and '.jsonl' suffix
agent_id="$(basename "$transcript" .jsonl)"
agent_id="${agent_id#agent-}"

# Parent transcript is the sibling .jsonl of the session dir containing subagents/
session_dir="$(dirname "$(dirname "$transcript")")"
parent_transcript="${session_dir}.jsonl"

agent_type=""
description=""
project=""

if [[ -f "$parent_transcript" ]]; then
  cwd="$(jq -r 'select(.cwd != null) | .cwd' "$parent_transcript" 2>/dev/null | head -1)"
  [[ -n "$cwd" ]] && project="$(basename "$cwd")"

  if [[ -n "$agent_id" ]]; then
    # Parent logs a user turn with toolUseResult.agentId === subagent id.
    # That turn also carries the tool_use_id, which we use to find the original
    # Agent tool_use and pull its description + subagent_type.
    tool_use_id="$(jq -r --arg id "$agent_id" '
      select(.type=="user" and (.toolUseResult?.agentId // "") == $id)
      | .message.content[]? | select(.type=="tool_result") | .tool_use_id
    ' "$parent_transcript" 2>/dev/null | head -1)"

    if [[ -n "$tool_use_id" ]]; then
      pair="$(jq -c --arg tid "$tool_use_id" '
        select(.type=="assistant")
        | .message.content[]?
        | select(.type=="tool_use" and .name=="Agent" and .id==$tid)
        | {desc: (.input.description // ""), type: (.input.subagent_type // "")}
      ' "$parent_transcript" 2>/dev/null | head -1)"
      agent_type="$(echo "$pair"  | jq -r '.type // ""')"
      description="$(echo "$pair" | jq -r '.desc // ""')"
    fi

    # Fallback: grab agentType from the tool_result if the tool_use lookup missed
    if [[ -z "$agent_type" ]]; then
      agent_type="$(jq -r --arg id "$agent_id" '
        select(.type=="user" and (.toolUseResult?.agentId // "") == $id)
        | .toolUseResult.agentType // empty
      ' "$parent_transcript" 2>/dev/null | head -1)"
    fi
  fi
fi

# If parent transcript didn't yield a project name, fall back to the
# subagent's own transcript (it carries `cwd` too).
if [[ -z "$project" && -f "$transcript" ]]; then
  cwd="$(jq -r 'select(.cwd != null) | .cwd' "$transcript" 2>/dev/null | head -1)"
  [[ -n "$cwd" ]] && project="$(basename "$cwd")"
fi

voice="$(get_voice_for_project "$project")"
agent_type_spoken="${agent_type//-/ }"
project_prefix=""
[[ -n "$project" ]] && project_prefix="In $project, "

if [[ -n "$agent_type_spoken" && -n "$description" ]]; then
  text="${project_prefix}the $agent_type_spoken agent finished: $description."
elif [[ -n "$description" ]]; then
  text="${project_prefix}a subagent finished: $description."
elif [[ -n "$agent_type_spoken" ]]; then
  text="${project_prefix}the $agent_type_spoken agent finished."
elif [[ -n "$project" ]]; then
  text="Subagent finished in $project."
else
  text="A subagent just finished."
fi

speak "$voice" "$text" /tmp/claude-tts-subagent.mp3
exit 0
