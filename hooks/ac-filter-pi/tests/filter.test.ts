import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

describe('ac-filter-pi template (Path B)', () => {
  it('exports a default function and uses sendUserMessage (not setActiveTools)', async () => {
    const tmpl = await fs.readFile(
      path.join(HERE, '..', 'index.ts.tmpl'),
      'utf8',
    );
    // Remove comments to ensure setActiveTools is not actually invoked (only mentioned in docs)
    const codeWithoutComments = tmpl.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(tmpl).toMatch(/export default function/);
    expect(tmpl).toMatch(/AC_RESOLUTION_PATH/);
    expect(tmpl).toMatch(/session_start/);
    expect(tmpl).toMatch(/sendUserMessage/);
    expect(codeWithoutComments).not.toMatch(/setActiveTools/);
  });
});
