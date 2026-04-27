import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

export interface APMReleaseOptions {
  repoRoot: string;
  skill: string;
  version: string;
  /** Empty string means: skip registry push, rely on git-URL install. */
  registry: string;
  apmToken: string | undefined;
  runApm?: (
    args: string[],
    env: NodeJS.ProcessEnv,
  ) => Promise<{ stdout: string; exitCode: number }>;
}

/**
 * Publish to the APM registry, or fall back to git-URL install if the registry
 * is unconfigured OR the `apm` binary is not on PATH (ENOENT). The git-URL
 * fallback is intentional: in environments without the APM CLI installed, we
 * still want the release flow to succeed — the published git tag IS the
 * installable artifact for any harness that supports git-URL installs.
 */
export async function publishAPM(
  opts: APMReleaseOptions,
): Promise<{ mode: 'registry' | 'git-url' }> {
  const pkgDir = path.join(opts.repoRoot, 'dist/apm', opts.skill);
  const exists = await fs
    .stat(pkgDir)
    .then((s) => s.isDirectory())
    .catch(() => false);
  if (!exists) {
    throw new Error(`expected build output at dist/apm/${opts.skill} but it is missing`);
  }
  if (!opts.registry) {
    // Git-URL fallback: the tag created by tagRelease() is the install artifact.
    return { mode: 'git-url' };
  }
  if (!opts.apmToken) {
    throw new Error('APM_TOKEN env var is required to push to the APM registry');
  }
  const args = ['publish', '--registry', opts.registry];
  const run = opts.runApm ?? defaultRunApm;
  const env = { ...process.env, APM_TOKEN: opts.apmToken, PWD: pkgDir };
  let result: { stdout: string; exitCode: number };
  try {
    result = await run(args, env);
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'ENOENT') {
      // APM CLI not installed; degrade gracefully to git-URL mode.
      console.warn(
        `[release] apm CLI not found on PATH; falling back to git-URL install for ${opts.skill}@v${opts.version}`,
      );
      return { mode: 'git-url' };
    }
    throw err;
  }
  if (result.exitCode !== 0) {
    throw new Error(`apm publish failed (exit ${result.exitCode}): ${result.stdout}`);
  }
  return { mode: 'registry' };
}

function defaultRunApm(
  args: string[],
  env: NodeJS.ProcessEnv,
): Promise<{ stdout: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn('apm', args, {
      stdio: ['ignore', 'pipe', 'inherit'],
      env,
      cwd: env.PWD,
    });
    let stdout = '';
    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => resolve({ stdout, exitCode: code ?? 1 }));
  });
}
