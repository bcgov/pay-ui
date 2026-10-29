import { useStickyHeader } from '~/composables/common/useStickyHeader'

const { resizeCb } = vi.hoisted(() => ({ resizeCb: { fn: null as null | (() => void) } }))

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@vueuse/core')>()
  return {
    ...actual,
    useResizeObserver: (_el: unknown, cb: () => void) => { resizeCb.fn = cb }
  }
})

describe('useStickyHeader', () => {
  beforeEach(() => {
    resizeCb.fn = null
  })

  it('does nothing when the element is not set', () => {
    const { updateStickyHeaderHeight } = useStickyHeader(ref<HTMLElement | null>(null))
    expect(() => updateStickyHeaderHeight()).not.toThrow()
  })

  it('sets the css variable from the rounded-up thead height', () => {
    const el = document.createElement('div')
    el.innerHTML = '<table><thead><tr><th>a</th></tr></thead></table>'
    const thead = el.querySelector('thead') as HTMLElement
    vi.spyOn(thead, 'getBoundingClientRect').mockReturnValue({ height: 40.2 } as DOMRect)
    const { updateStickyHeaderHeight } = useStickyHeader(ref(el))
    updateStickyHeaderHeight()
    expect(el.style.getPropertyValue('--search-sticky-header-height')).toBe('41px')
  })

  it('falls back to 0px when there is no thead', () => {
    const el = document.createElement('div')
    const { updateStickyHeaderHeight } = useStickyHeader(ref(el))
    updateStickyHeaderHeight()
    expect(el.style.getPropertyValue('--search-sticky-header-height')).toBe('0px')
  })

  it('recalculates when the resize observer fires', () => {
    const el = document.createElement('div')
    useStickyHeader(ref(el))
    expect(resizeCb.fn).toBeTypeOf('function')
    resizeCb.fn!()
    expect(el.style.getPropertyValue('--search-sticky-header-height')).toBe('0px')
  })
})
