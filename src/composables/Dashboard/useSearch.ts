import { computed, reactive, ref, watch } from '@vue/composition-api'

import { createNamespacedHelpers } from 'vuex-composition-helpers'
import { useStatusList } from '@/composables/common/useStatusList'

const routingSlipModule = createNamespacedHelpers('routingSlip') // specific module name
const { useActions, useState, useMutations, useGetters } = routingSlipModule

export function useSearch () {
  // vuex action and state
  const { searchRoutingSlip, resetSearchParams } = useActions([
    'searchRoutingSlip',
    'resetSearchParams'
  ])
  const { searchRoutingSlipParams, searchRoutingSlipResult } = useState([
    'searchRoutingSlipParams',
    'searchRoutingSlipResult'
  ])

  const { setSearchRoutingSlipParams } = useMutations([
    'setSearchRoutingSlipParams'
  ])

  const { searchParamsPrecent } = useGetters(['searchParamsPrecent'])

  const { statusLabel } = useStatusList(reactive({ value: '' }), {})
  const headerSearch = ref<any[]>([
    {
      text: 'Routing Slip Number',
      align: 'start',
      value: 'routingSlipNumber',
      display: true
    },
    {
      text: 'Receipt Number',
      align: 'start',
      sortable: false,
      value: 'receiptNumber',
      display: true
    },
    {
      text: 'Date',
      align: 'start',
      sortable: false,
      value: 'date',
      display: true
    },
    {
      text: 'Status',
      align: 'start',
      sortable: false,
      value: 'status',
      display: true
    },
    {
      text: 'Folio Number',
      align: 'start',
      value: 'folioNumber',
      sortable: false,
      display: true
    },
    {
      text: 'Initiator',
      align: 'start',
      value: 'initiator',
      sortable: false,
      display: true
    },
    {
      text: 'Total Amount',
      align: 'right',
      value: 'total',
      sortable: false,
      display: true
    },
    {
      text: 'Actions',
      align: 'start',
      value: '',
      sortable: false,
      display: true,
      hideInSearchColumnFilter: true
    }
  ])

  const displayedHeaderSearch = ref<any[]>([])

  /*   const headerToShow: any = computed(() => {
    const displayed = []
    for (let i = 0; i < headerSearchList.length; i++) {
      if (headerSearchList[i].display) {
        displayed.push(headerSearchList[i])
      }
    }
    return displayed
  }) */

  // watch columntoshow component and update the local object if display = true
  watch(
    headerSearch,
    () => {
      displayedHeaderSearch.value = []
      for (let i = 0; i < headerSearch.value.length; i++) {
        if (headerSearch.value[i].display) {
          displayedHeaderSearch.value.push(headerSearch.value[i])
        }
      }
    },
    { immediate: true, deep: true }
  )

  function canShowColumn (columnName) {
    return displayedHeaderSearch.value.find(header => {
      return header.value === columnName
    })
  }

  // using same v-model value for getting value and update parent on change
  const routingSlipNumber: any = computed({
    get: () => {
      return searchRoutingSlipParams.value.routingSlipNumber || ''
    },
    set: (modalValue: any) => {
      setSearchRoutingSlipParams({
        ...searchRoutingSlipParams.value,
        routingSlipNumber: modalValue
      })
    }
  })

  const receiptNumber: any = computed({
    get: () => {
      return searchRoutingSlipParams.value.receiptNumber || ''
    },
    set: (modalValue: any) => {
      setSearchRoutingSlipParams({
        ...searchRoutingSlipParams.value,
        receiptNumber: modalValue
      })
    }
  })

  const status: any = computed({
    get: () => {
      return searchRoutingSlipParams.value.status || ''
    },
    set: (modalValue: any) => {
      setSearchRoutingSlipParams({
        ...searchRoutingSlipParams.value,
        status: modalValue
      })
    }
  })

  const folioNumber: any = computed({
    get: () => {
      return searchRoutingSlipParams.value.folioNumber || ''
    },
    set: (modalValue: any) => {
      setSearchRoutingSlipParams({
        ...searchRoutingSlipParams.value,
        folioNumber: modalValue
      })
    }
  })

  const initiator: any = computed({
    get: () => {
      return searchRoutingSlipParams.value.initiator || ''
    },
    set: (modalValue: any) => {
      setSearchRoutingSlipParams({
        ...searchRoutingSlipParams.value,
        initiator: modalValue
      })
    }
  })

  const totalAmount: any = computed({
    get: () => {
      return searchRoutingSlipParams.value.totalAmount || ''
    },
    set: (modalValue: any) => {
      setSearchRoutingSlipParams({
        ...searchRoutingSlipParams.value,
        totalAmount: modalValue
      })
    }
  })

  const dateFilter: any = computed({
    get: () => {
      return searchRoutingSlipParams.value.dateFilter || []
    },
    set: (modalValue: any) => {
      setSearchRoutingSlipParams({
        ...searchRoutingSlipParams.value,
        dateFilter: modalValue
      })
    }
  })

  const showExpandedFolio = ref(false)

  function applyDateFilter (dateRangeObj) {
    dateFilter.value = dateRangeObj
  }

  function searchNow () {
    searchRoutingSlip()
  }

  // get label of status
  function getStatusLabel (code: string) {
    return statusLabel(code)
  }

  function clearFilter () {
    resetSearchParams()
  }

  function formatFolioResult (routingSlip) {
    if (folioNumber.value && folioNumber.value !== '') {
      //  TODO fix change on key up
      return [folioNumber.value]
    }
    const { invoices } = routingSlip
    //  TODO fix toggling
    return invoices
      .filter(invoice => invoice.folioNumber)
      .map(value => value.folioNumber)
  }

  return {
    headerSearch,
    displayedHeaderSearch,
    status,
    routingSlipNumber,
    receiptNumber,
    dateFilter,
    folioNumber,
    initiator,
    totalAmount,
    canShowColumn,
    applyDateFilter,
    searchNow,
    searchRoutingSlipResult,
    headerToDisplay,
    getStatusLabel,
    searchParamsPrecent,
    clearFilter,
    formatFolioResult,
    showExpandedFolio
  }
}
