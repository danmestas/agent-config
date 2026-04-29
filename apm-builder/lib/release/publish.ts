import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { simpleGit } from 'simple-git';
import { zipDirectory } from './zip.ts';
import type { Target } from '../types.ts';

// =============================================================================
// publishAPM
// =============================================================================

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

// =============================================================================
// publishClaudeCode
// =============================================================================

export interface ClaudeCodeReleaseOptions {
  repoRoot: string;
  tag: string;
  skill: string;
  version: string;
  releaseNotes: string;
  /**
   * Subpath under dist/claude-code/ to zip into the release asset. Defaults to
   * `skills/<skill>` (for skill-type components). Plugin-type releases pass
   * an alternate path (e.g. `.` to ship the entire plugin output).
   */
  distSubpath?: string;
  /**
   * Override for tests. Defaults to spawning real `gh`. Tests MUST inject a
   * stub — the real binary creates a public GitHub release.
   */
  runGh?: (args: string[]) => Promise<{ stdout: string; exitCode: number }>;
}

/**
 * Zip `dist/claude-code/<distSubpath>/` into
 * `release-artifacts/<skill>-v<version>.zip` and call
 * `gh release create <tag> <zip> --title ... --notes-file ...`.
 *
 * Default subpath is `skills/<skill>`. Plugin releases override this with
 * `.` (whole dist/claude-code) so the bundle's `.claude-plugin/plugin.json`
 * + included skills ship together.
 *
 * The `runGh` injection point exists because we can't safely run `gh release
 * create` from tests — it would publish a real release. Production callers
 * leave runGh undefined and get the spawn-based default.
 */
export async function publishClaudeCode(
  opts: ClaudeCodeReleaseOptions,
): Promise<{ zipPath: string }> {
  const subpath = opts.distSubpath ?? path.join('skills', opts.skill);
  const srcDir = path.join(opts.repoRoot, 'dist/claude-code', subpath);
  const exists = await fs
    .stat(srcDir)
    .then((s) => s.isDirectory())
    .catch(() => false);
  if (!exists) {
    throw new Error(
      `expected build output at dist/claude-code/${subpath} but it is missing`,
    );
  }
  const zipPath = path.join(
    opts.repoRoot,
    'release-artifacts',
    `${opts.skill}-v${opts.version}.zip`,
  );
  await zipDirectory(srcDir, zipPath);
  const notesPath = path.join(
    opts.repoRoot,
    'release-artifacts',
    `${opts.skill}-v${opts.version}-notes.md`,
  );
  await fs.writeFile(notesPath, opts.releaseNotes, 'utf8');
  const args = [
    'release',
    'create',
    opts.tag,
    zipPath,
    '--title',
    `${opts.skill} v${opts.version}`,
    '--notes-file',
    notesPath,
  ];
  const run = opts.runGh ?? defaultRunGh;
  const result = await run(args);
  if (result.exitCode !== 0) {
    throw new Error(`gh release create failed (exit ${result.exitCode})`);
  }
  return { zipPath };
}

function defaultRunGh(args: string[]): Promise<{ stdout: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn('gh', args, { stdio: ['ignore', 'pipe', 'inherit'] });
    let stdout = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => resolve({ stdout, exitCode: code ?? 1 }));
  });
}

// =============================================================================
// publishGitUrl
// =============================================================================

export interface GitUrlReleaseOptions {
  repoRoot: string;
  tag: string;
  skill: string;
  version: string;
  /** Git host + repo, e.g. "github.com/danmestas/agent-skills". */
  gitRepo: string;
  targets: Target[];
}

/**
 * "Publish" a git-URL release. The published git tag IS the installable
 * artifact for these targets — there is no registry to push to. This function
 * verifies the tag exists at HEAD and emits a target -> install-URL map that
 * upstream callers (orchestrator + release notes) can surface to humans.
 */
export async function publishGitUrl(
  opts: GitUrlReleaseOptions,
): Promise<{ installUrls: Partial<Record<Target, string>> }> {
  const g = simpleGit(opts.repoRoot);
  const tags = await g.tags();
  if (!tags.all.includes(opts.tag)) {
    throw new Error(
      `tag "${opts.tag}" is not present in this repo; cannot publish git-URL release`,
    );
  }
  const installUrls: Partial<Record<Target, string>> = {};
  for (const t of opts.targets) {
    installUrls[t] = `${opts.gitRepo}@${opts.tag}`;
  }
  return { installUrls };
}
