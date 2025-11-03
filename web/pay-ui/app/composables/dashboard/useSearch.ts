import CommonUtils from '@/utils/common-util'
import ConfigHelper from '@/utils/config-helper'
import debounce from '@/utils/debounce'
import { useLoader } from '@/composables/common/useLoader'
import { useStatusList } from '@/composables/common/useStatusList'
import { useRoutingSlip } from '@/composables/useRoutingSlip'
import { chequeRefundCodes, ChequeRefundStatus, SlipStatus } from '@/utils/constants'

export function useSearch (isLibraryMode = false) {
  const router = useRouter()

  const {
    searchRoutingSlipTableHeaders,
    resetSearchParams,
    searchParamsExist,
    searchRoutingSlip,
    searchRoutingSlipParams,
    searchRoutingSlipResult,
    infiniteScrollCallback,
    defaultParams
  } = useRoutingSlip()

  // Adding openFromAuth=true queryparams so that we can build breadcrumbs
  // Eg of a typical breadcrumb flow = Staff Dashboard -> FAS Dashboard -> View Routing Slip: test -> View Routing Slip: testchild
  const fasUrl = `${ConfigHelper.getFasWebUrl()}?openFromAuth=true`

  const { statusLabel } = useStatusList(reactive({ value: '' }), {})
  const { isLoading, toggleLoading } = useLoader()

  const showExpandedFolio = ref<string[]>([])
  const showExpandedCheque = ref<string[]>([])
  // to make sure not updating result on keyup
  const searchParamsChanged = ref(false)
  const reachedEnd = ref(false)

  function updateSearchFilter (updates: any) {
    searchRoutingSlipParams.value = {
      ...searchRoutingSlipParams.value,
      ...defaultParams,
      ...updates
    }
    searchParamsChanged.value = true
    reachedEnd.value = false
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

  function toggleFolio (id: string) {
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

  function toggleCheque (id: string) {
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

  function formatFolioResult (invoices: any[], businessIdentifier: string | null) {
    // to make sure not updating on keyup
    if (
      !searchParamsChanged.value &&
      businessIdentifier &&
      businessIdentifier !== ''
    ) {
      return [businessIdentifier]
    }

    const folios = invoices
      .map(invoice => invoice.businessIdentifier)
      .filter(Boolean) as string[]

    return folios.length ? folios : ['-']
  }

  function navigateTo (routingSlipNumber: string) : void {
    if (isLibraryMode) {
      // This scenario would hit when the FAS Search is displayed as a plugin in Staff dashboard
      // we append queryparams so that we can persist breadcrumbs across different components and refresh issue
      // Adding viewFromAuth=true queryparams so that we can build breadcrumbs
      // Eg of a typical breadcrumb flow = Staff Dashboard -> View Routing Slip: test -> View Routing Slip: testchild
      window.location.href = `${ConfigHelper.getFasWebUrl()}view-routing-slip/${routingSlipNumber}?viewFromAuth=true`
    } else {
      //temp
      //context.root.$router.push(appendQueryParamsIfNeeded(`/view-routing-slip/${routingSlipNumber}`, context.root.$route))
      router.push(appendQueryParamsIfNeeded(`/view-routing-slip/${routingSlipNumber}`, router.currentRoute.value))
    }
  }

  const getNext = async () => {
    if (isLoading.value) return
    reachedEnd.value = await infiniteScrollCallback()
  }

  function getRefundStatusText (statusCode: string | null): string | null {
    const refundStatus = ChequeRefundStatus.find(item => item.code === statusCode)?.text || chequeRefundCodes.PROCESSING || null
    return refundStatus
  }

  function getStatusFromRefundStatus (statusCode: string): SlipStatus {
    if (statusCode === chequeRefundCodes.PROCESSING) {
      return SlipStatus.REFUNDREQUEST
    } else {
      return SlipStatus.REFUNDPROCESSED
    }
  }

  return {
    searchRoutingSlipTableHeaders,
    searchNow,
    debouncedSearch,
    searchRoutingSlipResult,
    getStatusLabel,
    searchParamsExist,
    formatFolioResult,
    showExpandedFolio,
    showExpandedCheque,
    toggleFolio,
    toggleCheque,
    isLoading,
    navigateTo,
    getNext,
    getRefundStatusText,
    updateSearchFilter
  }
}
