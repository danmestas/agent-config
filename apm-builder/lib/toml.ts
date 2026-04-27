import TOML, { type JsonMap } from '@iarna/toml';

export interface McpServerSpec {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

const BARE_KEY_RE = /^[A-Za-z0-9_-]+$/;

/**
 * Render a `[mcp_servers.<name>]` TOML table for one MCP server. Emits stable,
 * deterministic output. Server names containing characters outside [A-Za-z0-9_-]
 * are quoted. Inner tables (e.g., env) become inline-style for readability.
 */
export function renderMcpServerToml(name: string, spec: McpServerSpec): string {
  const tableKey = BARE_KEY_RE.test(name) ? name : `"${name.replace(/"/g, '\\"')}"`;
  const body: JsonMap = { command: spec.command };
  if (spec.args && spec.args.length > 0) body.args = spec.args;
  if (spec.env && Object.keys(spec.env).length > 0) body.env = spec.env;
  // Wrap in a top-level mcp_servers.<name> table.
  const wrapped: JsonMap = { mcp_servers: { [name]: body } };
  // @iarna/toml emits sorted keys deterministically when fed a plain object;
  // rebuild the section header line ourselves to keep the dotted-key form.
  let raw = TOML.stringify(wrapped);
  // Replace the implicit inline form (TOML.stringify nests sub-tables under mcp_servers
  // using `[mcp_servers.<name>]` automatically — keep that, just normalize quoting).
  raw = raw.replace(
    new RegExp(`\\[mcp_servers\\.${escapeRegex(name)}\\]`),
    `[mcp_servers.${tableKey}]`,
  );
  // @iarna/toml emits arrays with spaces (`[ "a", "b" ]`); normalize to compact form.
  raw = raw.replace(/^(\s*\w+\s*=\s*)\[ (.+) \]$/gm, '$1[$2]');
  // @iarna/toml indents nested sub-tables with leading whitespace; strip it.
  raw = raw.replace(/^[ \t]+/gm, '');
  return raw;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
