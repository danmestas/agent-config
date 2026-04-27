import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { ManifestSchema } from '../../lib/schema.ts';
import type { Adapter, ComponentSource, AdapterContext } from '../../lib/types.ts';

export async function runGolden(
  adapter: Adapter,
  fixtureDir: string,
  config: Record<string, unknown> = {},
): Promise<{ matched: boolean; diff: string[] }> {
  const componentDir = path.join(fixtureDir, 'component');
  const expectedDir = path.join(fixtureDir, 'expected');
  const raw = await fs.readFile(path.join(componentDir, 'SKILL.md'), 'utf8');
  const parsed = matter(raw);
  const component: ComponentSource = {
    dir: componentDir,
    relativeDir: path.relative(fixtureDir, componentDir),
    manifest: ManifestSchema.parse(parsed.data),
    body: parsed.content,
  };
  const ctx: AdapterContext = { config, allComponents: [component], repoRoot: fixtureDir };
  const emitted = await adapter.emit(component, ctx);
  const expected = await collectExpected(expectedDir);
  return diffEmittedVsExpected(emitted, expected);
}

async function collectExpected(root: string): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else result.set(path.relative(root, full), await fs.readFile(full, 'utf8'));
    }
  }
  await walk(root);
  return result;
}

function diffEmittedVsExpected(
  emitted: { path: string; content: string | Buffer }[],
  expected: Map<string, string>,
): { matched: boolean; diff: string[] } {
  const diff: string[] = [];
  const emittedMap = new Map(emitted.map((e) => [e.path, e.content.toString()]));
  for (const [p, content] of expected.entries()) {
    if (!emittedMap.has(p)) diff.push(`missing emitted file: ${p}`);
    else if (emittedMap.get(p) !== content) diff.push(`content mismatch: ${p}`);
  }
  for (const p of emittedMap.keys()) {
    if (!expected.has(p)) diff.push(`unexpected emitted file: ${p}`);
  }
  return { matched: diff.length === 0, diff };
}
