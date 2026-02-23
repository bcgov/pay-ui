import type { Code } from '~/interfaces/code'
import type { SelectItem } from '@nuxt/ui'
import { ChequeRefundStatus } from '~/utils/constants'
import ShortNameUtils from '~/utils/short-name-util'
import { PaymentMethodSelectItems } from '~/enums'
import { productDisplay } from '~/utils/product-util'
import { PaymentStatusList } from '~/utils/invoice-status-util'

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

interface ChequeRefundStatusItem {
  code: string
  text: string
  display: boolean
}

// Helper to get cheque refund status list
export function useChequeRefundStatusList() {
  const list = computed(() => ChequeRefundStatus)

  const mapFn = (item: ChequeRefundStatusItem): SelectItem => ({
    label: item.text,
    value: item.code
  })

  return {
    list,
    mapFn
  }
}

interface ShortNameTypeItem {
  label: string
  value: string
}

// Helper to get short name type list
export function useShortNameTypeList() {
  const list = computed(() => ShortNameUtils.ShortNameTypeItems)

  const mapFn = (item: ShortNameTypeItem): SelectItem => ({
    label: item.label,
    value: item.value
  })

  return {
    list,
    mapFn
  }
}

interface PaymentMethodSelectItem {
  text: string
  value: string
}

// Helper to get payment methods list
export function usePaymentMethodsList() {
  const list = computed(() => PaymentMethodSelectItems)
  const mapFn = (item: PaymentMethodSelectItem): SelectItem => ({
    label: item.text,
    value: item.value
  })

  return {
    list,
    mapFn
  }
}

// Helper to get invoice status list
export function useInvoiceStatusList() {
  const list = computed(() => PaymentStatusList)

  const mapFn = (item: SelectItem): SelectItem => item

  return {
    list,
    mapFn
  }
}

// Helper to get product (Application Type) list
export function useProductList() {
  const list = computed(() =>
    Object.entries(productDisplay).map(([value, label]) => ({ label, value }))
  )

  const mapFn = (item: SelectItem): SelectItem => item

  return {
    list,
    mapFn
  }
}
