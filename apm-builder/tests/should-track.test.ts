import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { shouldTrackProject } from '../lib/should-track.ts';

describe('shouldTrackProject', () => {
  let tmpRoot: string;

  beforeEach(() => {
    // Use a path outside the default exclude list (~/.config, /tmp, /var,
    // ~/Downloads, ~/Desktop). The system tmpdir resolves to /var/folders
    // on macOS, which is under /var, so we put fixtures under HOME instead.
    tmpRoot = fs.mkdtempSync(path.join(os.homedir(), '.should-track-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('tracks a normal project directory by default', () => {
    const project = path.join(tmpRoot, 'my-project');
    fs.mkdirSync(project);
    expect(shouldTrackProject(project)).toBe(true);
  });

  it('excludes ~/.config and its descendants', () => {
    const configDir = path.join(os.homedir(), '.config');
    expect(shouldTrackProject(configDir)).toBe(false);
    expect(shouldTrackProject(path.join(configDir, 'foo', 'bar'))).toBe(false);
  });

  it('excludes /tmp and friends', () => {
    expect(shouldTrackProject('/tmp')).toBe(false);
    expect(shouldTrackProject('/tmp/whatever')).toBe(false);
  });

  it('honors a per-project exclude.json', () => {
    const project = path.join(tmpRoot, 'project-with-exclude');
    fs.mkdirSync(project);
    const cfgDir = path.join(project, '.agent-config');
    fs.mkdirSync(cfgDir);
    // Exclude the project itself.
    fs.writeFileSync(
      path.join(cfgDir, 'exclude.json'),
      JSON.stringify({ exclude: [project] }),
    );
    expect(shouldTrackProject(project)).toBe(false);
  });

  it('returns true when the per-project config is missing or malformed', () => {
    const project = path.join(tmpRoot, 'project-no-cfg');
    fs.mkdirSync(project);
    expect(shouldTrackProject(project)).toBe(true);

    const cfgDir = path.join(project, '.agent-config');
    fs.mkdirSync(cfgDir);
    fs.writeFileSync(path.join(cfgDir, 'exclude.json'), '{ this is not json');
    expect(shouldTrackProject(project)).toBe(true);
  });
});
