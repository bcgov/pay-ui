import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { StatusList } from '#components'

const mockGetCodes = vi.fn()
mockNuxtImport('usePayApi', () => {
  return () => ({
    getCodes: mockGetCodes
  })
})

describe('StatusList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('when column is "refundStatus"', () => {
    it('should render with the correct options and props', async () => {
      const wrapper = await mountSuspended(StatusList, {
        props: {
          column: 'refundStatus',
          modelValue: ''
        },
        global: { stubs: { USelect: true } }
      })

      const select = wrapper.findComponent({ name: 'USelect' })
      expect(select.exists()).toBe(true)

      expect(select.props('placeholder')).toBe('Refund Status')

      const expectedItems = ChequeRefundStatus.map(item => ({
        label: item.text,
        value: item.code
      }))

      expect(select.props('items')).toEqual(expectedItems)

      expect(mockGetCodes).not.toHaveBeenCalled()
    })
  })

  describe('when column is "status"', () => {
    const mockCodes = [
      { code: 'ACTIVE', description: 'Active Status' },
      { code: 'HOLD', description: 'On Hold' }
    ]

    it('should render options returned from pay api', async () => {
      mockGetCodes.mockResolvedValue(mockCodes)

      const wrapper = await mountSuspended(StatusList, {
        props: {
          column: 'status',
          modelValue: ''
        },
        global: { stubs: { USelect: true } }
      })

      await nextTick()

      const select = wrapper.findComponent({ name: 'USelect' })
      expect(select.exists()).toBe(true)

      expect(mockGetCodes).toHaveBeenCalledOnce()
      expect(mockGetCodes).toHaveBeenCalledWith('routing_slip_statuses')

      expect(select.props('placeholder')).toBe('Status')

      const expectedItems = mockCodes.map(item => ({
        label: item.description,
        value: item.code
      }))
      expect(select.props('items')).toEqual(expectedItems)
    })
  })
})
