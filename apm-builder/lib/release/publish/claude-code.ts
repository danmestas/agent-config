import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { zipDirectory } from '../zip.ts';

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
