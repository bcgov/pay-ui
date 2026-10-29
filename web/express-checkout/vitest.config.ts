import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    dir: './tests/unit',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom'
      }
    },
    coverage: {
      provider: 'v8',
      reportsDirectory: './tests/unit/coverage',
      allowExternal: true,
      // Vitest's root is app/, so relative globs match nothing; ../server lives outside the root
      include: [
        '**/express-checkout/app/**/*.{ts,vue}',
        '**/express-checkout/server/**/*.ts'
      ],
      exclude: ['**/*.d.ts']
    },
    setupFiles: './tests/unit/setup.ts',
    globals: true,
    clearMocks: true,
    mockReset: true,
    restoreMocks: true
  }
})
