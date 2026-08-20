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
      include: [
        'app/pages/**',
        'app/components/**',
        'app/composables/**',
        'app/middleware/**',
        'app/stores/**',
        'app/utils/**'
      ]
    },
    setupFiles: './tests/unit/setup.ts',
    globals: true,
    clearMocks: true,
    mockReset: true,
    restoreMocks: true
  }
})
