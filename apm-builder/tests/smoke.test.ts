import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBuild } from '../lib/build.ts';
import { discoverComponents } from '../lib/discover.ts';
import { updateReadme, COMPONENTS_BEGIN, COMPONENTS_END } from '../lib/docs.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '../..');
const CLI_ENTRY = path.join(REPO_ROOT, 'apm-builder/cli.ts');
const TSX_BIN = path.join(
  REPO_ROOT,
  'node_modules/.bin',
  process.platform === 'win32' ? 'tsx.cmd' : 'tsx',
);

interface CliResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

function runCli(cwd: string, args: string[], env: NodeJS.ProcessEnv = {}): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(TSX_BIN, [CLI_ENTRY, ...args], {
      cwd,
      env: { ...process.env, ...env },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (b) => (stdout += b.toString()));
    child.stderr.on('data', (b) => (stderr += b.toString()));
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

async function writeSkill(repo: string, name: string, manifest: Record<string, unknown>): Promise<void> {
  const lines: string[] = ['---'];
  for (const [k, v] of Object.entries(manifest)) {
    if (Array.isArray(v)) lines.push(`${k}: [${v.join(', ')}]`);
    else if (typeof v === 'object' && v !== null) {
      lines.push(`${k}:`);
      for (const [sk, sv] of Object.entries(v)) lines.push(`  ${sk}: ${sv}`);
    } else lines.push(`${k}: ${v}`);
  }
  lines.push('---', '', `# ${name}`, '', 'Body.', '');
  const dir = path.join(repo, 'skills', name);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'SKILL.md'), lines.join('\n'));
}

describe('smoke: cross-harness conformance', () => {
  it('a multi-target skill emits non-empty output for every adapter', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-skills-smoke-'));
    await writeSkill(repo, 'smoke-skill', {
      name: 'smoke-skill',
      version: '1.0.0',
      description: 'A smoke-test skill targeting every harness',
      type: 'skill',
      targets: ['claude-code', 'apm', 'codex', 'gemini', 'copilot', 'pi'],
      category: { primary: 'tooling' },
    });

    const targets = ['claude-code', 'apm', 'codex', 'gemini', 'copilot', 'pi'] as const;
    const result = await runBuild({
      repoRoot: repo,
      targets: [...targets],
      outDir: 'dist',
    });

    const errors = result.errors.filter((e) => e.severity === 'error');
    expect(errors).toEqual([]);

    for (const target of targets) {
      const targetDir = path.join(repo, 'dist', target);
      const files = await fs.readdir(targetDir).catch(() => [] as string[]);
      expect(files.length, `${target} produced no output`).toBeGreaterThan(0);
    }
  }, 30_000);
});

describe('smoke: CLI integration', () => {
  it('validate exits 0 against a synthetic skill', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-skills-cli-validate-'));
    await writeSkill(repo, 'cli-skill', {
      name: 'cli-skill',
      version: '1.0.0',
      description: 'A skill for CLI smoke testing',
      type: 'skill',
      targets: ['claude-code'],
      category: { primary: 'tooling' },
    });
    const r = await runCli(repo, ['validate']);
    expect(r.code, `stderr: ${r.stderr}`).toBe(0);
    expect(r.stdout).toContain('OK');
  }, 30_000);

  it('build --target claude-code creates dist/', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-skills-cli-build-'));
    await writeSkill(repo, 'cli-build-skill', {
      name: 'cli-build-skill',
      version: '1.0.0',
      description: 'A skill for build CLI smoke',
      type: 'skill',
      targets: ['claude-code'],
      category: { primary: 'tooling' },
    });
    const r = await runCli(repo, ['build', '--target', 'claude-code']);
    expect(r.code, `stderr: ${r.stderr}`).toBe(0);
    const distFiles = await fs.readdir(path.join(repo, 'dist/claude-code')).catch(() => []);
    expect(distFiles.length).toBeGreaterThan(0);
  }, 30_000);

  it('init creates SKILL.md', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-skills-cli-init-'));
    const r = await runCli(repo, ['init', 'new-thing']);
    expect(r.code, `stderr: ${r.stderr}`).toBe(0);
    const skill = await fs.readFile(path.join(repo, 'skills/new-thing/SKILL.md'), 'utf8');
    expect(skill).toContain('name: new-thing');
    expect(skill).toContain('type: skill');
  }, 30_000);

  it('docs writes README.md', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-skills-cli-docs-'));
    await writeSkill(repo, 'docs-skill', {
      name: 'docs-skill',
      version: '1.0.0',
      description: 'A skill for docs CLI smoke',
      type: 'skill',
      targets: ['claude-code'],
      category: { primary: 'tooling' },
    });
    const r = await runCli(repo, ['docs']);
    expect(r.code, `stderr: ${r.stderr}`).toBe(0);
    const readme = await fs.readFile(path.join(repo, 'README.md'), 'utf8');
    expect(readme).toContain('docs-skill');
    expect(readme).toContain(COMPONENTS_BEGIN);
  }, 30_000);

  it('evolve --dry-run prints a report', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-skills-cli-evolve-'));
    // Use a project name guaranteed to have no session history so the run is deterministic.
    const r = await runCli(repo, [
      'evolve',
      '--dry-run',
      '--no-llm',
      '--project',
      'agent-skills-smoke-nonexistent-project',
    ]);
    expect(r.code, `stderr: ${r.stderr}`).toBe(0);
    expect(r.stdout).toContain('Evolution Report');
  }, 30_000);
});

describe('smoke: docs round-trip', () => {
  it('updateReadme is idempotent across two invocations', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-skills-docs-'));
    await writeSkill(repo, 'docs-a', {
      name: 'docs-a',
      version: '1.0.0',
      description: 'first docs skill',
      type: 'skill',
      targets: ['claude-code'],
      category: { primary: 'tooling' },
    });
    await writeSkill(repo, 'docs-b', {
      name: 'docs-b',
      version: '1.0.0',
      description: 'second docs skill',
      type: 'skill',
      targets: ['apm'],
      category: { primary: 'workflow' },
    });
    const components = await discoverComponents(repo);
    const initial = `# Test\n\nIntro\n\n${COMPONENTS_BEGIN}\n${COMPONENTS_END}\n\nOutro\n`;
    const first = updateReadme(initial, components);
    const second = updateReadme(first, components);
    expect(second).toBe(first);
    // Sanity: markers and hand-written sections preserved.
    expect(first).toContain('Intro');
    expect(first).toContain('Outro');
    expect(first).toContain('docs-a');
    expect(first).toContain('docs-b');
  });
});
