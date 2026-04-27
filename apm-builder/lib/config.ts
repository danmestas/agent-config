import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

export type RepoConfig = Record<string, Record<string, unknown>>;

export async function loadRepoConfig(repoRoot: string): Promise<RepoConfig> {
  const configPath = path.join(repoRoot, 'apm-builder.config.yaml');
  const exists = await fs.stat(configPath).then(() => true).catch(() => false);
  if (!exists) return {};
  const raw = await fs.readFile(configPath, 'utf8');
  const parsed = YAML.parse(raw);
  if (parsed === null || typeof parsed !== 'object') return {};
  return parsed as RepoConfig;
}
