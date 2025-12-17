import CreateRoutingSlipView from '../views/CreateRoutingSlipView.vue'
import Dashboard from '../views/Dashboard.vue'
import PageNotFound from '../views/PageNotFound.vue'
import { EFTRefundMethod, Role, RouteNames } from '@/util/constants'
import { RouteConfig } from 'vue-router'
import SigninView from '@/views/auth/SigninView.vue'
import SignoutView from '@/views/auth/SignoutView.vue'
import ShortNameMappingView from '@/views/eft/ShortNameMappingView.vue'
import Unauthorized from '@/views/Unauthorized.vue'
import ViewRoutingSlip from '../views/ViewRoutingSlip.vue'
import ShortNameRefundSelection from '@/components/eft/ShortNameRefundSelection.vue'
import ShortNameDetailsView from '@/components/eft/ShortNameDetailsView.vue'
import ShortNameRefundView from '@/components/eft/ShortNameRefundView.vue'
import RefundView from '@/views/pay/RefundView.vue'
import TransactionView from '@/views/TransactionView.vue'
import TransactionTableView from '@/views/TransactionTableView.vue'

const routes: Array<RouteConfig> = [
  { path: '/', name: 'root', redirect: 'home' },
  {
    path: '/home',
    name: RouteNames.HOME,
    component: Dashboard,
    meta: {
      requiresAuth: true,
      allowedRoles: [Role.FAS_USER]
    }
  },
  {
    path: '/create-routing-slip',
    name: RouteNames.CREATE_ROUTING_SLIP,
    component: CreateRoutingSlipView,
    meta: {
      requiresAuth: true,
      allowedRoles: [Role.FAS_CREATE]
    }
  },
  {
    path: '/view-routing-slip/:slipId?',
    name: RouteNames.VIEW_ROUTING_SLIP,
    component: ViewRoutingSlip,
    props: true,
    meta: {
      requiresAuth: true,
      allowedRoles: [Role.FAS_VIEW]
    }
  },
  {
    path: '/view-routing-slip/:parentSlipId/:slipId?',
    name: RouteNames.VIEW_ROUTING_SLIP_CHILD,
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
    name: RouteNames.SIGN_IN,
    component: SigninView,
    meta: {
      requiresAuth: false
    }
  },
  {
    // SbcHeader.logout() redirects here:
    path: '/signout',
    name: RouteNames.SIGN_OUT,
    component: SignoutView,
    meta: {
      requiresAuth: false
    }
  },
  { path: '*', name: RouteNames.NOT_FOUND, component: PageNotFound },
  {
    path: '/unauthorized',
    name: RouteNames.UNAUTHORIZED,
    component: Unauthorized,
    meta: { requiresAuth: false }
  },
  {
    path: '/eft',
    name: RouteNames.MANAGE_SHORTNAMES,
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
    name: RouteNames.SHORTNAME_DETAILS,
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
    name: RouteNames.SHORTNAME_REFUND,
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
    name: RouteNames.SHORTNAME_REFUND_SELECTION,
    component: ShortNameRefundSelection,
    meta: {
      requiresAuth: true,
      allowedRoles: [Role.EftRefund],
      showNavBar: true
    },
    props: route => ({
      shortNameId: Number(route.params.shortNameId)
    })
  },
  {
    path: '/pay/refund',
    name: 'refund',
    component: RefundView,
    props: true,
    meta: {
      requiresAuth: true,
      allowedRoles: [Role.CreateCredits, Role.FasRefund]
    }
  },
  {
    path: '/transaction-view/:invoiceId/:mode?/:refundId?',
    name: 'transaction-view',
    component: TransactionView,
    props: (route) => ({
      invoiceId: route.params.invoiceId,
      mode: route.params.mode,
      refundId: route.params.refundId
    }),
    meta: {
      requiresAuth: true,
      allowedRoles: [Role.CreateCredits, Role.FasRefund, Role.ProductRefundViewer]
    }
  },
  {
    path: '/transactions',
    name: 'transactions',
    component: TransactionTableView,
    meta: {
      requiresAuth: true,
      allowedRoles: [Role.ViewAllTransactions, Role.ProductRefundViewer]
    }
  }
]

export default routes
