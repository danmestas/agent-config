import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderReleaseNotes } from '../../lib/release/notes.ts';
import type { ComponentSource } from '../../lib/types.ts';

const FIXTURES = path.resolve(fileURLToPath(import.meta.url), '../fixtures');

describe('renderReleaseNotes', () => {
  it('matches the golden release-notes file', async () => {
    const component: ComponentSource = {
      dir: '/x',
      relativeDir: 'skills/pikchr-generator',
      body: '',
      manifest: {
        name: 'pikchr-generator',
        version: '1.2.0',
        description: 'Themed diagram generation with Kroki fallback',
        type: 'skill',
        targets: ['claude-code', 'apm', 'codex', 'gemini', 'copilot', 'pi'],
      } as ComponentSource['manifest'],
    };
    const md = renderReleaseNotes({
      component,
      summary: 'Add Kroki fallback for offline rendering.',
      apmScope: '@danmestas',
      gitRepo: 'github.com/danmestas/agent-skills',
    });
    const expected = await fs.readFile(path.join(FIXTURES, 'sample-release-notes.md'), 'utf8');
    expect(md.trim()).toBe(expected.trim());
  });
});
