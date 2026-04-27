// Claude Code harness adapter. Parses the hook envelope Claude Code sends on
// stdin and produces the `{hookSpecificOutput: {...}}` shape it expects on
// stdout. The shape comes straight from the Claude Code hook protocol; see
// docs/anthropic for the source of truth.

import type {
  HarnessAdapter,
  NormalizedHookInput,
  NormalizedHookOutput,
} from './types.ts';

interface ClaudeCodeRawInput {
  hook_event_name?: string;
  session_id?: string;
  cwd?: string;
  tool_name?: string;
  tool_input?: unknown;
  tool_response?: unknown;
  transcript_path?: string;
}

export const claudeCodeHarnessAdapter: HarnessAdapter = {
  name: 'claude-code',

  normalizeInput(raw: string): NormalizedHookInput {
    let parsed: ClaudeCodeRawInput;
    try {
      parsed = JSON.parse(raw) as ClaudeCodeRawInput;
    } catch {
      parsed = {};
    }
    return {
      event: parsed.hook_event_name ?? 'unknown',
      sessionId: parsed.session_id ?? 'unknown',
      cwd: parsed.cwd ?? process.cwd(),
      tool: parsed.tool_name,
      toolInput: parsed.tool_input,
      toolResponse: parsed.tool_response,
      extras: parsed.transcript_path ? { transcriptPath: parsed.transcript_path } : undefined,
    };
  },

  formatOutput(out: NormalizedHookOutput): string {
    const envelope: Record<string, unknown> = {};
    if (out.continue !== undefined) envelope['continue'] = out.continue;
    if (out.suppressOutput !== undefined) envelope['suppressOutput'] = out.suppressOutput;
    if (out.additionalContext) {
      envelope['hookSpecificOutput'] = {
        hookEventName: 'SessionStart',
        additionalContext: out.additionalContext,
      };
    }
    if (out.payload) Object.assign(envelope, out.payload);
    return JSON.stringify(envelope);
  },
};
