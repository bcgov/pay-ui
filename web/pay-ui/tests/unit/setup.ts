import { config } from '@vue/test-utils'
import type { Directive } from 'vue'

const canDirective: Directive = {
  mounted: () => {},
  updated: () => {}
}

config.global.directives = {
  ...config.global.directives,
  can: canDirective
}

