import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    dir: './tests/unit',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
        overrides: {
          // other Nuxt config you want to pass
        }
      }
    },
    coverage: {
      provider: 'v8',
      reportsDirectory: './tests/unit/coverage',
      include: ['app/**/*.{ts,vue}', 'server/**/*.ts'],
      exclude: [
        'app/**/*.d.ts',
        'app/interfaces/**',
        'app/types/**',
        'app/**/index.ts'
      ]
    },
    // Nuxt environment setup (beforeAll in @nuxt/test-utils) can exceed 10s under parallel load.
    hookTimeout: 30000,
    setupFiles: './tests/unit/setup.ts',
    globals: true,
    clearMocks: true,
    mockReset: true,
    restoreMocks: true
  }
})
