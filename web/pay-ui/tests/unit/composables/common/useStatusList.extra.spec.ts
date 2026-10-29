import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import {
  useRoutingSlipStatusList,
  useShortNameTypeList,
  usePaymentMethodsList,
  useInvoiceStatusList,
  useProductList
} from '~/composables/common/useStatusList'
import ShortNameUtils from '~/utils/short-name-util'
import { PaymentMethodSelectItems } from '~/enums'
import { PaymentStatusList } from '~/utils/invoice-status-util'
import { productDisplay } from '~/utils/product-util'
import CommonUtils from '~/utils/common-util'

const { mockGetCodes } = vi.hoisted(() => ({ mockGetCodes: vi.fn() }))

mockNuxtImport('usePayApi', () => () => ({ getCodes: mockGetCodes }))

describe('useStatusList helpers (extra)', () => {
  describe('useRoutingSlipStatusList', () => {
    it('returns an empty list when the codes API rejects', async () => {
      mockGetCodes.mockRejectedValue(new Error('down'))
      const { list } = await useRoutingSlipStatusList()
      expect(list.value).toEqual([])
    })

    it('load() does not refetch once the list is populated', async () => {
      mockGetCodes.mockResolvedValue([{ code: 'ACTIVE', description: 'Active' }])
      const { list, load } = await useRoutingSlipStatusList()
      expect(mockGetCodes).toHaveBeenCalledTimes(1)

      await load()
      expect(mockGetCodes).toHaveBeenCalledTimes(1)
      expect(list.value).toEqual([{ code: 'ACTIVE', description: 'Active' }])
    })

    it('load() retries when the previous load produced an empty list', async () => {
      mockGetCodes.mockResolvedValueOnce([])
      const { list, load } = await useRoutingSlipStatusList()
      mockGetCodes.mockResolvedValueOnce([{ code: 'NSF', description: 'NSF' }])

      await load()
      expect(mockGetCodes).toHaveBeenCalledTimes(2)
      expect(list.value).toEqual([{ code: 'NSF', description: 'NSF' }])
    })
  })

  it('useShortNameTypeList exposes short name types mapped to select items', () => {
    const { list, mapFn } = useShortNameTypeList()
    expect(list.value).toEqual(ShortNameUtils.ShortNameTypeItems)
    expect(mapFn({ label: 'EFT', value: 'EFT' })).toEqual({ label: 'EFT', value: 'EFT' })
  })

  it('usePaymentMethodsList maps text to label', () => {
    const { list, mapFn } = usePaymentMethodsList()
    expect(list.value).toEqual(PaymentMethodSelectItems)
    const first = list.value[0]!
    expect(mapFn(first)).toEqual({ label: first.text, value: first.value })
  })

  it('useInvoiceStatusList returns items unchanged', () => {
    const { list, mapFn } = useInvoiceStatusList()
    expect(list.value).toEqual(PaymentStatusList)
    const item = { label: 'Paid', value: 'PAID' }
    expect(mapFn(item)).toBe(item)
  })

  describe('useProductList', () => {
    it('returns every product when the user can access all product codes', () => {
      vi.spyOn(CommonUtils, 'getRoleProductCodes').mockImplementation(codes => codes)
      const { list, mapFn } = useProductList()
      expect(list.value).toEqual(Object.entries(productDisplay).map(([value, label]) => ({ label, value })))
      expect(mapFn(list.value[0]!)).toBe(list.value[0])
    })

    it('filters products by the codes the user can access', () => {
      const [firstCode, secondCode] = Object.keys(productDisplay)
      const spy = vi.spyOn(CommonUtils, 'getRoleProductCodes').mockReturnValue([secondCode!])
      const { list } = useProductList()
      expect(list.value).toEqual([
        { label: productDisplay[secondCode as keyof typeof productDisplay], value: secondCode }
      ])
      expect(list.value.some(p => p.value === firstCode)).toBe(false)
      expect(spy).toHaveBeenCalledWith(Object.keys(productDisplay))
    })

    it('returns no products when the user has no product roles', () => {
      vi.spyOn(CommonUtils, 'getRoleProductCodes').mockReturnValue([])
      expect(useProductList().list.value).toEqual([])
    })
  })
})
