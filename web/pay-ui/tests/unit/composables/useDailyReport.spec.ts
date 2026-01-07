import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useDailyReport } from '~/composables/useDailyReport'

const { mockGetDailyReportByDate, mockFileDownload } = vi.hoisted(() => {
  return {
    mockGetDailyReportByDate: vi.fn(),
    mockFileDownload: vi.fn()
  }
})

const mockUseRoutingSlip = {
  getDailyReportByDate: mockGetDailyReportByDate
}

mockNuxtImport('useRoutingSlip', () => () => mockUseRoutingSlip)

vi.mock('~/utils/common-util', () => ({
  default: {
    fileDownload: mockFileDownload
  }
}))

describe('useDailyReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should be defined, return all expected properties, and initialize with default values', () => {
    const composable = useDailyReport()
    expect(composable).toBeDefined()
    const { selectedDate, getDailyReport, showCalendar, isDownloading, toggleCalendar } = composable
    expect(selectedDate).toBeDefined()
    expect(getDailyReport).toBeDefined()
    expect(showCalendar).toBeDefined()
    expect(isDownloading).toBeDefined()
    expect(toggleCalendar).toBeDefined()
    expect(selectedDate.value).toBeNull()
    expect(showCalendar.value).toBe(false)
    expect(isDownloading.value).toBe(false)
  })

  it('should not call getDailyReportByDate when selectedDate is null or empty', async () => {
    const { getDailyReport } = useDailyReport()
    await getDailyReport()
    expect(mockGetDailyReportByDate).not.toHaveBeenCalled()

    const { selectedDate, getDailyReport: getDailyReport2 } = useDailyReport()
    selectedDate.value = ''
    await getDailyReport2()
    expect(mockGetDailyReportByDate).not.toHaveBeenCalled()
  })

  it('should call getDailyReportByDate and fileDownload when selectedDate is set and response is PDF', async () => {
    const mockBlob = new Blob(['test'], { type: 'application/pdf' })
    mockGetDailyReportByDate.mockResolvedValue(mockBlob)

    const { selectedDate, getDailyReport } = useDailyReport()
    selectedDate.value = '2025-09-26'
    await getDailyReport()

    expect(mockGetDailyReportByDate).toHaveBeenCalledWith('2025-09-26', 'application/pdf')
    expect(mockFileDownload).toHaveBeenCalledWith(
      mockBlob,
      'Routing-Slip-Daily-Report-2025-09-26.pdf',
      'application/pdf'
    )
  })

  it('should handle isDownloading state during download and on failure', async () => {
    const mockBlob = new Blob(['test'], { type: 'application/pdf' })
    mockGetDailyReportByDate.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockBlob), 100)))

    const { selectedDate, getDailyReport, isDownloading } = useDailyReport()
    selectedDate.value = '2025-09-26'

    const downloadPromise = getDailyReport()
    expect(isDownloading.value).toBe(true)

    await downloadPromise
    expect(isDownloading.value).toBe(false)

    mockGetDailyReportByDate.mockRejectedValue(new Error('Download failed'))
    try {
      await getDailyReport()
    } catch {
      // Error is expected, but isDownloading should still be false
    }
    expect(isDownloading.value).toBe(false)
  })

  it('should handle non-PDF responses, toggle calendar, and handle null responses', async () => {
    const mockBlob = new Blob(['test'], { type: 'text/plain' })
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockGetDailyReportByDate.mockResolvedValue(mockBlob)

    const { selectedDate, getDailyReport } = useDailyReport()
    selectedDate.value = '2025-09-26'
    await getDailyReport()

    expect(mockGetDailyReportByDate).toHaveBeenCalled()
    expect(mockFileDownload).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalledWith(mockBlob)

    const { showCalendar, toggleCalendar } = useDailyReport()
    expect(showCalendar.value).toBe(false)
    toggleCalendar(true)
    expect(showCalendar.value).toBe(true)
    toggleCalendar(false)
    expect(showCalendar.value).toBe(false)

    mockGetDailyReportByDate.mockResolvedValue(null)
    await getDailyReport()
    expect(mockGetDailyReportByDate).toHaveBeenCalled()
    expect(mockFileDownload).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalledWith(null)
    consoleErrorSpy.mockRestore()
  })
})
