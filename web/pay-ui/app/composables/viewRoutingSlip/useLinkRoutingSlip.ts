import { useRoutingSlip } from '@/composables/useRoutingSlip'
import type { RoutingSlip } from '@/interfaces/routing-slip'

// Composable function to inject Props, options and values to useRoutingSlipInfo component
export default function useLinkRoutingSlip() {
  const {
    invoiceCount,
    isRoutingSlipAChild,
    isRoutingSlipLinked,
    isRoutingSlipVoid,
    linkedRoutingSlips,
    routingSlip
  } = useRoutingSlip()
  // store
  const showSearch = ref<boolean>(false)

  const isLoading = ref<boolean>(false)

  const childRoutingSlipDetails: ComputedRef<RoutingSlip[]> = computed(() => {
    // child array of routing slips if exist
    return linkedRoutingSlips.value?.children || []
  })
  const parentRoutingSlipDetails: ComputedRef<RoutingSlip> = computed(() => {
    // parent one Routing slip details
    return linkedRoutingSlips.value?.parent || {}
  })

  function toggleSearch() {
    showSearch.value = !showSearch.value
  }

  return {
    showSearch,
    toggleSearch,
    isRoutingSlipLinked,
    isRoutingSlipAChild,
    isRoutingSlipVoid,
    invoiceCount,
    routingSlip,
    isLoading,
    childRoutingSlipDetails,
    parentRoutingSlipDetails
  }
}
