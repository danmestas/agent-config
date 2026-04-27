import { describe, it, expect } from 'vitest';
import { matchesGlob } from '../lib/glob.ts';

describe('matchesGlob', () => {
  it('matches an exact name', () => {
    expect(matchesGlob('apm-builder', 'apm-builder')).toBe(true);
    expect(matchesGlob('apm-builder', 'other')).toBe(false);
  });

  it('handles a leading wildcard', () => {
    expect(matchesGlob('foo-skill', '*-skill')).toBe(true);
    expect(matchesGlob('foo-other', '*-skill')).toBe(false);
  });

  it('handles a trailing wildcard', () => {
    expect(matchesGlob('skill-foo', 'skill-*')).toBe(true);
    expect(matchesGlob('other-foo', 'skill-*')).toBe(false);
  });

  it('handles a middle wildcard', () => {
    expect(matchesGlob('foo-bar-baz', 'foo-*-baz')).toBe(true);
    expect(matchesGlob('foo-bar-qux', 'foo-*-baz')).toBe(false);
  });

  it('escapes regex metacharacters in literal segments', () => {
    expect(matchesGlob('a.b', 'a.b')).toBe(true);
    // The dot in the pattern must be literal, not a regex wildcard.
    expect(matchesGlob('axb', 'a.b')).toBe(false);
  });

  it('a bare * matches any name', () => {
    expect(matchesGlob('anything', '*')).toBe(true);
    expect(matchesGlob('', '*')).toBe(true);
  });
});
