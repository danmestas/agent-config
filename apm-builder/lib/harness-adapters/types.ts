// Shared types for the cross-harness adapter library. Each harness (Claude
// Code, Codex, Gemini, Copilot, Pi) wraps hook input + output in a different
// JSON envelope; an adapter `normalizeInput` produces the canonical shape we
// work with, and `formatOutput` re-wraps it for the harness.
//
// This is intentionally a thin contract. Adapters live in their own files.

export interface NormalizedHookInput {
  /** Lifecycle event name, e.g. `PreToolUse`, `PostToolUse`, `SessionStart`. */
  event: string;
  /** Stable session identifier. */
  sessionId: string;
  /** Working directory of the host session. */
  cwd: string;
  /** Tool name when the event is tool-scoped. */
  tool?: string;
  /** Raw tool input as the harness reported it. */
  toolInput?: unknown;
  /** Raw tool response when present (PostToolUse only). */
  toolResponse?: unknown;
  /** Free-form bag for harness-specific extras the adapter wants to surface. */
  extras?: Record<string, unknown>;
}

export interface NormalizedHookOutput {
  /** When false, signal to the host that the session should stop. Defaults true. */
  continue?: boolean;
  /** Suppress the host's own output for this hook. */
  suppressOutput?: boolean;
  /** Free-form additional context for SessionStart-style hooks. */
  additionalContext?: string;
  /** Optional JSON payload some harnesses include verbatim. */
  payload?: Record<string, unknown>;
}

export interface HarnessAdapter {
  /** Identifier for this harness (`claude-code`, `codex`, etc.). */
  name: string;
  /** Parse the host harness's stdin envelope into the canonical shape. */
  normalizeInput(raw: string): NormalizedHookInput;
  /** Render a canonical output back into the host harness's expected JSON. */
  formatOutput(out: NormalizedHookOutput): string;
}
