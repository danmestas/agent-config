import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export interface PrelaunchOptions {
  resolutionPath: string;
  originalCwd: string;
}

export interface PrelaunchResult {
  tempdir: string;
  /** Cleanup function — call on session end. Best-effort. */
  cleanup: () => Promise<void>;
}

async function runApmBuilderDocs(
  target: 'codex' | 'copilot',
  resolutionPath: string,
  outFile: string,
  originalCwd: string,
): Promise<void> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const cli = path.resolve(here, '..', '..', 'cli.ts');
  const tsx = path.resolve(here, '..', '..', '..', 'node_modules', '.bin', 'tsx');
  await new Promise<void>((resolveCb, reject) => {
    const child = spawn(
      process.execPath,
      [tsx, cli, 'docs', '--target', target, '--resolution', resolutionPath, '--out', outFile, '--repo', originalCwd],
      { stdio: 'inherit' },
    );
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolveCb() : reject(new Error(`apm-builder docs exited ${code}`))));
  });
}

async function symlinkProjectFiles(originalCwd: string, tempdir: string): Promise<void> {
  // Symlink common project files so the harness can still read them.
  const toLink = ['.git', 'package.json', 'tsconfig.json', '.env'];
  for (const name of toLink) {
    const src = path.join(originalCwd, name);
    try {
      await fs.access(src);
      await fs.symlink(src, path.join(tempdir, name));
    } catch {
      // skip missing
    }
  }
}

export async function prelaunchComposeCodex(opts: PrelaunchOptions): Promise<PrelaunchResult> {
  const tempdir = await fs.mkdtemp(path.join(os.tmpdir(), 'ac-prelaunch-'));
  await runApmBuilderDocs('codex', opts.resolutionPath, path.join(tempdir, 'AGENTS.md'), opts.originalCwd);
  await symlinkProjectFiles(opts.originalCwd, tempdir);
  return {
    tempdir,
    cleanup: async () => {
      try {
        await fs.rm(tempdir, { recursive: true, force: true });
      } catch {
        // best-effort
      }
    },
  };
}

export async function prelaunchComposeCopilot(opts: PrelaunchOptions): Promise<PrelaunchResult> {
  const tempdir = await fs.mkdtemp(path.join(os.tmpdir(), 'ac-prelaunch-'));
  await runApmBuilderDocs('copilot', opts.resolutionPath, path.join(tempdir, 'copilot-instructions.md'), opts.originalCwd);
  await symlinkProjectFiles(opts.originalCwd, tempdir);
  return {
    tempdir,
    cleanup: async () => {
      try {
        await fs.rm(tempdir, { recursive: true, force: true });
      } catch {
        // best-effort
      }
    },
  };
}
