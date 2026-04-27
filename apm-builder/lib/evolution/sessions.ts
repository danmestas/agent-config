import fs from 'node:fs/promises';
import path from 'node:path';
import type { SessionEvent } from './types.ts';

export interface LoadedSession {
  sessionId: string;
  filePath: string;
  events: SessionEvent[];
  earliestTimestamp: Date;
  latestTimestamp: Date;
}

export async function loadSessionsSince(
  sessionsDir: string,
  since: Date,
): Promise<LoadedSession[]> {
  const exists = await fs.stat(sessionsDir).then(() => true).catch(() => false);
  if (!exists) return [];

  const entries = await fs.readdir(sessionsDir, { withFileTypes: true });
  const jsonlFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith('.jsonl'))
    .map((e) => path.join(sessionsDir, e.name));

  const result: LoadedSession[] = [];
  for (const file of jsonlFiles) {
    const events = await parseJsonl(file);
    if (events.length === 0) continue;
    const timestamps = events
      .map((ev) => (ev.timestamp ? new Date(ev.timestamp) : null))
      .filter((t): t is Date => t !== null && !Number.isNaN(t.getTime()));
    if (timestamps.length === 0) continue;
    const latest = new Date(Math.max(...timestamps.map((t) => t.getTime())));
    if (latest < since) continue;
    const earliest = new Date(Math.min(...timestamps.map((t) => t.getTime())));
    const sessionId = events[0]?.sessionId ?? path.basename(file, '.jsonl');
    result.push({
      sessionId,
      filePath: file,
      events,
      earliestTimestamp: earliest,
      latestTimestamp: latest,
    });
  }
  return result;
}

async function parseJsonl(filePath: string): Promise<SessionEvent[]> {
  const raw = await fs.readFile(filePath, 'utf8');
  const out: SessionEvent[] = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const obj = JSON.parse(trimmed);
      if (obj && typeof obj === 'object') out.push(obj as SessionEvent);
    } catch {
      // Skip malformed lines silently for v1 — could surface counts later.
    }
  }
  return out;
}
