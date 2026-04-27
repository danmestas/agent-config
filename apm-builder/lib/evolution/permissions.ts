import type { LoadedSession } from './sessions.ts';
import type { Finding, Severity } from './types.ts';

const APPROVAL_THRESHOLD = 5;

interface PermEvent {
  tool: string;
  command: string;
  decision: 'approve' | 'deny' | string;
  sessionId: string;
  timestamp?: string;
}

function severityOf(count: number): Severity {
  if (count >= 5) return 'high';
  if (count >= 3) return 'medium';
  return 'low';
}

function canonicalize(tool: string, input: unknown): string {
  if (tool === 'Bash' && typeof input === 'object' && input !== null && 'command' in input) {
    return String((input as { command: unknown }).command).trim();
  }
  return `${tool}:${JSON.stringify(input)}`;
}

export function detectPermissionPrompts(sessions: LoadedSession[]): Finding[] {
  const counts = new Map<string, { approve: number; deny: number; events: PermEvent[] }>();

  for (const session of sessions) {
    for (const ev of session.events) {
      if (ev.type !== 'permission-request') continue;
      const tool = ev.tool ?? '';
      const key = canonicalize(tool, ev.input);
      const bucket = counts.get(key) ?? { approve: 0, deny: 0, events: [] };
      if (ev.decision === 'approve') bucket.approve += 1;
      else if (ev.decision === 'deny') bucket.deny += 1;
      bucket.events.push({
        tool,
        command: key,
        decision: ev.decision ?? '',
        sessionId: session.sessionId,
        timestamp: ev.timestamp,
      });
      counts.set(key, bucket);
    }
  }

  const findings: Finding[] = [];
  let idx = 1;
  for (const [key, bucket] of counts.entries()) {
    if (bucket.approve < APPROVAL_THRESHOLD || bucket.deny > 0) continue;
    const finding: Finding = {
      id: `F-${String(idx).padStart(3, '0')}`,
      patternType: 'permission-prompt-recurring',
      severity: severityOf(bucket.approve),
      count: bucket.approve,
      evidence: bucket.events
        .slice(0, 3)
        .map((e) => `> ${e.sessionId} @ ${e.timestamp ?? '?'}: \`${key}\` (${e.decision})`),
      proposedDiff: {
        targetPath: '.claude/settings.json',
        diff: buildAllowlistDiff(key),
        summary: `Add \`${key}\` to permissions.allow[] (approved ${bucket.approve}× with 0 denials)`,
      },
    };
    findings.push(finding);
    idx += 1;
  }
  return findings;
}

function buildAllowlistDiff(canonicalCommand: string): string {
  return [
    '--- a/.claude/settings.json',
    '+++ b/.claude/settings.json',
    '@@ permissions.allow @@',
    `+    "${canonicalCommand}"`,
    '',
  ].join('\n');
}
