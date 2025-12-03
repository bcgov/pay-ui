import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import RefundStatusMenu from '~/components/common/RefundStatusMenu.vue'
import { chequeRefundCodes } from '~/utils/constants'

mockNuxtImport('useI18n', () => () => ({
  t: (key: string) => key
}))

describe('RefundStatusMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render', async () => {
    const wrapper = await mountSuspended(RefundStatusMenu, {
      global: {
        stubs: {
          UDropdownMenu: true,
          UButton: true
        }
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should show only CHEQUE_UNDELIVERABLE when currentRefundStatus is PROCESSED', async () => {
    const wrapper = await mountSuspended(RefundStatusMenu, {
      props: {
        currentRefundStatus: chequeRefundCodes.PROCESSED
      },
      global: {
        stubs: {
          UDropdownMenu: true,
          UButton: true
        }
      }
    })

    const dropdown = wrapper.findComponent({ name: 'UDropdownMenu' })
    const items = dropdown.props('items')
    
    expect(items).toHaveLength(1)
    expect(items[0].label).toBe('Cheque Undeliverable')
  })

  it('should show only PROCESSED when currentRefundStatus is CHEQUE_UNDELIVERABLE', async () => {
    const wrapper = await mountSuspended(RefundStatusMenu, {
      props: {
        currentRefundStatus: chequeRefundCodes.CHEQUE_UNDELIVERABLE
      },
      global: {
        stubs: {
          UDropdownMenu: true,
          UButton: true
        }
      }
    })

    const dropdown = wrapper.findComponent({ name: 'UDropdownMenu' })
    const items = dropdown.props('items')
    
    expect(items).toHaveLength(1)
    expect(items[0].label).toBe('Cheque Issued')
  })

  it('should emit select event when an item is selected', async () => {
    const wrapper = await mountSuspended(RefundStatusMenu, {
      props: {
        currentRefundStatus: null
      },
      global: {
        stubs: {
          UDropdownMenu: true,
          UButton: true
        }
      }
    })

    const dropdown = wrapper.findComponent({ name: 'UDropdownMenu' })
    const items = dropdown.props('items')
    
    items[0].onSelect()
    
    const emitted = wrapper.emitted('select')
    expect(emitted).toHaveLength(1)
    expect(emitted![0]).toEqual([expect.any(String)])
  })

  it('should display update status button', async () => {
    const wrapper = await mountSuspended(RefundStatusMenu, {
      global: {
        stubs: {
          UDropdownMenu: {
            template: '<div><slot /></div>',
            props: ['items']
          },
          UButton: true
        }
      }
    })

    const button = wrapper.findComponent({ name: 'UButton' })
    expect(button.exists()).toBe(true)
  })
})

