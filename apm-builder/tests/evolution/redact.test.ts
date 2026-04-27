// apm-builder/tests/evolution/redact.test.ts
import { describe, it, expect } from 'vitest';
import { redact } from '../../lib/evolution/redact.ts';

describe('redact', () => {
  it('strips Anthropic-style tokens', () => {
    expect(redact('key=sk-ant-api03-abc123XYZ')).toMatch(/REDACTED/);
  });

  it('strips GitHub PAT prefixes', () => {
    expect(redact('token=ghp_abc123XYZ456789')).toMatch(/REDACTED/);
  });

  it('strips Slack bot tokens', () => {
    expect(redact('xoxb-1234-5678-token')).toMatch(/REDACTED/);
  });

  it('strips absolute Downloads/Desktop paths', () => {
    expect(redact('see /Users/dan/Downloads/secret.txt')).toMatch(/REDACTED/);
    expect(redact('see /Users/dan/Desktop/notes.md')).toMatch(/REDACTED/);
  });

  it('preserves non-secret content', () => {
    const input = 'See `apm-builder/lib/foo.ts` line 42.';
    expect(redact(input)).toBe(input);
  });
});
