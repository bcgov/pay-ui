import { mountSuspended } from '@nuxt/test-utils/runtime'
import { StatusList } from '#components'
import { ChequeRefundStatus } from '~/utils/constants'
import type { SelectItem } from '@nuxt/ui'

describe('StatusList', () => {
  describe('when using refund status list', () => {
    it('should render with the correct options and props', async () => {
      const mapFn = (item: { code: string, text: string }): SelectItem => ({
        label: item.text,
        value: item.code
      })

      const wrapper = await mountSuspended(StatusList, {
        props: {
          list: ChequeRefundStatus,
          mapFn,
          placeholder: 'Refund Status',
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
    })
  })

  describe('when using routing slip status list', () => {
    const mockCodes = [
      { code: 'ACTIVE', description: 'Active Status' },
      { code: 'HOLD', description: 'On Hold' }
    ]

    it('should render options from status list', async () => {
      const mapFn = (item: { code: string, description: string }): SelectItem => ({
        label: item.description,
        value: item.code
      })

      const wrapper = await mountSuspended(StatusList, {
        props: {
          list: mockCodes,
          mapFn,
          placeholder: 'Status',
          modelValue: ''
        },
        global: { stubs: { USelect: true } }
      })

      const select = wrapper.findComponent({ name: 'USelect' })
      expect(select.exists()).toBe(true)

      expect(select.props('placeholder')).toBe('Status')

      const expectedItems = mockCodes.map(item => ({
        label: item.description,
        value: item.code
      }))
      expect(select.props('items')).toEqual(expectedItems)
    })
  })
})
