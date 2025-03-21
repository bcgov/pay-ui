import CreateRoutingSlipView from '../views/CreateRoutingSlipView.vue'
import Dashboard from '../views/Dashboard.vue'
import PageNotFound from '../views/PageNotFound.vue'
import { EFTRefundMethod, Role } from '@/util/constants'
import { RouteConfig } from 'vue-router'
import SigninView from '@/views/auth/SigninView.vue'
import SignoutView from '@/views/auth/SignoutView.vue'
import ShortNameMappingView from '@/views/eft/ShortNameMappingView.vue'
import Unauthorized from '@/views/Unauthorized.vue'
import ViewRoutingSlip from '../views/ViewRoutingSlip.vue'
import ShortNameRefundSelection from '@/components/eft/ShortNameRefundSelection.vue'
import ShortNameDetailsView from '@/components/eft/ShortNameDetailsView.vue'
import ShortNameRefundView from '@/components/eft/ShortNameRefundView.vue'

const routes: Array<RouteConfig> = [
  { path: '/', name: 'root', redirect: 'home' },
  {
    path: '/home',
    name: 'home',
    component: Dashboard,
    meta: {
      requiresAuth: true,
      allowedRoles: [Role.FAS_USER]
    }
  },
  {
    path: '/create-routing-slip',
    name: 'create-routing-slip',
    component: CreateRoutingSlipView,
    meta: {
      requiresAuth: true,
      allowedRoles: [Role.FAS_CREATE]
    }
  },
  {
    path: '/view-routing-slip/:slipId?',
    name: 'view-routing-slip',
    component: ViewRoutingSlip,
    props: true,
    meta: {
      requiresAuth: true,
      allowedRoles: [Role.FAS_VIEW]
    }
  },
  {
    path: '/view-routing-slip/:parentSlipId/:slipId?',
    name: 'view-routing-slip-child',
    component: ViewRoutingSlip,
    props: true,
    meta: {
      requiresAuth: true,
      allowedRoles: [Role.FAS_VIEW]
    }
  },
  {
    // router.beforeEach() routes here:
    path: '/signin/:idpHint',
    name: 'signin',
    component: SigninView,
    meta: {
      requiresAuth: false
    }
  },
  {
    // SbcHeader.logout() redirects here:
    path: '/signout',
    name: 'signout',
    component: SignoutView,
    meta: {
      requiresAuth: false
    }
  },
  { path: '*', name: 'notfound', component: PageNotFound },
  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: Unauthorized,
    meta: { requiresAuth: false }
  },
  {
    path: '/eft',
    name: 'manage-shortnames',
    component: ShortNameMappingView,
    meta: {
      requiresAuth: true,
      allowedRoles: [Role.ManageEft],
      showNavBar: true
    },
    props: true
  },
  {
    path: '/eft/shortname-details/:shortNameId',
    name: 'shortnamedetails',
    component: ShortNameDetailsView,
    meta: {
      requiresAuth: true,
      allowedRoles: [Role.ManageEft],
      showNavBar: true
    },
    props: (route) => ({ shortNameId: Number(route.params.shortNameId) })
  },
  {
    path: '/eft/shortname-details/:shortNameId/refund/:eftRefundId?',
    name: 'shortnamerefund',
    component: ShortNameRefundView,
    meta: {
      requiresAuth: true,
      allowedRoles: [Role.EftRefund],
      showNavBar: true
    },
    props: route => ({
      paramRefundMethod: route.query.refundMethod,
      shortNameId: Number(route.params.shortNameId),
      eftRefundId: route.params.eftRefundId ? Number(route.params.eftRefundId) : undefined
    })
  },
  {
    path: '/eft/shortname-details/:shortNameId/refund-selection',
    name: 'shortnamerefundselection',
    component: ShortNameRefundSelection,
    meta: {
      requiresAuth: true,
      allowedRoles: [Role.EftRefund],
      showNavBar: true
    },
    props: route => ({
      shortNameId: Number(route.params.shortNameId)
    })
  }
]

export default routes
