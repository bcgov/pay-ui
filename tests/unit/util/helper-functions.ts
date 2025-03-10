/**
 * Utility function that mocks the `IntersectionObserver` API. Necessary for components that rely
 * on it, otherwise the tests will crash. Recommended to execute inside `beforeEach`.
 * @param intersectionObserverMock - Parameter that is sent to the `Object.defineProperty`
 * overwrite method. `vi.fn()` mock functions can be passed here if the goal is to not only
 * mock the intersection observer, but its methods.
 */
export function setupIntersectionObserverMock ({
  root = null,
  rootMargin = '',
  thresholds = [],
  disconnect = () => null,
  observe = () => null,
  takeRecords = () => [],
  unobserve = () => null
} = {}): void {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | null = root
    readonly rootMargin: string = rootMargin
    readonly thresholds: ReadonlyArray < number > = thresholds
    disconnect: () => void = disconnect
    observe: (target: Element) => void = observe
    takeRecords: () => IntersectionObserverEntry[] = takeRecords
    unobserve: (target: Element) => void = unobserve
  }

  Object.defineProperty(
    window,
    'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: MockIntersectionObserver
    }
  )
}

export async function waitForLoading (wrapper: any, timeout = 5000) {
  const startTime = Date.now()
  while (wrapper.vm.loading) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for loading to become false')
    }
    await new Promise(resolve => setTimeout(resolve, 10))
  }
}
