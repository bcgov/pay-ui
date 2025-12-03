import type { GetRoutingSlipRequestPayload } from '@/interfaces/routing-slip'
import { useRoutingSlip } from '@/composables/useRoutingSlip'
import { useLoader } from '@/composables/common/useLoader'
import { toRef } from 'vue'

interface UseViewRoutingSlipProps {
  slipId: string
}

export default function useViewRoutingSlip(props: UseViewRoutingSlipProps) {
  const { getLinkedRoutingSlips, getRoutingSlip } = useRoutingSlip()
  const { store } = useRoutingSlipStore()
  const { toggleLoading } = useLoader()
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
    toggleLoading(true)
    try {
      const getRoutingSlipRequestPayload: GetRoutingSlipRequestPayload
        = { routingSlipNumber: slipId.value }
      await getRoutingSlip(getRoutingSlipRequestPayload)
      const routingSlipNumber = store.routingSlip.number
      if (routingSlipNumber) {
        await getLinkedRoutingSlips(routingSlipNumber)
      }
    }
    catch (error) {
      console.error('Error getting routing slip and linked routing slips:', error)
    }
    finally {
      toggleLoading(false)
    }
  }

  return {
    slipId,
    getRoutingSlipAndLinkedRoutingSlips
  }
}
