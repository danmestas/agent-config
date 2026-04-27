import fs from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';

/**
 * Zip the contents of `srcDir` into `outZipPath`. Paths inside the zip are
 * relative to `srcDir` (not absolute). Files are added in sorted order with a
 * fixed epoch mtime so output is deterministic across runs.
 */
export async function zipDirectory(srcDir: string, outZipPath: string): Promise<void> {
  await fs.promises.mkdir(path.dirname(outZipPath), { recursive: true });
  const output = fs.createWriteStream(outZipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  const closed = new Promise<void>((resolve, reject) => {
    output.on('close', () => resolve());
    archive.on('warning', (err) => {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') reject(err);
    });
    archive.on('error', reject);
  });
  archive.pipe(output);
  const entries = await collect(srcDir);
  for (const rel of entries.sort()) {
    archive.file(path.join(srcDir, rel), { name: rel, date: new Date(0) });
  }
  await archive.finalize();
  await closed;
}

async function collect(root: string, sub: string = ''): Promise<string[]> {
  const out: string[] = [];
  const dirents = await fs.promises.readdir(path.join(root, sub), { withFileTypes: true });
  for (const d of dirents) {
    const rel = sub ? path.join(sub, d.name) : d.name;
    if (d.isDirectory()) out.push(...(await collect(root, rel)));
    else if (d.isFile()) out.push(rel);
  }
  return out;
}
