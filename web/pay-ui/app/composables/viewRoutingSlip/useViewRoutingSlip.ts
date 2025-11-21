import type { GetRoutingSlipRequestPayload } from '@/interfaces/routing-slip'
import { useRoutingSlip } from '@/composables/useRoutingSlip'
import { toRef } from 'vue'

interface UseViewRoutingSlipProps {
  slipId: string
}

export default function useViewRoutingSlip(props: UseViewRoutingSlipProps) {
  const { getLinkedRoutingSlips, getRoutingSlip, routingSlip } = useRoutingSlip()
  const slipId = toRef(props, 'slipId')

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
