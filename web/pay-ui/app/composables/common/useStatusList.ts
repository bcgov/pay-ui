import type { Code } from '~/interfaces/code'

interface StatusListProps {
  value?: string
}

interface StatusListEmit {
  emit: (event: 'update:modelValue', value: string | undefined) => void
}

export async function useStatusList(props: StatusListProps, { emit }: StatusListEmit) {
  const getRoutingSlipStatusList = async () => {
    const response = await usePayApi().getCodes<Code>('routing_slip_statuses')
    return response
  }

  const routingSlipStatusList = ref<Code[]>(await getRoutingSlipStatusList())
  // default value set blank incase if we didnt pass props
  const { value = ref('') } = toRefs(props)

  const currentStatus = computed({
    get: () => value.value || '',
    set: (newValue: Code) => {
      emit('update:modelValue', newValue.code)
    }
  })

  onMounted(() => {
    // getting status list mouint and setting inside store
    // will make call once till page refresh
    getRoutingSlipStatusList()
  })

  /**
   * return status label on code
   *
   * @param {string} code
   * @returns {string} description - label
   */
  function statusLabel(code: string) {
    const statusObject = selectedStatusObject(code)
    return statusObject?.description || ''
  }

  /**
   * filtering array and find given value of object
   * use full when needed to set object of status
   * @param {string} code
   * @returns {Code | undefined} status object with code and description
   */
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
