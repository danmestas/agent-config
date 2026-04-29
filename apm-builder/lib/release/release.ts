import path from 'node:path';
import fs from 'node:fs/promises';
import { discoverComponents } from '../discover.ts';
import { validateComponents } from '../validate.ts';
import { runBuild } from '../build.ts';
import { loadRepoConfig } from '../config.ts';
import { renderReadme } from '../docs.ts';
import { tagRelease } from './git.ts';
import { appendChangelogEntry } from './changelog.ts';
import { renderReleaseNotes } from './notes.ts';
import { publishAPM, publishClaudeCode, publishGitUrl } from './publish.ts';
import { renderMarketplaceEntry, marketplaceFilePath } from './marketplace.ts';
import type { Target } from '../types.ts';

export interface ReleaseOptions {
  repoRoot: string;
  skill: string;
  version: string;
  summary: string;
  apmToken: string | undefined;
  /** Git host + repo, e.g. "github.com/danmestas/agent-skills". */
  gitRepo: string;
  /** Skip git push (used by tests against bare local remotes, and CI when the tag is already pushed). */
  pushTag?: boolean;
  runGh?: (args: string[]) => Promise<{ stdout: string; exitCode: number }>;
  runApm?: (
    args: string[],
    env: NodeJS.ProcessEnv,
  ) => Promise<{ stdout: string; exitCode: number }>;
}

export interface ReleaseResult {
  tag: string;
  published: {
    claudeCode: boolean;
    apm: 'registry' | 'git-url' | 'skipped';
    gitUrlTargets: Target[];
  };
}

const GIT_URL_TARGETS: readonly Target[] = ['codex', 'gemini', 'copilot', 'pi'];

/**
 * Wire Tasks 2-8 together: discover -> validate -> build -> tag -> per-target
 * publishers -> changelog -> README refresh. Aborts before tagging if
 * validation or build emit any fatal error, so a failed release never leaves a
 * dangling tag in the repo.
 */
export async function runRelease(opts: ReleaseOptions): Promise<ReleaseResult> {
  const components = await discoverComponents(opts.repoRoot);
  const target = components.find((c) => c.manifest.name === opts.skill);
  if (!target) {
    throw new Error(`skill "${opts.skill}" not found in skills/, plugins/, or rules/`);
  }
  if (target.manifest.version !== opts.version) {
    throw new Error(
      `manifest version (${target.manifest.version}) does not match --version (${opts.version}); update SKILL.md before releasing`,
    );
  }
  const errors = validateComponents(components);
  const fatal = errors.filter((e) => e.severity === 'error');
  if (fatal.length > 0) {
    throw new Error(`validation failed: ${fatal.map((e) => e.message).join('; ')}`);
  }
  const config = await loadRepoConfig(opts.repoRoot);
  // Build the full repo (no filter) so plugin.includes references resolve
  // through the validator. Passing `filter: opts.skill` would only validate
  // the released component, breaking includes resolution for plugin types.
  const buildResult = await runBuild({
    repoRoot: opts.repoRoot,
    targets: target.manifest.targets,
    outDir: 'dist',
  });
  if (buildResult.errors.some((e) => e.severity === 'error')) {
    throw new Error(`build failed: ${buildResult.errors.map((e) => e.message).join('; ')}`);
  }
  // Generate marketplace listing for plugin components going to Claude Code.
  // Done before tagging so the listing change is included in the release commit.
  if (
    target.manifest.type === 'plugin' &&
    target.manifest.targets.includes('claude-code')
  ) {
    const entry = renderMarketplaceEntry(target, { gitRepo: opts.gitRepo });
    const dest = path.join(opts.repoRoot, marketplaceFilePath(target.manifest.name));
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, entry, 'utf8');
  }
  const tag = await tagRelease({
    repoRoot: opts.repoRoot,
    skill: opts.skill,
    version: opts.version,
    push: opts.pushTag !== false,
  });
  const apmScope = (config['apm']?.['package_scope'] as string | undefined) ?? '';
  const releaseNotes = renderReleaseNotes({
    component: target,
    summary: opts.summary,
    apmScope,
    gitRepo: opts.gitRepo,
  });
  const published: ReleaseResult['published'] = {
    claudeCode: false,
    apm: 'skipped',
    gitUrlTargets: [],
  };
  if (target.manifest.targets.includes('claude-code')) {
    // Plugin releases ship the whole dist/claude-code/ tree (manifest at root +
    // included skills); skill releases ship only their per-skill subdir.
    const distSubpath = target.manifest.type === 'plugin' ? '.' : path.join('skills', opts.skill);
    await publishClaudeCode({
      repoRoot: opts.repoRoot,
      tag,
      skill: opts.skill,
      version: opts.version,
      releaseNotes,
      distSubpath,
      runGh: opts.runGh,
    });
    published.claudeCode = true;
  }
  if (target.manifest.targets.includes('apm')) {
    const result = await publishAPM({
      repoRoot: opts.repoRoot,
      skill: opts.skill,
      version: opts.version,
      registry: (config['apm']?.['registry'] as string | undefined) ?? '',
      apmToken: opts.apmToken,
      runApm: opts.runApm,
    });
    published.apm = result.mode;
  }
  const declaredGitUrl = target.manifest.targets.filter((t) => GIT_URL_TARGETS.includes(t));
  if (declaredGitUrl.length > 0) {
    await publishGitUrl({
      repoRoot: opts.repoRoot,
      tag,
      skill: opts.skill,
      version: opts.version,
      gitRepo: opts.gitRepo,
      targets: declaredGitUrl,
    });
    published.gitUrlTargets = declaredGitUrl;
  }
  await appendChangelogEntry(path.join(opts.repoRoot, 'CHANGELOG.md'), {
    skill: opts.skill,
    version: opts.version,
    date: new Date(),
    summary: opts.summary,
  });
  // Regenerate README to reflect the new version (re-uses Plan 1's renderReadme).
  const refreshed = await discoverComponents(opts.repoRoot);
  await fs.writeFile(path.join(opts.repoRoot, 'README.md'), renderReadme(refreshed), 'utf8');
  return { tag, published };
}
