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
  const showSearch = ref<boolean>(false)
  const isLoading = ref<boolean>(false)

  const childRoutingSlipDetails: ComputedRef<RoutingSlip[]> = computed(() => {
    return linkedRoutingSlips.value?.children || []
  })

  const parentRoutingSlipDetails: ComputedRef<RoutingSlip> = computed(() => {
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
