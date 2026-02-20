import js from '@eslint/js'
import globals from 'globals'
import stylistic from '@stylistic/eslint-plugin'

export default [
  js.configs.recommended,
  {
    languageOptions: {
      globals: globals.node
    },
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      'no-console': 'off',
      'no-debugger': 'off',
      'max-len': ['warn', {
        code: 120,
        ignoreRegExpLiterals: true,
        ignoreTrailingComments: true
      }],
      'curly': 'error',
      'no-trailing-spaces': 'error',
      'no-multiple-empty-lines': 'error',
      '@stylistic/brace-style': 'off',
      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/comma-dangle': ['error', 'never'],
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/max-statements-per-line': ['error', { max: 2 }]
    }
  },
  {
    ignores: [
      'playwright-report/',
      'coverage/',
      'eslint.config.mjs'
    ]
  }
]
