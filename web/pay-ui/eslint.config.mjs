import { createConfigForNuxt } from '@nuxt/eslint-config'

export default createConfigForNuxt({
  features: {
    stylistic: true
  }
}).append({
  files: ['**/*.ts', '**/*.vue'],
  rules: {
    'no-console': ['error', { allow: ['info', 'error', 'warn'] }],
    'no-debugger': 'off',
    'max-len': ['warn',
      {
        code: 120,
        ignoreRegExpLiterals: true,
        ignoreTrailingComments: true
      }
    ],
    'allow-parens': 'off',
    'curly': 'error',
    'import/no-duplicates': 'error',
    'no-undef': 'off', // some nuxt globals not being recognized, will look into this later
    'no-trailing-spaces': 'error',
    'no-multiple-empty-lines': 'error',
    'nuxt/nuxt-config-keys-order': 'off',
    'vue/multi-word-component-names': 'off',
    'vue/use-v-on-exact': 'off',
    'vue/array-bracket-spacing': 'warn',
    'vue/array-bracket-newline': 'warn',
    'vue/attributes-order': 'warn',
    'vue/comma-dangle': ['error', 'never'],
    'vue/component-api-style': ['error', ['script-setup']],
    'vue/block-lang': ['error', { script: { lang: 'ts' } }],
    'vue/html-indent': 'warn',
    'vue/max-attributes-per-line': ['error', { singleline: { max: 2 }, multiline: { max: 1 } }],
    'vue/script-indent': 'off',
    'vue/no-unused-properties': ['error', { deepData: true, groups: ['data', 'computed', 'methods', 'setup'] }],
    'vue/prefer-use-template-ref': 'error',
    'vue/require-typed-ref': 'error',
    'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
    'vue/define-emits-declaration': ['error', 'type-based'],
    // 'vue/define-macros-order': ['error', { order: ['defineProps', 'defineEmits'] }],
    'vue/define-props-declaration': ['error', 'type-based'],
    '@stylistic/brace-style': 'off',
    '@stylistic/indent': ['error', 2],
    '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
    '@stylistic/comma-dangle': ['error', 'never'],
    '@stylistic/semi': ['error', 'never'],
    '@stylistic/max-statements-per-line': ['error', { max: 2 }]
  }
}).prepend({
  ignores: [
    '**/playwright-report',
    '**/coverage',
    'eslint.config.mjs'
  ]
})
