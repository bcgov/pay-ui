const { mockLog } = vi.hoisted(() => {
  // Nitro auto-import that is not available in the test environment
  (globalThis as Record<string, unknown>).defineNitroPlugin = (plugin: unknown) => plugin
  return { mockLog: vi.fn() }
})

vi.mock('../../../../server/utils/logger', () => ({ log: mockLog }))

const STORAGE_KEYS = ['sessionStorage', 'localStorage'] as const
type StorageKey = typeof STORAGE_KEYS[number]

describe('server/plugins/storage-polyfill', () => {
  const originals = new Map<StorageKey, PropertyDescriptor | undefined>()
  let plugin: () => void

  beforeAll(async () => {
    plugin = (await import('../../../../server/plugins/storage-polyfill')).default as unknown as () => void
  })

  beforeEach(() => {
    for (const key of STORAGE_KEYS) {
      originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    }
  })

  afterEach(() => {
    for (const key of STORAGE_KEYS) {
      const descriptor = originals.get(key)
      if (descriptor) {
        Object.defineProperty(globalThis, key, { ...descriptor, configurable: true })
      } else {
        Reflect.deleteProperty(globalThis, key)
      }
    }
  })

  function removeStorage(key: StorageKey) {
    Object.defineProperty(globalThis, key, { value: undefined, writable: true, configurable: true })
  }

  it('leaves existing browser storage untouched', () => {
    const session = globalThis.sessionStorage
    const local = globalThis.localStorage

    plugin()

    expect(globalThis.sessionStorage).toBe(session)
    expect(globalThis.localStorage).toBe(local)
    expect(mockLog).not.toHaveBeenCalled()
  })

  it('polyfills both storages when they are missing', () => {
    STORAGE_KEYS.forEach(removeStorage)

    plugin()

    expect(globalThis.sessionStorage).toBeDefined()
    expect(globalThis.localStorage).toBeDefined()
    expect(globalThis.sessionStorage).not.toBe(globalThis.localStorage)
    expect(mockLog).toHaveBeenCalledWith('DEBUG', 'sessionStorage polyfill initialized')
    expect(mockLog).toHaveBeenCalledWith('DEBUG', 'localStorage polyfill initialized')
  })

  it.each(STORAGE_KEYS)('polyfills only %s when only it is missing', (key) => {
    const other = STORAGE_KEYS.find(k => k !== key)!
    const existing = globalThis[other]
    removeStorage(key)

    plugin()

    expect(globalThis[key]).toBeDefined()
    expect(globalThis[other]).toBe(existing)
    expect(mockLog).toHaveBeenCalledTimes(1)
    expect(mockLog).toHaveBeenCalledWith('DEBUG', `${key} polyfill initialized`)
  })

  it('provides a working in-memory Storage implementation', () => {
    removeStorage('sessionStorage')
    plugin()
    const storage = globalThis.sessionStorage

    expect(storage.length).toBe(0)
    expect(storage.getItem('missing')).toBeNull()
    expect(storage.key(0)).toBeNull()

    storage.setItem('a', '1')
    storage.setItem('b', '2')
    storage.setItem('a', '3')
    expect(storage.length).toBe(2)
    expect(storage.getItem('a')).toBe('3')
    expect(storage.key(0)).toBe('a')
    expect(storage.key(1)).toBe('b')
    expect(storage.key(2)).toBeNull()

    storage.removeItem('a')
    expect(storage.getItem('a')).toBeNull()
    expect(storage.length).toBe(1)

    storage.clear()
    expect(storage.length).toBe(0)
    expect(storage.getItem('b')).toBeNull()
  })
})
