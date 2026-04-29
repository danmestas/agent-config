import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { publishAPM } from '../../lib/release/publish.ts';

describe('publishAPM', () => {
  it('runs `apm publish` with APM_TOKEN in env', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'apm-'));
    const pkgDir = path.join(repo, 'dist/apm/foo');
    await fs.mkdir(pkgDir, { recursive: true });
    await fs.writeFile(path.join(pkgDir, 'apm.yml'), 'name: foo\nversion: 0.1.0\n');
    const fakeApm = vi.fn(async (args: string[], env: NodeJS.ProcessEnv) => {
      expect(args).toEqual(['publish', '--registry', 'https://apm.example.com']);
      expect(env.APM_TOKEN).toBe('secret-token');
      return { stdout: 'published', exitCode: 0 };
    });
    await publishAPM({
      repoRoot: repo,
      skill: 'foo',
      version: '0.1.0',
      registry: 'https://apm.example.com',
      apmToken: 'secret-token',
      runApm: fakeApm,
    });
    expect(fakeApm).toHaveBeenCalled();
  });

  it('throws when APM_TOKEN is missing', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'apm-'));
    const pkgDir = path.join(repo, 'dist/apm/foo');
    await fs.mkdir(pkgDir, { recursive: true });
    await fs.writeFile(path.join(pkgDir, 'apm.yml'), 'name: foo\nversion: 0.1.0\n');
    await expect(
      publishAPM({
        repoRoot: repo,
        skill: 'foo',
        version: '0.1.0',
        registry: 'https://apm.example.com',
        apmToken: undefined,
        runApm: async () => ({ stdout: '', exitCode: 0 }),
      }),
    ).rejects.toThrow(/APM_TOKEN/);
  });

  it('falls back to git-URL release when registry is empty', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'apm-'));
    const pkgDir = path.join(repo, 'dist/apm/foo');
    await fs.mkdir(pkgDir, { recursive: true });
    await fs.writeFile(path.join(pkgDir, 'apm.yml'), 'name: foo\nversion: 0.1.0\n');
    const fakeApm = vi.fn(
      async (
        _args: string[],
        _env: NodeJS.ProcessEnv,
      ): Promise<{ stdout: string; exitCode: number }> => ({ stdout: '', exitCode: 0 }),
    );
    const result = await publishAPM({
      repoRoot: repo,
      skill: 'foo',
      version: '0.1.0',
      registry: '',
      apmToken: undefined,
      runApm: fakeApm,
    });
    expect(fakeApm).not.toHaveBeenCalled();
    expect(result.mode).toBe('git-url');
  });

  it('falls back to git-URL when APM CLI is missing (ENOENT)', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'apm-'));
    const pkgDir = path.join(repo, 'dist/apm/foo');
    await fs.mkdir(pkgDir, { recursive: true });
    await fs.writeFile(path.join(pkgDir, 'apm.yml'), 'name: foo\nversion: 0.1.0\n');
    const fakeApm = vi.fn(async () => {
      const err = new Error('spawn apm ENOENT') as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      throw err;
    });
    const result = await publishAPM({
      repoRoot: repo,
      skill: 'foo',
      version: '0.1.0',
      registry: 'https://apm.example.com',
      apmToken: 'tok',
      runApm: fakeApm,
    });
    expect(result.mode).toBe('git-url');
  });
});
