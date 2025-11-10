import type { GetRoutingSlipRequestPayload } from '@/interfaces/routing-slip'
import { useRoutingSlip } from '@/composables/useRoutingSlip'

interface UseViewRoutingSlipProps {
  slipId: string
}

// Composable function to inject Props, options and values to useViewRoutingSlip component
export default function useViewRoutingSlip(props: UseViewRoutingSlipProps) {
  const { getLinkedRoutingSlips, getRoutingSlip, routingSlip } = useRoutingSlip()
  // using `toRefs` to create a Reactive Reference to the `slipId` property of props
  const { slipId } = toRefs(props)

  // watch any changes in slipId to get new values
  watch(
    () => slipId.value,
    async (newSlipId, oldSlipId) => {
      if (newSlipId && newSlipId !== oldSlipId) {
        await getRoutingSlipAndLinkedRoutingSlips()
      }
    },
    { immediate: true }
  )

  async function getRoutingSlipAndLinkedRoutingSlips() {
    const getRoutingSlipRequestPayload: GetRoutingSlipRequestPayload
      = { routingSlipNumber: slipId.value, showGlobalLoader: true }
    await getRoutingSlip(getRoutingSlipRequestPayload)
    // get the linked routingslip children/parent for the current routingslip
    const routingSlipNumber = routingSlip.value?.number
    if (routingSlipNumber) {
      await getLinkedRoutingSlips(routingSlipNumber)
    }
  }

  return {
    routingSlip,
    slipId,
    getRoutingSlipAndLinkedRoutingSlips
  }
}
