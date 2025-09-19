import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    dir: './tests/unit',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom', // 'happy-dom' (default) or 'jsdom'
        overrides: {
          // other Nuxt config you want to pass
        }
      }
    },
    coverage: {
      provider: 'v8',
      reportsDirectory: '../tests/unit/coverage',
      include: [
        'pages/**',
        'layouts/**',
        'components/**',
        'composables/**',
        'utils/**',
        'services/**',
        'plugins/**',
        'stores/**'
      ],
      exclude: [
        'utils/**/index.ts'
      ]
    },
    setupFiles: './tests/unit/setup.ts',
    globals: true
  }
})
