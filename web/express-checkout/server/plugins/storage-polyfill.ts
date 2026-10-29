// SSR-safe polyfill for sessionStorage and localStorage
// Defined as a Nitro plugin to run at server startup, ensuring globals are available immediately

import { log } from '../utils/logger'

class ServerStorage implements Storage {
  private data: Map<string, string> = new Map()

  get length(): number {
    return this.data.size
  }

  clear(): void {
    this.data.clear()
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  key(index: number): string | null {
    const keys = Array.from(this.data.keys())
    return keys[index] ?? null
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }

  // Matches the index signature of the DOM Storage interface
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export default defineNitroPlugin(() => {
  // Only polyfill if not already defined
  if (!globalThis.sessionStorage) {
    const mockSession = new ServerStorage()
    // Define property to handle the "not defined" ReferenceError
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: mockSession,
      writable: true
    })
    log('DEBUG', 'sessionStorage polyfill initialized')
  }

  if (!globalThis.localStorage) {
    const mockLocal = new ServerStorage()
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocal,
      writable: true
    })
    log('DEBUG', 'localStorage polyfill initialized')
  }
})
