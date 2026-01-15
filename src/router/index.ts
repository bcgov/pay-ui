import KeyCloakService from 'sbc-common-components/src/services/keycloak.services'
import LaunchDarklyService from 'sbc-common-components/src/services/launchdarkly.services'
import Vue from 'vue'
import VueRouter from 'vue-router'
import { LDFlags, RouteNames, SessionStorageKeys } from '@/util/constants'
import routes from './routes'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  base: import.meta.env.BASE_URL,
  routes
})

router.beforeEach((to, from, next) => {
  // If the user is authenticated;
  //    If there are allowed or disabled roles specified on the route check if the user has those roles else route to unauthorized
  // If the user is not authenticated
  //    Redirect the user to unauthorized page
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!sessionStorage.getItem(SessionStorageKeys.KeyCloakToken) || !KeyCloakService.verifyRoles(to.meta.allowedRoles, [])) {
      return next({
        path: '/unauthorized'
      })
    }
  }

  // Check if EFT maintenance mode is enabled and redirect EFT routes to maintenance page
  const isEftMaintenanceEnabled = LaunchDarklyService.getFlag(LDFlags.EftMaintenance, false)
  if (isEftMaintenanceEnabled && to.path.startsWith('/eft') && to.name !== RouteNames.EFT_MAINTENANCE) {
    return next({ name: RouteNames.EFT_MAINTENANCE })
  }

  next()
})

export default router
