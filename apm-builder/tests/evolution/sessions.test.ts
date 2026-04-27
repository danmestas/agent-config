import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSessionsSince } from '../../lib/evolution/sessions.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(HERE, 'fixtures/sessions');

describe('loadSessionsSince', () => {
  it('loads JSONL sessions and returns them with parsed events', async () => {
    const since = new Date('2026-04-25T00:00:00Z');
    const sessions = await loadSessionsSince(FIXTURE_DIR, since);
    expect(sessions.length).toBeGreaterThanOrEqual(1);
    const sample = sessions.find((s) => s.sessionId === 'sess-1');
    expect(sample).toBeDefined();
    expect(sample?.events.length).toBeGreaterThanOrEqual(3);
  });

  it('skips sessions where every event predates the window', async () => {
    const since = new Date('2099-01-01T00:00:00Z');
    const sessions = await loadSessionsSince(FIXTURE_DIR, since);
    expect(sessions).toHaveLength(0);
  });
});
