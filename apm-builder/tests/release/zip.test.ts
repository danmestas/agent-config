import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createReadStream } from 'node:fs';
import unzipper from 'unzipper';
import { zipDirectory } from '../../lib/release/zip.ts';

describe('zipDirectory', () => {
  it('produces a deterministic zip of a directory', async () => {
    const src = await fs.mkdtemp(path.join(os.tmpdir(), 'zip-src-'));
    const out = await fs.mkdtemp(path.join(os.tmpdir(), 'zip-out-'));
    await fs.mkdir(path.join(src, 'sub'), { recursive: true });
    await fs.writeFile(path.join(src, 'a.txt'), 'hello');
    await fs.writeFile(path.join(src, 'sub', 'b.txt'), 'world');
    const zipPath = path.join(out, 'release.zip');
    await zipDirectory(src, zipPath);
    const entries: string[] = [];
    await new Promise<void>((resolve, reject) => {
      createReadStream(zipPath)
        .pipe(unzipper.Parse())
        .on('entry', (entry) => {
          entries.push(entry.path);
          entry.autodrain();
        })
        .on('close', () => resolve())
        .on('error', reject);
    });
    expect(entries.sort()).toEqual(['a.txt', 'sub/b.txt']);
  });
});
