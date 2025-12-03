import { mountSuspended } from '@nuxt/test-utils/runtime'
import { IconTooltip } from '#components'

describe('IconTooltip', () => {
  it('should render the default icon props', async () => {
    const wrapper = await mountSuspended(IconTooltip, {
      global: {
        stubs: {
          UTooltip: { template: '<div><slot /></div>' },
          UIcon: true
        }
      }
    })

    const icon = wrapper.findComponent({ name: 'UIcon' })
    expect(icon.exists()).toBe(true)
    expect(icon.props('name')).toBe('i-mdi-information-outline')
    expect(icon.classes()).toContain('text-primary')
    expect(icon.classes()).toContain('shrink-0')
    expect(icon.classes()).toContain('size-6')
  })

  it('should render custom icon', async () => {
    const customIcon = 'i-mdi-help-circle'
    const wrapper = await mountSuspended(IconTooltip, {
      props: {
        icon: customIcon
      },
      global: {
        stubs: {
          UTooltip: { template: '<div><slot /></div>' },
          UIcon: true
        }
      }
    })

    const icon = wrapper.findComponent({ name: 'UIcon' })
    expect(icon.props('name')).toBe(customIcon)
  })

  it('should render custom icon class', async () => {
    const customClass = 'text-red-500 size-8'
    const wrapper = await mountSuspended(IconTooltip, {
      props: { iconClass: customClass },
      global: {
        stubs: {
          UTooltip: { template: '<div><slot /></div>' },
          UIcon: true
        }
      }
    })

    const icon = wrapper.findComponent({ name: 'UIcon' })
    expect(icon.classes()).toContain('text-red-500')
    expect(icon.classes()).toContain('size-8')
    expect(icon.classes()).not.toContain('text-primary')
  })

  it('should pass text to UTooltip', async () => {
    const tooltipText = 'Tooltip Text.'
    const wrapper = await mountSuspended(IconTooltip, {
      props: { text: tooltipText },
      global: { stubs: { UTooltip: true, UIcon: true } }
    })

    const tooltip = wrapper.findComponent({ name: 'UTooltip' })
    expect(tooltip.props('text')).toBe(tooltipText)
  })

  it('should render slot content inside of the tooltip', async () => {
    const slotContent = '<p class="font-bold">Slot Content</p>'
    const wrapper = await mountSuspended(IconTooltip, {
      slots: {
        default: () => slotContent
      },
      global: {
        stubs: {
          UTooltip: { template: '<div><slot name="content" /></div>' },
          UIcon: true
        }
      }
    })

    expect(wrapper.text()).toContain('Slot Content')
  })
})
