import CommonUtils from '@/utils/common-util'
import { useRoutingSlip } from '@/composables/useRoutingSlip'

export function useDailyReport() {
  const selectedDate = ref<string | null>(null)
  const showCalendar = ref<boolean>(false)
  const isDownloading = ref<boolean>(false)

  const { getDailyReportByDate } = useRoutingSlip()

  async function getDailyReport() {
    if (!selectedDate.value) {
      return
    }
    isDownloading.value = true
    const downloadType = 'application/pdf'
    try {
      const response = await getDailyReportByDate(selectedDate.value, downloadType)
      if (response && response.type === downloadType) {
        const fileName = 'Routing-Slip-Daily-Report-' + selectedDate.value + '.pdf'
        CommonUtils.fileDownload(response, fileName, downloadType)
      } else {
        console.error(response)
      }
    } finally {
      isDownloading.value = false
    }
  }

  function toggleCalendar(value: boolean) {
    showCalendar.value = value
  }

  return {
    selectedDate,
    getDailyReport,
    showCalendar,
    isDownloading,
    toggleCalendar
  }
}
