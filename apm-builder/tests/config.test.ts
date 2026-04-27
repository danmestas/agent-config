import { describe, it, expect } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { loadRepoConfig } from '../lib/config.ts';

describe('loadRepoConfig', () => {
  it('parses apm-builder.config.yaml when present', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'apm-builder-cfg-'));
    await fs.writeFile(
      path.join(tmp, 'apm-builder.config.yaml'),
      'apm:\n  package_scope: "@test"\n',
    );
    const cfg = await loadRepoConfig(tmp);
    expect(cfg['apm']).toEqual({ package_scope: '@test' });
  });

  it('returns empty config when file missing', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'apm-builder-cfg-'));
    const cfg = await loadRepoConfig(tmp);
    expect(cfg).toEqual({});
  });
});
