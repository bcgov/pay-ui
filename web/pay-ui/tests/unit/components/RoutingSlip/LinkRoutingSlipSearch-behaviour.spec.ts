import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import LinkRoutingSlipSearch from '~/components/RoutingSlip/LinkRoutingSlipSearch.vue'

const {
  mockPostSearch,
  mockPostLink,
  mockGetLinked,
  mockGetRoutingSlip,
  mockStore,
  mockGetFASErrorMessage
} = vi.hoisted(() => ({
  mockPostSearch: vi.fn(),
  mockPostLink: vi.fn(),
  mockGetLinked: vi.fn(),
  mockGetRoutingSlip: vi.fn(),
  mockStore: { routingSlip: { number: 'PARENT1' } as { number?: string } | undefined },
  mockGetFASErrorMessage: vi.fn(() => 'fas-error')
}))

mockNuxtImport('usePayApi', () => () => ({ postSearchRoutingSlip: mockPostSearch, postLinkRoutingSlip: mockPostLink }))
mockNuxtImport('useRoutingSlip', () => () => ({
  getLinkedRoutingSlips: mockGetLinked,
  getRoutingSlip: mockGetRoutingSlip
}))
mockNuxtImport('useRoutingSlipStore', () => () => ({ store: mockStore }))

vi.mock('@/utils/api-error-handler', async importOriginal => ({
  ...(await importOriginal<typeof import('@/utils/api-error-handler')>()),
  getFASErrorMessage: mockGetFASErrorMessage
}))

const stubs = {
  UFormField: {
    name: 'UFormField',
    props: ['error'],
    template: '<div class="ff"><span class="err">{{ error }}</span><slot :error="error" /></div>'
  },
  AsyncAutoComplete: {
    name: 'AsyncAutoComplete',
    props: ['modelValue', 'queryFn', 'disabled', 'valueKey', 'labelKey'],
    emits: ['update:modelValue', 'blur', 'focus'],
    template: `<div class="aac">
      <slot name="item" :item="{ number: 'N1', routingSlipDate: 'D', total: 5 }" />
    </div>`
  },
  ConnectI18nHelper: {
    name: 'ConnectI18nHelper',
    props: ['translationPath', 'number', 'date', 'amount'],
    template: '<span class="i18n">{{ number }}|{{ date }}|{{ amount }}</span>'
  },
  UButton: {
    name: 'UButton',
    props: ['label', 'loading', 'disabled'],
    emits: ['click'],
    template: '<button :data-label="label" @click="$emit(\'click\')">{{ label }}</button>'
  }
}

function mountIt() {
  return mountSuspended(LinkRoutingSlipSearch, {
    props: { currentRoutingSlipNumber: 'CHILD1' },
    global: { stubs }
  })
}

type Wrapper = Awaited<ReturnType<typeof mountIt>>

function linkButton(w: Wrapper) {
  return w.findAllComponents({ name: 'UButton' })[0]!
}

