import { computed, onMounted, reactive, ref, toRefs } from '@vue/composition-api'

import CommonUtils from '@/util/common-util'
import ConfigHelper from '@/util/config-helper'
import debounce from '@/util/debounce'
import { useLoader } from '@/composables/common/useLoader'
import { useStatusList } from '@/composables/common/useStatusList'
import { useRoutingSlip } from '../useRoutingSlip'
import { RoutingSlipRefundCodes, ChequeRefundStatus, SlipStatus } from '@/util/constants'

export function useSearch (props, context) {
  const {
    headerSearchTitle,
    resetSearchParams,
    searchParamsExist,
    searchRoutingSlip,
    searchRoutingSlipParams,
    searchRoutingSlipResult,
    infiniteScrollCallback,
    defaultParams
  } = useRoutingSlip()
  const { isLibraryMode } = toRefs(props)
  // Adding openFromAuth=true queryparams so that we can build breadcrumbs
  // Eg of a typical breadcrumb flow = Staff Dashboard -> FAS Dashboard -> View Routing Slip: test -> View Routing Slip: testchild
  const fasUrl = `${ConfigHelper.getFasWebUrl()}?openFromAuth=true`

  const { statusLabel } = useStatusList(reactive({ value: '' }), {})
  const { isLoading, toggleLoading } = useLoader()

  const showExpandedFolio = ref([])
  const showExpandedCheque = ref([])
  // to make sure not updating result on keyup
  const searchParamsChanged = ref(false)
  const reachedEnd = ref(false)

  const headerSearch: any = computed({
    get: () => {
      return headerSearchTitle.value || []
    },
    set: (modalValue: any) => {
      headerSearchTitle.value = modalValue
    }
  })

  // columntoshow component and update the local object if display = true
  const displayedHeaderSearch: any = computed(() => {
    const displayed = []
    for (let i = 0; i < headerSearch.value?.length; i++) {
      if (headerSearch.value[i].display) {
        displayed.push(headerSearch.value[i])
      }
    }
    return displayed
  })

  function canShowColumn (columnName) {
    return displayedHeaderSearch.value.find(header => {
      return header.value === columnName
    })
  }

  function updateSearchFilter (updates: any) {
    searchRoutingSlipParams.value = {
      ...searchRoutingSlipParams.value,
      ...defaultParams,
      ...updates
    }
    searchParamsChanged.value = true
    reachedEnd.value = false
  }

  // using same v-model value for getting value and update parent on change
  const routingSlipNumber: any = computed({
    get: () => {
      return searchRoutingSlipParams.value.routingSlipNumber || ''
    },
    set: (modalValue: any) => {
      updateSearchFilter({
        routingSlipNumber: modalValue
      })
    }
  })

  const receiptNumber: any = computed({
    get: () => {
      return searchRoutingSlipParams.value.receiptNumber || ''
    },
    set: (modalValue: any) => {
      updateSearchFilter({
        receiptNumber: modalValue
      })
    }
  })

  const status: any = computed({
    get: () => {
      return searchRoutingSlipParams.value.status || ''
    },
    set: (modalValue: any) => {
      updateSearchFilter({
        status: modalValue
      })
    }
  })

  const refundStatus: any = computed({
    get: () => {
      return searchRoutingSlipParams.value.refundStatus || ''
    },
    set: (modalValue: any) => {
      updateSearchFilter({
        refundStatus: modalValue
      })
    }
  })

  const businessIdentifier: any = computed({
    get: () => {
      return searchRoutingSlipParams.value.businessIdentifier || ''
    },
    set: (modalValue: any) => {
      updateSearchFilter({
        businessIdentifier: modalValue
      })
    }
  })

  const accountName: any = computed({
    get: () => {
      return searchRoutingSlipParams.value?.accountName || ''
    },
    set: (modalValue: any) => {
      updateSearchFilter({
        accountName: modalValue
      })
    }
  })

  const initiator: any = computed({
    get: () => {
      return searchRoutingSlipParams.value.initiator || ''
    },
    set: (modalValue: any) => {
      updateSearchFilter({
        initiator: modalValue
      })
    }
  })

  const remainingAmount: any = computed({
    get: () => {
      return searchRoutingSlipParams.value.remainingAmount || ''
    },
    set: (modalValue: any) => {
      updateSearchFilter({
        remainingAmount: modalValue
      })
    }
  })

  const dateFilter: any = computed({
    get: () => {
      return searchRoutingSlipParams.value.dateFilter || []
    },
    set: (modalValue: any) => {
      updateSearchFilter({
        dateFilter: modalValue
      })
    }
  })

  const chequeReceiptNumber: any = computed({
    get: () => {
      return searchRoutingSlipParams.value.chequeReceiptNumber || ''
    },
    set: (modalValue: any) => {
      updateSearchFilter({
        chequeReceiptNumber: modalValue
      })
    }
  })

  function applyDateFilter (dateRangeObj) {
    dateFilter.value = dateRangeObj
  }

  async function searchNow () {
    toggleLoading()
    await searchRoutingSlip()
    searchParamsChanged.value = false
    toggleLoading()
  }

  onMounted(() => {
    // To be triggered when coming back to FAS home page from a breadcrumb and if there are any search params present
    if (!searchParamsExist.value) {
      searchNow()
    }
  })

  const debouncedSearch = debounce(() => {
    searchNow()
  })

  const appendQueryParamsIfNeeded = CommonUtils.appendQueryParamsIfNeeded

  // get label of status
  function getStatusLabel (code: string) {
    return statusLabel(code)
  }

  async function clearFilter () {
    toggleLoading()
    resetSearchParams()
    await searchRoutingSlip()
    searchParamsChanged.value = false
    toggleLoading()
  }

  function toggleFolio (id: number) {
    //  to show and hide multiple folio on click
    // remove from array if already existing else add to array
    if (showExpandedFolio.value.includes(id)) {
      showExpandedFolio.value = showExpandedFolio.value.filter(function (item) {
        return item !== id
      })
    } else {
      showExpandedFolio.value.push(id)
    }
  }

  function toggleCheque (id: number) {
    //  to show and hide multiple folio on click
    // remove from array if already existing else add to array
    if (showExpandedCheque.value.includes(id)) {
      showExpandedCheque.value = showExpandedCheque.value.filter(function (item) {
        return item !== id
      })
    } else {
      showExpandedCheque.value.push(id)
    }
  }

  function formatFolioResult (routingSlip) {
    // to make sure not updating on keyup
    if (
      !searchParamsChanged.value &&
      businessIdentifier.value &&
      businessIdentifier.value !== ''
    ) {
      return [businessIdentifier.value]
    }
    const { invoices } = routingSlip

    if (invoices) {
      return invoices
        .filter(invoice => invoice.businessIdentifier)
        .map(value => value.businessIdentifier)
    }
    return ['-']
  }

  function navigateTo (routingSlipNumber: number) : void {
    if (isLibraryMode.value) {
      // This scenario would hit when the FAS Search is displayed as a plugin in Staff dashboard
      // we append queryparams so that we can persist breadcrumbs across different components and refresh issue
      // Adding viewFromAuth=true queryparams so that we can build breadcrumbs
      // Eg of a typical breadcrumb flow = Staff Dashboard -> View Routing Slip: test -> View Routing Slip: testchild
      window.location.href = `${ConfigHelper.getFasWebUrl()}view-routing-slip/${routingSlipNumber}?viewFromAuth=true`
    } else {
      context.root.$router.push(appendQueryParamsIfNeeded(`/view-routing-slip/${routingSlipNumber}`, context.root.$route))
    }
  }

  const getNext = debounce(async () => {
    if (isLoading.value) return
    reachedEnd.value = await infiniteScrollCallback()
  }, 100) // Adjust the wait time as needed

  function getRefundStatusText (statusCode: string | undefined): string {
    const refundStatus = ChequeRefundStatus.find(item => item.code === statusCode)?.text || RoutingSlipRefundCodes.PROCESSING
    return refundStatus
  }

  function getStatusFromRefundStatus (statusCode: string): SlipStatus {
    if (statusCode === RoutingSlipRefundCodes.PROCESSING) {
      return SlipStatus.REFUNDREQUEST
    } else {
      return SlipStatus.REFUNDPROCESSED
    }
  }

  return {
    headerSearch,
    displayedHeaderSearch,
    status,
    refundStatus,
    routingSlipNumber,
    receiptNumber,
    dateFilter,
    businessIdentifier,
    accountName,
    remainingAmount,
    chequeReceiptNumber,
    canShowColumn,
    applyDateFilter,
    searchNow,
    debouncedSearch,
    searchRoutingSlipResult,
    getStatusLabel,
    searchParamsExist,
    clearFilter,
    formatFolioResult,
    showExpandedFolio,
    showExpandedCheque,
    toggleFolio,
    toggleCheque,
    isLoading,
    navigateTo,
    fasUrl,
    initiator,
    reachedEnd,
    getNext,
    getRefundStatusText,
    getStatusFromRefundStatus
  }
}
