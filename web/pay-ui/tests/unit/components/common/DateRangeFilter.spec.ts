/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import { DateRangeFilter } from '#components'

describe('DateRangeFilter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-09-26T10:00:00.000Z'))
  })

  afterEach(() => {
    const popovers = document.querySelectorAll('[role="dialog"]')
    popovers.forEach(popover => popover.remove())
    vi.useRealTimers()
  })

  it('should display "Date" when v-model is null', async () => {
    const wrapper = await mountSuspended(DateRangeFilter, {
      props: { modelValue: { start: null, end: null } }
    })
    expect(wrapper.text()).toContain('Date')
  })

  it('should display ISODate when v-model is set', async () => {
    const wrapper = await mountSuspended(DateRangeFilter, {
      props: {
        modelValue: {
          start: '2025-09-01',
          end: '2025-09-05'
        }
      }
    })
    expect(wrapper.text()).toContain('2025-09-01 - 2025-09-05')
  })

  it('should display the local state when a range option is clicked', async () => {
    const wrapper = await mountSuspended(DateRangeFilter, {
      props: { modelValue: { start: null, end: null } }
    })

    await wrapper.find('button').trigger('click')
    await nextTick()

    // need to query portal elements from the document
    const popover = document.querySelector('[role="dialog"]')
    expect(popover).not.toBeNull()

    const todayButton = Array.from(popover!.querySelectorAll('button')).find(btn => btn.textContent?.includes('Today'))
    todayButton!.click()
    await nextTick()

    const vm = wrapper.vm as any
    expect(vm.popoverRangeDisplay).toBe('2025-09-26 - 2025-09-26')
  })

  it('should set the correct ISO values when "Apply" is clicked', async () => {
    const wrapper = await mountSuspended(DateRangeFilter, {
      props: {
        'modelValue': { start: null, end: null },
        'onUpdate:modelValue': async (e: any) => await wrapper.setProps({ modelValue: e })
      }
    })

    await wrapper.find('button').trigger('click')
    await nextTick()

    // need to query portal elements from the document
    const popover = document.querySelector('[role="dialog"]')
    expect(popover).not.toBeNull()

    const popoverButtons = Array.from(popover!.querySelectorAll('button'))

    const lastWeekButton = popoverButtons.find(btn => btn.textContent?.includes('Last Week'))
    lastWeekButton!.click()
    await nextTick()

    const applyButton = popoverButtons.find(btn => btn.textContent?.includes('Apply'))
    applyButton!.click()
    await nextTick()

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toHaveLength(1)
    const expectedPayload = { start: '2025-09-15', end: '2025-09-21' }
    expect(emitted![0]).toEqual([expectedPayload])

    const vm = wrapper.vm as any
    expect(vm.triggerButtonLabel).toBe('2025-09-15 - 2025-09-21')
    expect(wrapper.props('modelValue')).toEqual(expectedPayload)
  })

  it('should reset local state when "Cancel" is clicked', async () => {
    const wrapper = await mountSuspended(DateRangeFilter, {
      props: {
        modelValue: { start: '2025-09-01', end: '2025-09-05' }
      }
    })

    await wrapper.find('button').trigger('click')
    await nextTick()

    const vm = wrapper.vm as any

    expect(vm.localModel.value.start.toString()).toBe('2025-09-01')

    // need to query portal elements from the document
    const popover = document.querySelector('[role="dialog"]')
    expect(popover).not.toBeNull()

    const popoverButtons = Array.from(popover!.querySelectorAll('button'))

    const todayButton = popoverButtons.find(btn => btn.textContent?.includes('Today'))
    todayButton!.click()
    await nextTick()

    expect(vm.localModel.value.start.toString()).toBe('2025-09-26')

    const cancelButton = popoverButtons.find(btn => btn.textContent?.includes('Cancel'))
    cancelButton!.click()
    await nextTick()

    await wrapper.find('button').trigger('click')
    await nextTick()

    expect(vm.localModel.value.start.toString()).toBe('2025-09-01')
  })
})
