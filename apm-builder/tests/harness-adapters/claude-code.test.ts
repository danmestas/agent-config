import { describe, it, expect } from 'vitest';
import { claudeCodeHarnessAdapter } from '../../lib/harness-adapters/claude-code.ts';
import { detectHarness, getHarnessAdapter } from '../../lib/harness-adapters/index.ts';

describe('claudeCodeHarnessAdapter', () => {
  it('normalizes a PostToolUse envelope', () => {
    const raw = JSON.stringify({
      hook_event_name: 'PostToolUse',
      session_id: 'abc-123',
      cwd: '/tmp/repo',
      tool_name: 'Bash',
      tool_input: { command: 'npm test' },
      tool_response: { is_error: false },
      transcript_path: '/tmp/transcript.jsonl',
    });
    const normalized = claudeCodeHarnessAdapter.normalizeInput(raw);
    expect(normalized.event).toBe('PostToolUse');
    expect(normalized.sessionId).toBe('abc-123');
    expect(normalized.cwd).toBe('/tmp/repo');
    expect(normalized.tool).toBe('Bash');
    expect(normalized.toolInput).toEqual({ command: 'npm test' });
    expect(normalized.toolResponse).toEqual({ is_error: false });
    expect(normalized.extras?.['transcriptPath']).toBe('/tmp/transcript.jsonl');
  });

  it('produces sensible defaults on malformed input', () => {
    const normalized = claudeCodeHarnessAdapter.normalizeInput('not-json');
    expect(normalized.event).toBe('unknown');
    expect(normalized.sessionId).toBe('unknown');
    expect(typeof normalized.cwd).toBe('string');
  });

  it('formats SessionStart additionalContext into hookSpecificOutput', () => {
    const out = claudeCodeHarnessAdapter.formatOutput({
      additionalContext: '## Recent\n**M-001** foo',
      continue: true,
    });
    const parsed = JSON.parse(out) as Record<string, unknown>;
    expect(parsed['continue']).toBe(true);
    expect(parsed['hookSpecificOutput']).toEqual({
      hookEventName: 'SessionStart',
      additionalContext: '## Recent\n**M-001** foo',
    });
  });

  it('round-trips a minimal envelope', () => {
    const raw = JSON.stringify({
      hook_event_name: 'SessionStart',
      session_id: 's1',
      cwd: '/tmp/x',
    });
    const normalized = claudeCodeHarnessAdapter.normalizeInput(raw);
    const formatted = claudeCodeHarnessAdapter.formatOutput({
      continue: true,
      suppressOutput: true,
    });
    const parsed = JSON.parse(formatted) as Record<string, unknown>;
    expect(normalized.event).toBe('SessionStart');
    expect(parsed['continue']).toBe(true);
    expect(parsed['suppressOutput']).toBe(true);
  });
});

describe('detectHarness', () => {
  it('returns claude-code when CLAUDE_PROJECT_DIR is set', () => {
    expect(detectHarness({ CLAUDE_PROJECT_DIR: '/tmp/repo' })).toBe('claude-code');
  });

  it('returns codex when CODEX_HOME is set and Claude is not', () => {
    expect(detectHarness({ CODEX_HOME: '/tmp/codex' })).toBe('codex');
  });

  it('falls back to claude-code when no env signal is present', () => {
    expect(detectHarness({})).toBe('claude-code');
  });

  it('getHarnessAdapter returns the matching adapter', () => {
    const a = getHarnessAdapter({ CLAUDE_PROJECT_DIR: '/x' });
    expect(a.name).toBe('claude-code');
  });
});
