// apm-builder/tests/evolution/memory.test.ts
import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectStaleMemoryRefs } from '../../lib/evolution/memory.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_DIR = path.join(HERE, 'fixtures/memory');
const REPO_ROOT = path.resolve(HERE, '../../..'); // agent-skills root

describe('detectStaleMemoryRefs', () => {
  it('flags a path reference that does not exist', async () => {
    const findings = await detectStaleMemoryRefs(MEMORY_DIR, REPO_ROOT);
    const pathFinding = findings.find((f) =>
      f.evidence.some((e) => e.includes('apm-builder/lib/missing-file.ts')),
    );
    expect(pathFinding).toBeDefined();
    expect(pathFinding?.severity).toBe('low'); // single occurrence
    expect(pathFinding?.proposedDiff?.targetPath).toMatch(/feedback_old_branch\.md$/);
  });

  it('does not flag valid existing paths', async () => {
    const findings = await detectStaleMemoryRefs(MEMORY_DIR, REPO_ROOT);
    expect(findings.every((f) => !f.evidence.some((e) => e.includes('package.json')))).toBe(true);
  });
});
