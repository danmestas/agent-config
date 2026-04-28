import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['apm-builder/**/*.test.ts', 'hooks/**/*.test.ts'],
    globals: false,
  },
});
