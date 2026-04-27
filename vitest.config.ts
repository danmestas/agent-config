import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['apm-builder/**/*.test.ts'],
    globals: false,
  },
});
