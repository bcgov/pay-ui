import { mountSuspended } from '@nuxt/test-utils/runtime'
import Row from '~/components/ReviewRoutingSlip/Row.vue'

describe('Row', () => {
  it('should render', async () => {
    const wrapper = await mountSuspended(Row, {
      props: {
        label: 'Test Label'
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display label and value when both are provided', async () => {
    const wrapper = await mountSuspended(Row, {
      props: {
        label: 'Test Label',
        value: 'Test Value'
      }
    })

    expect(wrapper.text()).toContain('Test Label')
    expect(wrapper.text()).toContain('Test Value')
  })

  it('should display label and slot content when value is not provided', async () => {
    const wrapper = await mountSuspended(Row, {
      props: {
        label: 'Test Label'
      },
      slots: {
        default: 'Slot Content'
      }
    })

    expect(wrapper.text()).toContain('Test Label')
    expect(wrapper.text()).toContain('Slot Content')
  })
})

