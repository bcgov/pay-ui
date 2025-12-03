import { useRoutingSlip } from '@/composables/useRoutingSlip'
import type { RoutingSlip } from '@/interfaces/routing-slip'

export default function useLinkRoutingSlip() {
  const {
    invoiceCount,
    isRoutingSlipAChild,
    isRoutingSlipLinked,
    isRoutingSlipVoid
  } = useRoutingSlip()
  const { store } = useRoutingSlipStore()

  const state = reactive({
    showSearch: false,
    isLoading: false,
    childRoutingSlipDetails: computed<RoutingSlip[]>(() => {
      return store.linkedRoutingSlips?.children || []
    }),
    parentRoutingSlipDetails: computed<RoutingSlip>(() => {
      return store.linkedRoutingSlips?.parent || ({} as RoutingSlip)
    }),
    routingSlip: computed(() => store.routingSlip),
    linkedRoutingSlips: computed(() => store.linkedRoutingSlips)
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
    invoiceCount
  }
}
