/* eslint-disable */

import '@mdi/font/css/materialdesignicons.min.css' // icon library (https://materialdesignicons.com/)
import './shims-vue-composition-api'

import App from './App.vue'
import CommonUtils from '@/util/common-util'
import ConfigHelper from '@/util/config-helper'
import KeyCloakService from 'sbc-common-components/src/services/keycloak.services'
import LaunchDarklyService from 'sbc-common-components/src/services/launchdarkly.services'
import Vue from 'vue'
import VueCompositionAPI from '@vue/composition-api'
import VueSanitize from 'vue-sanitize-directive'
import Vuelidate from 'vuelidate'
import can from '@/directives/can'
import initializeI18n from './plugins/i18n'
import router from './router'
import { getVuexStore, getPiniaStore } from './store'
import vuetify from './plugins/vuetify'

Vue.config.productionTip = false

Vue.use(Vuelidate)
Vue.use(VueCompositionAPI)
const i18n = initializeI18n(Vue)
Vue.use(VueSanitize)
/**
 * The server side configs are necessary for app to work , since they are reference in templates and all
 */
ConfigHelper.saveConfigToSessionStorage().then(async () => {
  // Initializing Launch Darkly services
  await LaunchDarklyService.init(ConfigHelper.getLdClientId());

  // addressCompleteKey is for canada post address lookup, which is to be used in sbc-common-components
  (<any>window).addressCompleteKey = ConfigHelper.getAddressCompleteKey()
  await syncSession()
  renderVue()
})

async function syncSession () {
  const keycloakConfig: any = {
    url: `${ConfigHelper.getKeycloakAuthUrl()}`,
    realm: `${ConfigHelper.getKeycloakRealm()}`,
    clientId: `${ConfigHelper.getKeycloakClientId()}`
  }

  await KeyCloakService.setKeycloakConfigUrl(keycloakConfig)

  // Initialize the token to force login the user
  if (!CommonUtils.isSigningIn() && !CommonUtils.isSigningOut()) {
    await KeyCloakService.initializeToken(null, true, true).then(() => {}).catch(err => {
      if (err?.message !== 'NOT_AUTHENTICATED') {
        throw err
      }
    })
  }
}

function removeServiceWorkers() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      for (let registration of registrations) {
        registration.unregister()
      }
    })
  }
}
// setting to window to avoid library build undefined issue for global loader
(window as any).fasStore = getVuexStore

function renderVue () {
  new Vue({
    router,
    store: getVuexStore,
    pinia: getPiniaStore(),
    vuetify,
    i18n,
    render: h => h(App)
  }).$mount('#app')
  Vue.directive('can', can)

  removeServiceWorkers()

}
