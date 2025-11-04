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

    try {
      const downloadType = 'application/pdf'
      const response = await getDailyReportByDate(selectedDate.value, downloadType)
      if (response && response.status === 201) {
        const contentDispArr = response?.headers['content-disposition'].split(
          '='
        )

        const fileName
          = contentDispArr.length && contentDispArr[1]
            ? contentDispArr[1]
            : 'bcregistry-daily-report'

        CommonUtils.fileDownload(response.data, fileName, downloadType)
      } else {
        console.error(response)
      }
    } finally {
      //  close cal after download
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
