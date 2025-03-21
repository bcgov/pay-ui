import { BreadcrumbItem } from '@/models/BreadcrumbItem'
import CommonUtils from '@/util/common-util'
import ConfigHelper from '@/util/config-helper'
import { computed } from '@vue/composition-api'
import Routes from '@/router/routes'
import { RouteNames } from '@/util/constants'

/*
Composable function for BreadCrumb component that is displayed at top of the screen.
Currently, displayed in Dashboard and ViewRoutingslip views
*/
export function useBreadCrumb (_, context) {
  const items = computed(() => {
    if (context.root.$route && context.root.$route.name) {
      return generateBreadcrumbItems(context.root.$route)
    }
    return []
  })

  const appendQueryParamsIfNeeded = CommonUtils.appendQueryParamsIfNeeded
  const authWebUrl = `${ConfigHelper.getAuthWebUrl()}staff/dashboard`

  function generateBreadcrumbItems (route: any): BreadcrumbItem[] {
    switch (route.name) {
      case RouteNames.HOME:
        return generateBreadcrumbForHome(route)
      case RouteNames.VIEW_ROUTING_SLIP:
        return generateBreadcrumbForViewRoutingSlip(route)
      case RouteNames.VIEW_ROUTING_SLIP_CHILD:
        return generateBreadcrumbForViewChildRoutingSlip(route)
      case RouteNames.MANAGE_SHORTNAMES:
        return generateBreadcrumbForManageShortNames(route)
      case RouteNames.SHORTNAME_DETAILS:
        return generateBreadcrumbForShortNameDetails(route)
      case RouteNames.SHORTNAME_REFUND:
        return generateBreadcrumbForShortNameRefund(route)
      // We can add breadcrumbs for future components here
    }
  }

  function generateBreadcrumbForHome (route: any): BreadcrumbItem[] {
    if (route.query?.openFromAuth || route.query?.viewFromAuth) {
      return [
        {
          text: 'Staff Dashboard',
          disabled: false,
          /* For redirecting to parent dashboard ( for Vuetify Breadcrumb to navigate )
          Reason: Behind the scenes, Vuetify breadcrumb calls router.push for :to property and
          window.location for :href property */
          href: authWebUrl
        } as BreadcrumbItem,
        {
          text: 'FAS Dashboard',
          disabled: true,
          to: '/home'
        } as BreadcrumbItem
      ]
    }
  }

  function generateBreadcrumbForViewRoutingSlip (route: any): BreadcrumbItem[] {
    const slipId = route.params.slipId
    const items = [
      {
        text: 'FAS Dashboard',
        disabled: false,
        to: appendQueryParamsIfNeeded('/home', route)
      } as BreadcrumbItem,
      {
        text: `View Routing Slip: ${slipId}`,
        disabled: true,
        to: appendQueryParamsIfNeeded(`/view-routing-slip/${slipId}`, route)
      } as BreadcrumbItem
    ]
    return appendParentAndFasHomePageItems(items, route)
  }

  function generateBreadcrumbForViewChildRoutingSlip (route: any): BreadcrumbItem[] {
    const slipId = route.params.slipId
    const parentSlipId = route.params.parentSlipId
    const items = [
      {
        text: 'FAS Dashboard',
        disabled: false,
        to: appendQueryParamsIfNeeded('/home', route)
      } as BreadcrumbItem,
      {
        text: `View Routing Slip: ${parentSlipId}`,
        disabled: false,
        to: appendQueryParamsIfNeeded(`/view-routing-slip/${parentSlipId}`, route)
      } as BreadcrumbItem,
      {
        text: `View Routing Slip: ${slipId}`,
        disabled: true,
        to: appendQueryParamsIfNeeded(`/view-routing-slip/${slipId}`, route)
      } as BreadcrumbItem
    ]

    return appendParentAndFasHomePageItems(items, route)
  }

  function generateBreadcrumbForManageShortNames (route: any): BreadcrumbItem[] {
    return [
      {
        text: 'Staff Dashboard',
        disabled: false,
        href: authWebUrl
      } as BreadcrumbItem,
      {
        text: 'EFT Received Payments',
        disabled: true,
        to: appendQueryParamsIfNeeded('/eft', route)
      } as BreadcrumbItem
    ]
  }

  function generateBreadcrumbForShortNameDetails (route: any): BreadcrumbItem[] {
    const shortNameId = route.params.shortNameId
    return [
      {
        text: 'Staff Dashboard',
        disabled: false,
        href: authWebUrl
      } as BreadcrumbItem,
      {
        text: 'EFT Received Payments',
        disabled: false,
        to: appendQueryParamsIfNeeded('/eft', route)
      } as BreadcrumbItem,
      {
        text: 'EFT Payment Details',
        disabled: true,
        to: appendQueryParamsIfNeeded(`/eft/shortname-details/${shortNameId}`, route)
      } as BreadcrumbItem
    ]
  }

  function generateBreadcrumbForShortNameRefund (route: any): BreadcrumbItem[] {
    const shortNameId = route.params.shortNameId
    return [
      {
        text: 'Staff Dashboard',
        disabled: false,
        href: authWebUrl
      } as BreadcrumbItem,
      {
        text: 'EFT Received Payments',
        disabled: false,
        to: appendQueryParamsIfNeeded('/eft', route)
      } as BreadcrumbItem,
      {
        text: 'EFT Payment Details',
        disabled: false,
        to: appendQueryParamsIfNeeded(`/eft/shortname-details/${shortNameId}`, route)
      } as BreadcrumbItem,
      {
        text: 'Refund Request',
        disabled: true,
        to: appendQueryParamsIfNeeded(`/eft/shortname-details/${shortNameId}/refund`, route)
      } as BreadcrumbItem
    ]
  }

  function appendParentAndFasHomePageItems (items: BreadcrumbItem[], route: any) {
    // Append parent dashboard if openFromAuth property set to true
    if (route.query?.openFromAuth || route.query?.viewFromAuth) {
      items.unshift({
        text: 'Staff Dashboard',
        disabled: false,
        href: authWebUrl
      } as BreadcrumbItem)
      // If we clicked View from a parent dashboard(Sbc Auth), then we need to remove FAS Dashboard breadcrumb item
      if (route.query?.viewFromAuth) {
        items.splice(1, 1)
      }
    }
    return items
  }

  function goBack (): void {
    const penUltimateBreadcrumbItem = items.value[items.value.length - 2]
    // for parent dashboard, we had stored the target url in href property rather than to property
    if (penUltimateBreadcrumbItem.href) {
      window.location.href = penUltimateBreadcrumbItem.href
    } else {
      context.root.$router.push(penUltimateBreadcrumbItem.to)
    }
  }
  return {
    items,
    goBack
  }
}
