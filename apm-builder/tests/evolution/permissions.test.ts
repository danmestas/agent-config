import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSessionsSince } from '../../lib/evolution/sessions.ts';
import { detectPermissionPrompts } from '../../lib/evolution/permissions.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(HERE, 'fixtures/sessions');

describe('detectPermissionPrompts', () => {
  it('flags a Bash command approved 5+ times with no denials', async () => {
    const sessions = await loadSessionsSince(FIXTURE_DIR, new Date('2026-04-25T00:00:00Z'));
    const findings = detectPermissionPrompts(sessions);
    const npmTest = findings.find((f) => f.evidence.some((e) => e.includes('npm test')));
    expect(npmTest).toBeDefined();
    expect(npmTest?.severity).toBe('high'); // 5 occurrences = high tier
    expect(npmTest?.count).toBe(5);
    expect(npmTest?.proposedDiff?.targetPath).toMatch(/settings\.json$/);
  });

  it('returns no findings when below threshold', async () => {
    // Use sample-session.jsonl which has no permission-request events.
    const sessions = await loadSessionsSince(FIXTURE_DIR, new Date('2026-04-25T00:00:00Z'));
    const findings = detectPermissionPrompts(
      sessions.filter((s) => s.sessionId !== 'sess-perm'),
    );
    expect(findings).toEqual([]);
  });
});
