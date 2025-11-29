import type { Code } from '~/interfaces/code'
import type { SelectItem } from '@nuxt/ui'
import { ChequeRefundStatus } from '~/utils/constants'

interface StatusListProps {
  value?: string
}

interface StatusListEmit {
  emit: (event: 'update:modelValue', value: string | undefined) => void
}

interface UseStatusListSelectProps {
  column: 'status' | 'refundStatus'
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
  const { value = ref('') } = toRefs(props)

  const currentStatus = computed({
    get: () => value.value || '',
    set: (newValue: Code) => {
      emit('update:modelValue', newValue.code)
    }
  })

  onMounted(() => {
    loadRoutingSlipStatusList()
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

export function useStatusListSelect(props: UseStatusListSelectProps) {
  const { t } = useI18n()
  const isStatusColumn = props.column === 'status'
  const routingSlipStatusList = shallowRef<Code[]>([])

  const items = computed<SelectItem[]>(() => {
    const options = isStatusColumn ? routingSlipStatusList.value : ChequeRefundStatus

    return options.map(o => ({
      // @ts-expect-error - TODO: fix type mismatch between Code and ChequeRefundStatus
      label: o.text || o.description,
      value: o.code
    }))
  })

  const placeholder = isStatusColumn
    ? t('label.status')
    : t('label.refundStatus')

  async function loadStatusList() {
    if (isStatusColumn && routingSlipStatusList.value.length === 0) {
      routingSlipStatusList.value = await loadRoutingSlipStatusList()
    }
  }

  onMounted(() => {
    loadStatusList()
  })

  return {
    items,
    placeholder,
    routingSlipStatusList
  }
}
