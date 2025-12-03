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

  it('should be defined', () => {
    const composable = useDailyReport()
    expect(composable).toBeDefined()
  })

  it('should return selectedDate, getDailyReport, showCalendar, isDownloading, and toggleCalendar', () => {
    const { selectedDate, getDailyReport, showCalendar, isDownloading, toggleCalendar } = useDailyReport()
    expect(selectedDate).toBeDefined()
    expect(getDailyReport).toBeDefined()
    expect(showCalendar).toBeDefined()
    expect(isDownloading).toBeDefined()
    expect(toggleCalendar).toBeDefined()
  })

  it('should initialize with default values', () => {
    const { selectedDate, showCalendar, isDownloading } = useDailyReport()
    expect(selectedDate.value).toBeNull()
    expect(showCalendar.value).toBe(false)
    expect(isDownloading.value).toBe(false)
  })

  it('should not call getDailyReportByDate when selectedDate is null', async () => {
    const { getDailyReport } = useDailyReport()
    await getDailyReport()
    expect(mockGetDailyReportByDate).not.toHaveBeenCalled()
  })

  it('should not call getDailyReportByDate when selectedDate is empty string', async () => {
    const { selectedDate, getDailyReport } = useDailyReport()
    selectedDate.value = ''
    await getDailyReport()
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

  it('should set isDownloading to true during download', async () => {
    const mockBlob = new Blob(['test'], { type: 'application/pdf' })
    mockGetDailyReportByDate.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockBlob), 100)))

    const { selectedDate, getDailyReport, isDownloading } = useDailyReport()
    selectedDate.value = '2025-09-26'

    const downloadPromise = getDailyReport()
    expect(isDownloading.value).toBe(true)

    await downloadPromise
    expect(isDownloading.value).toBe(false)
  })

  it('should set isDownloading to false even if download fails', async () => {
    mockGetDailyReportByDate.mockRejectedValue(new Error('Download failed'))

    const { selectedDate, getDailyReport, isDownloading } = useDailyReport()
    selectedDate.value = '2025-09-26'

    try {
      await getDailyReport()
    } catch {
      // Error is expected, but isDownloading should still be false
    }
    expect(isDownloading.value).toBe(false)
  })

  it('should not call fileDownload when response type is not PDF', async () => {
    const mockBlob = new Blob(['test'], { type: 'text/plain' })
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockGetDailyReportByDate.mockResolvedValue(mockBlob)

    const { selectedDate, getDailyReport } = useDailyReport()
    selectedDate.value = '2025-09-26'
    await getDailyReport()

    expect(mockGetDailyReportByDate).toHaveBeenCalled()
    expect(mockFileDownload).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalledWith(mockBlob)
    consoleErrorSpy.mockRestore()
  })

  it('should toggle calendar when toggleCalendar is called', () => {
    const { showCalendar, toggleCalendar } = useDailyReport()
    expect(showCalendar.value).toBe(false)

    toggleCalendar(true)
    expect(showCalendar.value).toBe(true)

    toggleCalendar(false)
    expect(showCalendar.value).toBe(false)
  })

  it('should handle null response from getDailyReportByDate', async () => {
    mockGetDailyReportByDate.mockResolvedValue(null)

    const { selectedDate, getDailyReport } = useDailyReport()
    selectedDate.value = '2025-09-26'
    await getDailyReport()

    expect(mockGetDailyReportByDate).toHaveBeenCalled()
    expect(mockFileDownload).not.toHaveBeenCalled()
  })
})
