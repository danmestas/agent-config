import { describe, it, expect } from 'vitest';
import { renderMcpServerToml } from '../lib/toml.ts';

describe('renderMcpServerToml', () => {
  it('emits a [mcp_servers.<name>] table with command + args + env', () => {
    const out = renderMcpServerToml('my-mcp', {
      command: 'node',
      args: ['server.js', '--flag'],
      env: { LOG_LEVEL: 'debug', API_KEY: 'xxx' },
    });
    expect(out).toContain('[mcp_servers.my-mcp]');
    expect(out).toContain('command = "node"');
    expect(out).toContain('args = ["server.js", "--flag"]');
    expect(out).toContain('LOG_LEVEL = "debug"');
    expect(out).toContain('API_KEY = "xxx"');
  });

  it('omits args/env when not provided', () => {
    const out = renderMcpServerToml('simple', { command: 'python3' });
    expect(out).toContain('command = "python3"');
    expect(out).not.toContain('args');
    expect(out).not.toContain('env');
  });

  it('escapes the server name when it contains characters that need quoting', () => {
    const out = renderMcpServerToml('with.dot', { command: 'cmd' });
    // TOML requires quoting of names containing dots.
    expect(out).toMatch(/\[mcp_servers\."with\.dot"\]/);
  });
});
