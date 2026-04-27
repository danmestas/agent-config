import { simpleGit } from 'simple-git';

export interface TagReleaseOptions {
  repoRoot: string;
  skill: string;
  version: string;
  /** Set false in tests; defaults true (push to origin). */
  push?: boolean;
  /** Optional annotated message; defaults to "Release <tag>". */
  message?: string;
}

/** Compute the canonical "<skill>@v<version>" tag name. */
export function computeTag(skill: string, version: string): string {
  return `${skill}@v${version}`;
}

/**
 * Annotate-tag HEAD with "<skill>@v<version>" and (by default) push the tag to
 * origin.
 *
 * If the tag already exists, behavior depends on whether it points at HEAD:
 * - same SHA → no-op (idempotent: e.g., the workflow was triggered BY this tag)
 * - different SHA → throw (refusing to overwrite a published tag)
 */
export async function tagRelease(opts: TagReleaseOptions): Promise<string> {
  const tag = computeTag(opts.skill, opts.version);
  const g = simpleGit(opts.repoRoot);
  const existing = await g.tags();
  if (existing.all.includes(tag)) {
    const tagSha = (await g.revparse([tag])).trim();
    const headSha = (await g.revparse(['HEAD'])).trim();
    if (tagSha === headSha) {
      // Idempotent: the workflow was triggered by this tag, so it already exists
      // at the right commit. Nothing to do.
      return tag;
    }
    throw new Error(
      `tag "${tag}" already exists at ${tagSha.slice(0, 7)} but HEAD is ${headSha.slice(0, 7)}; refusing to retag`,
    );
  }
  const message = opts.message ?? `Release ${tag}`;
  await g.addAnnotatedTag(tag, message);
  if (opts.push !== false) {
    await g.push('origin', tag);
  }
  return tag;
}
