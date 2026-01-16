import { useResizeObserver } from '@vueuse/core'
import type { Ref } from 'vue'

export function useStickyHeader(scrollEl: Ref<HTMLElement | null>) {
  const updateStickyHeaderHeight = () => {
    const el = scrollEl.value
    if (!el) { return }

    const thead = el.querySelector('thead')
    const height = thead?.getBoundingClientRect().height ?? 0
    el.style.setProperty('--search-sticky-header-height', `${Math.ceil(height)}px`)
  }

  useResizeObserver(scrollEl, () => {
    updateStickyHeaderHeight()
  })

  return {
    updateStickyHeaderHeight
  }
}
