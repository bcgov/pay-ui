/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { DatePicker } from '#components'

describe('DatePicker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-09-26T10:00:00.000Z'))
  })

  afterEach(() => {
    const popovers = document.querySelectorAll('[role="dialog"]')
    popovers.forEach(popover => popover.remove())
    vi.useRealTimers()
  })

  it('should display "Select Date" when v-model is null', async () => {
    const wrapper = await mountSuspended(DatePicker, {
      props: { modelValue: null }
    })
    expect(wrapper.text()).toContain('Select Date')
  })

  it('should display ISODate when v-model is set', async () => {
    const wrapper = await mountSuspended(DatePicker, {
      props: {
        modelValue: '2025-09-26'
      }
    })
    expect(wrapper.text()).toContain('2025-09-26')
  })

  it('should update when v-model changes', async () => {
    const wrapper = await mountSuspended(DatePicker, {
      props: { modelValue: '2025-09-26' }
    })

    expect(wrapper.text()).toContain('2025-09-26')

    await wrapper.setProps({ modelValue: '2025-10-15' })
    await nextTick()

    expect(wrapper.text()).toContain('2025-10-15')
  })

  it('should set the correct ISO value when a day is clicked', async () => {
    const wrapper = await mountSuspended(DatePicker, {
      props: {
        'modelValue': null,
        'onUpdate:modelValue': async (e: any) => await wrapper.setProps({ modelValue: e })
      }
    })

    // open popover
    await wrapper.find('button').trigger('click')
    await nextTick()

    // need to query portal elements from the document
    const popover = document.querySelector('[role="dialog"]')
    expect(popover).not.toBeNull()

    const days = Array.from(popover!.querySelector('[role="grid"]')!.querySelectorAll('[role="button"]'))
    const dayButton = days.find(day => day.textContent?.includes('15'))
    // @ts-expect-error - Property 'click' does not exist on type 'Element'
    dayButton!.click()
    await nextTick()

    const expected = '2025-09-15'

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toHaveLength(1)
    expect(emitted![0]).toEqual([expected])
    expect(wrapper.props('modelValue')).toEqual(expected)
  })

  // TODO: sort out why popover isnt closing in test after selection
  it.skip('should close the popover when a date is selected', async () => {
    const wrapper = await mountSuspended(DatePicker, {
      props: {
        modelValue: null
      }
    })

    // open popover
    await wrapper.find('button').trigger('click')
    await nextTick()

    // need to query portal elements from the document
    let popover = document.querySelector('[role="dialog"]')
    expect(popover).not.toBeNull()

    const days = Array.from(popover!.querySelector('[role="grid"]')!.querySelectorAll('[role="button"]'))
    const dayButton = days.find(day => day.textContent?.includes('15'))
    // @ts-expect-error - Property 'click' does not exist on type 'Element'
    dayButton!.click()
    await nextTick()

    popover = document.querySelector('[role="dialog"]')
    expect(popover).toBeNull() // TODO: this line is failing
  })
})
