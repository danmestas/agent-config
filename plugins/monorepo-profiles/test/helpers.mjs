import { mkdtemp, rm, mkdir, writeFile, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(__dirname, 'fixtures', 'sample');

export async function makeRepoFixture() {
  const dir = await mkdtemp(join(tmpdir(), 'mr-profile-repo-'));
  await cp(FIXTURE_ROOT, dir, { recursive: true });
  return dir;
}

export async function makeHomeFixture() {
  const dir = await mkdtemp(join(tmpdir(), 'mr-profile-home-'));
  await mkdir(join(dir, '.claude', 'skills'), { recursive: true });
  await mkdir(join(dir, '.claude', 'agents'), { recursive: true });
  await writeFile(join(dir, '.claude', 'settings.json'), '{}');
  return join(dir, '.claude');
}

export async function cleanup(...dirs) {
  for (const d of dirs) {
    if (d) await rm(d, { recursive: true, force: true });
  }
}
