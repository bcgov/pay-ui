import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useShortNameDetails } from '~/composables/eft/useShortNameDetails'

const mockPayApi = vi.fn()

mockNuxtImport('useNuxtApp', () => () => ({
  $payApi: mockPayApi,
  $payApiWithErrorHandling: mockPayApi
}))

describe('useShortNameDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct default values', () => {
    const shortNameId = ref(123)
    const {
      shortNameDetails,
      shortName,
      loading,
      notFound
    } = useShortNameDetails(shortNameId)

    expect(shortNameDetails.value).toBeNull()
    expect(shortName.value).toBeNull()
    expect(loading.value).toBe(true)
    expect(notFound.value).toBe(false)
  })

  describe('loadShortname', () => {
    it('should load short name details successfully', async () => {
      const mockSummary = {
        items: [{
          id: 123,
          shortName: 'TEST_SN',
          shortNameType: 'EFT',
          creditsRemaining: 1000,
          linkedAccountsCount: 2
        }]
      }
      const mockShortName = {
        id: 123,
        shortName: 'TEST_SN',
        shortNameType: 'EFT',
        casSupplierNumber: 'SUP123',
        casSupplierSite: 'SITE1',
        email: 'test@example.com'
      }

      mockPayApi
        .mockResolvedValueOnce(mockSummary)
        .mockResolvedValueOnce(mockShortName)

      const shortNameId = ref(123)
      const { loadShortname, shortNameDetails, shortName, loading, notFound } = useShortNameDetails(shortNameId)

      await loadShortname()

      expect(shortNameDetails.value).toEqual(mockSummary.items[0])
      expect(shortName.value).toEqual(mockShortName)
      expect(loading.value).toBe(false)
      expect(notFound.value).toBe(false)
    })

    it('should set notFound when summary returns empty items', async () => {
      mockPayApi.mockResolvedValue({ items: [] })

      const shortNameId = ref(123)
      const { loadShortname, notFound, loading } = useShortNameDetails(shortNameId)

      await loadShortname()

      expect(notFound.value).toBe(true)
      expect(loading.value).toBe(false)
    })

    it('should set notFound on API error', async () => {
      mockPayApi.mockRejectedValue(new Error('API Error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const shortNameId = ref(123)
      const { loadShortname, notFound, loading } = useShortNameDetails(shortNameId)

      await loadShortname()

      expect(notFound.value).toBe(true)
      expect(loading.value).toBe(false)
      consoleSpy.mockRestore()
    })

    it('should not reload if already notFound', async () => {
      mockPayApi.mockResolvedValue({ items: [] })

      const shortNameId = ref(123)
      const { loadShortname, notFound } = useShortNameDetails(shortNameId)

      await loadShortname()
      expect(notFound.value).toBe(true)

      mockPayApi.mockClear()
      await loadShortname()

      expect(mockPayApi).not.toHaveBeenCalled()
    })

    it('should call correct API endpoints', async () => {
      mockPayApi
        .mockResolvedValueOnce({ items: [{ id: 456 }] })
        .mockResolvedValueOnce({ id: 456 })

      const shortNameId = ref(456)
      const { loadShortname } = useShortNameDetails(shortNameId)

      await loadShortname()

      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/summaries?shortNameId=456',
        { method: 'GET' }
      )
      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/456',
        { method: 'GET' }
      )
    })
  })

  describe('refreshShortName', () => {
    it('should refresh short name data', async () => {
      const mockSummary = { items: [{ id: 123 }] }
      const mockShortName = { id: 123, shortName: 'TEST' }
      const mockUpdatedShortName = { id: 123, shortName: 'TEST', email: 'new@example.com' }

      mockPayApi
        .mockResolvedValueOnce(mockSummary)
        .mockResolvedValueOnce(mockShortName)
        .mockResolvedValueOnce(mockUpdatedShortName)

      const shortNameId = ref(123)
      const { loadShortname, refreshShortName, shortName } = useShortNameDetails(shortNameId)

      await loadShortname()
      expect(shortName.value).toEqual(mockShortName)

      await refreshShortName()
      expect(shortName.value).toEqual(mockUpdatedShortName)
    })

    it('should not refresh if shortNameDetails is null', async () => {
      const shortNameId = ref(123)
      const { refreshShortName } = useShortNameDetails(shortNameId)

      await refreshShortName()

      expect(mockPayApi).not.toHaveBeenCalled()
    })
  })

  describe('patchShortName', () => {
    it('should patch short name successfully', async () => {
      const mockSummary = { items: [{ id: 123 }] }
      const mockShortName = { id: 123, shortName: 'TEST' }
      const mockUpdatedShortName = { id: 123, shortName: 'TEST', email: 'new@example.com' }

      mockPayApi
        .mockResolvedValueOnce(mockSummary)
        .mockResolvedValueOnce(mockShortName)
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce(mockUpdatedShortName)

      const shortNameId = ref(123)
      const { loadShortname, patchShortName, shortName } = useShortNameDetails(shortNameId)

      await loadShortname()
      const result = await patchShortName({ email: 'new@example.com' })

      expect(result).toEqual({ success: true })
      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/123',
        { method: 'PATCH', body: { email: 'new@example.com' } }
      )
      expect(shortName.value).toEqual(mockUpdatedShortName)
    })

    it('should patch CAS supplier number', async () => {
      mockPayApi
        .mockResolvedValueOnce({ items: [{ id: 123 }] })
        .mockResolvedValueOnce({ id: 123 })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ id: 123, casSupplierNumber: 'NEW123' })

      const shortNameId = ref(123)
      const { loadShortname, patchShortName } = useShortNameDetails(shortNameId)

      await loadShortname()
      const result = await patchShortName({ casSupplierNumber: 'NEW123' })

      expect(result).toEqual({ success: true })
      expect(mockPayApi).toHaveBeenCalledWith(
        '/eft-shortnames/123',
        { method: 'PATCH', body: { casSupplierNumber: 'NEW123' } }
      )
    })

    it('should patch CAS supplier site', async () => {
      mockPayApi
        .mockResolvedValueOnce({ items: [{ id: 123 }] })
        .mockResolvedValueOnce({ id: 123 })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ id: 123, casSupplierSite: 'NEWSITE' })

      const shortNameId = ref(123)
      const { loadShortname, patchShortName } = useShortNameDetails(shortNameId)

      await loadShortname()
      const result = await patchShortName({ casSupplierSite: 'NEWSITE' })

      expect(result).toEqual({ success: true })
    })

    it('should return failure if shortNameDetails is null', async () => {
      const shortNameId = ref(123)
      const { patchShortName } = useShortNameDetails(shortNameId)

      const result = await patchShortName({ email: 'test@example.com' })

      expect(result).toEqual({ success: false })
      expect(mockPayApi).not.toHaveBeenCalled()
    })

    it('should handle patch error', async () => {
      const mockError = new Error('Patch failed')
      mockPayApi
        .mockResolvedValueOnce({ items: [{ id: 123 }] })
        .mockResolvedValueOnce({ id: 123 })
        .mockRejectedValueOnce(mockError)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const shortNameId = ref(123)
      const { loadShortname, patchShortName } = useShortNameDetails(shortNameId)

      await loadShortname()
      const result = await patchShortName({ email: 'test@example.com' })

      expect(result).toEqual({ success: false, error: mockError })
      consoleSpy.mockRestore()
    })
  })
})
