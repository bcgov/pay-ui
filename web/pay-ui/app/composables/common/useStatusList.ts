import type { Code } from '~/interfaces/code'
import type { SelectItem } from '@nuxt/ui'
import { ChequeRefundStatus } from '~/utils/constants'
import ShortNameUtils from '~/utils/short-name-util'

interface StatusListProps {
  value?: string
}

interface StatusListEmit {
  emit: (event: 'update:modelValue', value: string | undefined) => void
}

async function loadRoutingSlipStatusList() {
  try {
    return await usePayApi().getCodes<Code>('routing_slip_statuses')
  } catch {
    return []
  }
}

export async function useStatusList(props: StatusListProps, { emit }: StatusListEmit) {
  const routingSlipStatusList = ref<Code[]>(await loadRoutingSlipStatusList())
  const value = toRef(props, 'value')

  const currentStatus = computed({
    get: () => value.value || '',
    set: (newValue: Code) => {
      emit('update:modelValue', newValue.code)
    }
  })

  function statusLabel(code: string) {
    const statusObject = selectedStatusObject(code)
    return statusObject?.description || ''
  }

  function selectedStatusObject(code: string): Code | undefined {
    return routingSlipStatusList.value?.find(
      statusList => statusList.code === code
    )
  }

  return {
    routingSlipStatusList,
    currentStatus,
    statusLabel,
    selectedStatusObject
  }
}

// Helper to load routing slip status list
export async function useRoutingSlipStatusList() {
  const list = shallowRef<Code[]>([])

  async function load() {
    if (list.value.length === 0) {
      list.value = await loadRoutingSlipStatusList()
    }
  }

  const mapFn = (item: Code): SelectItem => ({
    label: item.description,
    value: item.code
  })

  await load()

  return {
    list,
    mapFn,
    load
  }
}

// Helper to get cheque refund status list
export function useChequeRefundStatusList() {
  const list = computed(() => ChequeRefundStatus)

  const mapFn = (item: any): SelectItem => ({
    label: item.text,
    value: item.code
  })

  return {
    list,
    mapFn
  }
}

// Helper to get short name type list
export function useShortNameTypeList() {
  const list = computed(() => ShortNameUtils.ShortNameTypeItems)

  const mapFn = (item: any): SelectItem => ({
    label: item.label,
    value: item.value
  })

  return {
    list,
    mapFn
  }
}
