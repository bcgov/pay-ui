/* eslint-disable @typescript-eslint/no-explicit-any */
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import { DateRangeFilter } from '#components'

mockNuxtImport('useI18n', () => () => ({
  t: (key: string) => {
    if (key === 'label.date') { return 'Date' }
    if (key === 'label.apply') { return 'Apply' }
    if (key === 'label.cancel') { return 'Cancel' }
    if (key.includes('DATEFILTER_CODES.TODAY')) { return 'Today' }
    if (key.includes('DATEFILTER_CODES.YESTERDAY')) { return 'Yesterday' }
    if (key.includes('DATEFILTER_CODES.LASTWEEK')) { return 'Last Week' }
    if (key.includes('DATEFILTER_CODES.LASTMONTH')) { return 'Last Month' }
    if (key.includes('DATEFILTER_CODES.CUSTOMRANGE')) { return 'Custom Range' }
    return key
  }
}))

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
      props: { modelValue: { startDate: null, endDate: null } }
    })
    expect(wrapper.text()).toContain('Date')
  })

  it('should display ISODate when v-model is set', async () => {
    const wrapper = await mountSuspended(DateRangeFilter, {
      props: {
        modelValue: {
          startDate: '2025-09-01',
          endDate: '2025-09-05'
        }
      }
    })
    expect(wrapper.text()).toContain('2025-09-01 - 2025-09-05')
  })

  it('should display the local state when a range option is clicked', async () => {
    const wrapper = await mountSuspended(DateRangeFilter, {
      props: { modelValue: { startDate: null, endDate: null } }
    })

    await wrapper.find('button').trigger('click')
    await nextTick()
    vi.advanceTimersByTime(100)

    const popover = document.querySelector('[role="dialog"]')
    expect(popover).not.toBeNull()

    const popoverButtons = Array.from(popover!.querySelectorAll('button'))
    expect(popoverButtons.length).toBeGreaterThan(0)

    const todayButton = popoverButtons.find(btn => btn.textContent?.includes('Today'))
    expect(todayButton).toBeDefined()
    todayButton!.click()
    await nextTick()
    vi.advanceTimersByTime(100)

    const vm = wrapper.vm as any
    expect(vm.popoverRangeDisplay).toBe('2025-09-26 - 2025-09-26')
  })

  it('should set the correct ISO values when "Apply" is clicked', async () => {
    const wrapper = await mountSuspended(DateRangeFilter, {
      props: {
        modelValue: { startDate: null, endDate: null }
      }
    })

    await wrapper.find('button').trigger('click')
    await nextTick()
    vi.advanceTimersByTime(100)

    const popover = document.querySelector('[role="dialog"]')
    expect(popover).not.toBeNull()

    const popoverButtons = Array.from(popover!.querySelectorAll('button'))
    expect(popoverButtons.length).toBeGreaterThan(0)

    const lastWeekButton = popoverButtons.find(btn => btn.textContent?.includes('Last Week'))
    expect(lastWeekButton).toBeDefined()
    lastWeekButton!.click()
    await nextTick()
    vi.advanceTimersByTime(100)

    const applyButton = popoverButtons.find(btn => btn.textContent?.includes('Apply'))
    expect(applyButton).toBeDefined()
    applyButton!.click()
    await nextTick()

    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeDefined()
    if (emitted && emitted.length > 0) {
      const expectedPayload = { startDate: '2025-09-15', endDate: '2025-09-21' }
      expect(emitted[0]).toEqual([expectedPayload])

      const vm = wrapper.vm as any
      expect(vm.triggerButtonLabel).toBe('2025-09-15 - 2025-09-21')
    }
  })

  it('should reset local state when "Cancel" is clicked', async () => {
    const wrapper = await mountSuspended(DateRangeFilter, {
      props: {
        modelValue: { startDate: '2025-09-01', endDate: '2025-09-05' }
      }
    })

    await wrapper.find('button').trigger('click')
    await nextTick()
    vi.advanceTimersByTime(100)

    const vm = wrapper.vm as any

    expect(vm.localModel.value.start.toString()).toBe('2025-09-01')

    const popover = document.querySelector('[role="dialog"]')
    expect(popover).not.toBeNull()

    const popoverButtons = Array.from(popover!.querySelectorAll('button'))
    expect(popoverButtons.length).toBeGreaterThan(0)

    const todayButton = popoverButtons.find(btn => btn.textContent?.includes('Today'))
    expect(todayButton).toBeDefined()
    todayButton!.click()
    await nextTick()
    vi.advanceTimersByTime(100)

    expect(vm.localModel.value.start.toString()).toBe('2025-09-26')

    const cancelButton = popoverButtons.find(btn => btn.textContent?.includes('Cancel'))
    expect(cancelButton).toBeDefined()
    cancelButton!.click()
    await nextTick()
    vi.advanceTimersByTime(100)

    await wrapper.find('button').trigger('click')
    await nextTick()
    vi.advanceTimersByTime(100)

    expect(vm.localModel.value.start.toString()).toBe('2025-09-01')
  })
})