describe('LinkRoutingSlipSearch - behaviour', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    mockStore.routingSlip = { number: 'PARENT1' }
    mockPostLink.mockResolvedValue({})
    mockGetLinked.mockResolvedValue({})
    mockGetRoutingSlip.mockResolvedValue({})
  })

  it('renders item slot through ConnectI18nHelper and spacer when no error', async () => {
    const w = await mountIt()
    expect(w.find('.i18n').text()).toBe('N1|D|5')
    expect(w.find('.h-4').exists()).toBe(true)
  })

  it('queryFn returns [] for short input without calling the api', async () => {
    const w = await mountIt()
    const queryFn = w.findComponent({ name: 'AsyncAutoComplete' }).props('queryFn')
    expect(await queryFn('ab')).toEqual([])
    expect(mockPostSearch).not.toHaveBeenCalled()
  })

  it('queryFn maps search results with formatted date', async () => {
    mockPostSearch.mockResolvedValue({
      items: [{ number: '111', routingSlipDate: '2025-09-26', total: 12.5, status: 'ACTIVE' }]
    })
    const w = await mountIt()
    const queryFn = w.findComponent({ name: 'AsyncAutoComplete' }).props('queryFn')
    const res = await queryFn('111')
    expect(mockPostSearch).toHaveBeenCalledWith({ routingSlipNumber: '111' })
    expect(res).toEqual([{ number: '111', routingSlipDate: 'September 26, 2025', total: 12.5 }])
  })

  it('shows validation error when linking without selection', async () => {
    const w = await mountIt()
    await linkButton(w).trigger('click')
    await nextTick()
    expect(mockPostLink).not.toHaveBeenCalled()
    expect(w.find('.err').text()).not.toBe('')
    expect(w.find('.h-4').exists()).toBe(false)
    expect(w.emitted('success')).toBeUndefined()
  })

  it('clears error on focus', async () => {
    const w = await mountIt()
    await linkButton(w).trigger('click')
    await nextTick()
    expect(w.find('.err').text()).not.toBe('')
    w.findComponent({ name: 'AsyncAutoComplete' }).vm.$emit('focus')
    await nextTick()
    expect(w.find('.err').text()).toBe('')
  })

  it('debounced validation on blur sets and clears the error', async () => {
    vi.useFakeTimers()
    const w = await mountIt()
    const aac = w.findComponent({ name: 'AsyncAutoComplete' })
    aac.vm.$emit('blur')
    vi.advanceTimersByTime(150)
    await nextTick()
    expect(w.find('.err').text()).not.toBe('')

    aac.vm.$emit('update:modelValue', '222')
    vi.advanceTimersByTime(150)
    await nextTick()
    expect(w.find('.err').text()).toBe('')
    expect(aac.props('modelValue')).toBe('222')
    vi.useRealTimers()
  })

  it('links selected slip, emits success and refreshes store data', async () => {
    const w = await mountIt()
    w.findComponent({ name: 'AsyncAutoComplete' }).vm.$emit('update:modelValue', '333')
    await nextTick()
    await linkButton(w).trigger('click')
    await flushPromises()
    expect(mockPostLink).toHaveBeenCalledWith({ childRoutingSlipNumber: 'CHILD1', parentRoutingSlipNumber: '333' })
    expect(w.emitted('success')).toEqual([['333']])
    expect(mockGetRoutingSlip).toHaveBeenCalledWith({ routingSlipNumber: 'PARENT1' })
    expect(mockGetLinked).toHaveBeenCalledWith('PARENT1')
    expect(linkButton(w).props('loading')).toBe(false)
  })

  it('uses empty string when store has no routing slip', async () => {
    mockStore.routingSlip = undefined
    const w = await mountIt()
    w.findComponent({ name: 'AsyncAutoComplete' }).vm.$emit('update:modelValue', '333')
    await nextTick()
    await linkButton(w).trigger('click')
    await flushPromises()
    expect(mockGetRoutingSlip).toHaveBeenCalledWith({ routingSlipNumber: '' })
    expect(mockGetLinked).toHaveBeenCalledWith('')
  })

  it('sets loading while linking and disables inputs', async () => {
    let resolve!: () => void
    mockPostLink.mockReturnValue(new Promise<void>((r) => { resolve = r }))
    const w = await mountIt()
    const aac = w.findComponent({ name: 'AsyncAutoComplete' })
    aac.vm.$emit('update:modelValue', '333')
    await nextTick()
    await linkButton(w).trigger('click')
    await nextTick()
    expect(linkButton(w).props('loading')).toBe(true)
    expect(aac.props('disabled')).toBe(true)
    expect(w.findAllComponents({ name: 'UButton' })[1]!.props('disabled')).toBe(true)
    resolve()
    await flushPromises()
    expect(linkButton(w).props('loading')).toBe(false)
  })

  it('shows FAS error message when link fails', async () => {
    const err = new Error('boom')
    mockPostLink.mockRejectedValue(err)
    const w = await mountIt()
    w.findComponent({ name: 'AsyncAutoComplete' }).vm.$emit('update:modelValue', '333')
    await nextTick()
    await linkButton(w).trigger('click')
    await flushPromises()
    expect(mockGetFASErrorMessage).toHaveBeenCalledWith(err)
    expect(w.find('.err').text()).toBe('fas-error')
    expect(w.emitted('success')).toBeUndefined()
  })

  it('emits cancel', async () => {
    const w = await mountIt()
    await w.findAllComponents({ name: 'UButton' })[1]!.trigger('click')
    expect(w.emitted('cancel')).toHaveLength(1)
  })
})

async function flushPromises() {
  await new Promise(resolve => setTimeout(resolve, 0))
  await nextTick()
}
