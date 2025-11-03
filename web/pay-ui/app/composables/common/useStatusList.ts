import type { Code } from '@/models/Code'
import { useCodes } from '@/composables/useCodes'

export function useStatusList (props : any, { emit } : any) {
  const { getRoutingSlipStatusList, routingSlipStatusList } = useCodes()
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
  function statusLabel (code: string) {
    const codeArray = selectedStatusObject(code)
    return codeArray[0]?.description || ''
  }

  /**
   * filtering array and find given value of object
   * use full when needed to set object of status
   * @param {string} code
   * @returns [{code, description}]
   */

  function selectedStatusObject (code: string) {
    return routingSlipStatusList.value?.filter(
      (statusList: any) => statusList.code === code
    )
  }

  return {
    routingSlipStatusList,
    currentStatus,
    statusLabel,
    selectedStatusObject
  }
}
