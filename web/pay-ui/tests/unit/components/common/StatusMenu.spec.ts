import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { StatusMenu } from '#components'
import { SlipStatus } from '~/enums/slip-status'
import { SlipStatusDropdown } from '~/utils/constants'

mockNuxtImport('useI18n', () => () => ({
  t: (key: string) => {
    if (key === 'enum.SlipStatusDropdown.ACTIVE') {
      return 'Place routing slip to active'
    }
    if (key === 'enum.SlipStatusDropdown.HOLD') {
      return 'Place routing slip on hold'
    }
    return key
  },
  te: (key: string) => {
    return key === 'enum.SlipStatusDropdown.ACTIVE' || key === 'enum.SlipStatusDropdown.HOLD'
  }
}))

describe('StatusMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should only render items with a matching translation and emit a SlipStatus '
    + 'when an item is selected', async () => {
    const wrapper = await mountSuspended(StatusMenu, {
      props: {
        allowedStatusList: [
          SlipStatusDropdown.ACTIVE,
          SlipStatusDropdown.HOLD,
          // @ts-expect-error - undefined not valid prop value
          undefined
        ]
      },
      global: {
        stubs: { UDropdownMenu: true, UButton: true }
      }
    })

    const dropdown = wrapper.findComponent({ name: 'UDropdownMenu' })
    const items = dropdown.props('items')

    expect(items).toHaveLength(2)
    expect(items[0].label).toContain('Place routing slip to active')
    expect(items[1].label).toContain('Place routing slip on hold')

    items[1].onSelect()

    const emitted = wrapper.emitted('select')
    expect(emitted).toHaveLength(1)
    expect(emitted![0]).toEqual([SlipStatus.HOLD])
  })
})
