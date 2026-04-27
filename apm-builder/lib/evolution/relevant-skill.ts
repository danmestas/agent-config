import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import Anthropic from '@anthropic-ai/sdk';
import type { SkillEntry } from './types.ts';

export interface CatalogPaths {
  repoLocal?: string;
  home?: string;
  pluginsCache?: string;
}

export async function scanSkillCatalog(paths: CatalogPaths): Promise<SkillEntry[]> {
  const ordered = [paths.repoLocal, paths.home, paths.pluginsCache].filter(Boolean) as string[];
  const seen = new Map<string, SkillEntry>();
  for (const root of ordered) {
    const entries = await scanDir(root);
    for (const entry of entries) {
      if (!seen.has(entry.name)) seen.set(entry.name, entry);
    }
  }
  return [...seen.values()];
}

async function scanDir(root: string): Promise<SkillEntry[]> {
  const exists = await fs
    .stat(root)
    .then(() => true)
    .catch(() => false);
  if (!exists) return [];
  const out: SkillEntry[] = [];
  const subs = await fs.readdir(root, { withFileTypes: true });
  for (const sub of subs) {
    if (!sub.isDirectory()) continue;
    const skillPath = path.join(root, sub.name, 'SKILL.md');
    const skillExists = await fs
      .stat(skillPath)
      .then(() => true)
      .catch(() => false);
    if (!skillExists) continue;
    const raw = await fs.readFile(skillPath, 'utf8');
    const parsed = matter(raw);
    const data = parsed.data as {
      name?: string;
      description?: string;
      category?: { primary?: string };
    };
    if (typeof data.name === 'string' && typeof data.description === 'string') {
      out.push({
        name: data.name,
        description: data.description,
        filePath: skillPath,
        category: data.category?.primary,
      });
    }
  }
  return out;
}

export interface RelevantSkillQuery {
  /** Cluster evidence — quoted snippets of the friction. */
  evidence: string[];
  /** All known skills. */
  catalog: SkillEntry[];
}

export interface RelevantSkillResult {
  /** Name of the matched skill, or null if no good match. */
  skill: string | null;
  /** 0-1 confidence. */
  confidence: number;
  /** One-sentence rationale. */
  reasoning: string;
}

/** Live Anthropic call. Tests stub this via dependency injection or just skip with --no-llm. */
export async function determineRelevantSkill(
  query: RelevantSkillQuery,
  apiKey: string,
): Promise<RelevantSkillResult> {
  const client = new Anthropic({ apiKey });
  const catalogText = query.catalog
    .map((s) => `- ${s.name}: ${s.description.slice(0, 200)}`)
    .join('\n');
  const evidence = query.evidence.join('\n');
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `Below is friction evidence from agent sessions, followed by the skill catalog.\n\nWhich skill, if any, owns this concern? Return strict JSON: {"skill":"<name|null>","confidence":0.0,"reasoning":"..."}.\n\nEvidence:\n${evidence}\n\nCatalog:\n${catalogText}`,
      },
    ],
  });
  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { text: string }).text)
    .join('');
  try {
    const parsed = JSON.parse(text);
    return {
      skill: typeof parsed.skill === 'string' ? parsed.skill : null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
    };
  } catch {
    return { skill: null, confidence: 0, reasoning: 'parse-failure' };
  }
}
