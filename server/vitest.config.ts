import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
    // Every test file's setup.ts import races to upsert the same shared
    // fixture rows (test_role, the base test staff, Tier/Territory id 1)
    // against a real MySQL dev DB — Prisma's upsert there is a plain
    // SELECT-then-INSERT, not an atomic UPSERT, so parallel files can both
    // "find nothing" and then collide on the same primary key. Running test
    // files one at a time avoids that race entirely.
    fileParallelism: false,
  },
})
