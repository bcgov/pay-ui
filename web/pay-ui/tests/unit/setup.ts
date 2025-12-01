// Normally do not have to do this - will need to take a look later

import { config } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { merge } from 'es-toolkit'
import type { Directive } from 'vue'

// english
import baseEn from '#base/i18n/locales/en-CA'
import authEn from '#auth/i18n/locales/en-CA'
import payEn from '#pay/i18n/locales/en-CA'
import formsEn from '#forms/i18n/locales/en-CA'
import appEn from '~~/i18n/locales/en-CA'

// french
import baseFr from '#base/i18n/locales/fr-CA'
import authFr from '#auth/i18n/locales/fr-CA'
import payFr from '#pay/i18n/locales/fr-CA'
import formsFr from '#forms/i18n/locales/fr-CA'
import appFr from '~~/i18n/locales/fr-CA'

const enLocales = [baseEn, formsEn, authEn, payEn, appEn]
const frLocales = [baseFr, formsFr, authFr, payFr, appFr]

const en = enLocales.reduce((a, c) => merge(a, c), {})
const fr = frLocales.reduce((a, c) => merge(a, c), {})

const i18n = createI18n({
  legacy: false,
  locale: 'en-CA',
  messages: {
    'en-CA': en,
    'fr-CA': fr
  }
})

config.global.plugins.push(i18n)

const canDirective: Directive = {
  mounted: () => {},
  updated: () => {}
}

config.global.directives = {
  ...config.global.directives,
  can: canDirective
}
