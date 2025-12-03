import { mountSuspended } from '@nuxt/test-utils/runtime'
import { StatusMenu } from '#components'

describe('StatusMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should only render items with a matching translation', async () => {
    const wrapper = await mountSuspended(StatusMenu, {
      props: {
        allowedStatusList: [
          SlipStatus.ACTIVE,
          SlipStatus.HOLD,
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
  })

  it('should emit a SlipStatus when an item is selected', async () => {
    const wrapper = await mountSuspended(StatusMenu, {
      props: {
        allowedStatusList: [SlipStatus.ACTIVE, SlipStatus.HOLD]
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
    items[1].onSelect()

    const emitted = wrapper.emitted('select')
    expect(emitted).toHaveLength(1)
    expect(emitted![0]).toEqual([SlipStatus.HOLD])
  })
})
