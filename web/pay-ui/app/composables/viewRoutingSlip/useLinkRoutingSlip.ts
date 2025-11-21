import { useRoutingSlip } from '@/composables/useRoutingSlip'
import type { RoutingSlip } from '@/interfaces/routing-slip'

export default function useLinkRoutingSlip() {
  const {
    invoiceCount,
    isRoutingSlipAChild,
    isRoutingSlipLinked,
    isRoutingSlipVoid,
    linkedRoutingSlips,
    routingSlip
  } = useRoutingSlip()

  const state = reactive({
    showSearch: false,
    isLoading: false,
    childRoutingSlipDetails: computed<RoutingSlip[]>(() => {
    return linkedRoutingSlips.value?.children || []
    }),
    parentRoutingSlipDetails: computed<RoutingSlip>(() => {
      return linkedRoutingSlips.value?.parent || {}
  })
  })

  function toggleSearch() {
    state.showSearch = !state.showSearch
  }

  return {
    ...toRefs(state),
    toggleSearch,
    isRoutingSlipLinked,
    isRoutingSlipAChild,
    isRoutingSlipVoid,
    invoiceCount,
    routingSlip
  }
}
