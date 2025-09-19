import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const mockBaseModalOpen = vi.fn()
mockNuxtImport('useConnectModal', () => {
  return () => ({
    baseModal: { open: mockBaseModalOpen }
  })
})

// mock navigateTo util
// const { mockNavigateTo } = vi.hoisted(() => ({ mockNavigateTo: vi.fn() }))
// mockNuxtImport('navigateTo', () => mockNavigateTo)

// mockNuxtImport('useRuntimeConfig', () => () => ({
//   public: {
//     // keys here
//   }
// }))

// mockNuxtImport('useConnectAccountStore', () => () => ({
//   currentAccount: { id: 'test-account-id' }
// }))

describe('usePayModals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('openExampleModal', () => {
    it('should open the base modal with correct titles and buttons', async () => {
      const { openExampleModal } = usePayModals()

      await openExampleModal('title', 'description', false, [{ label: 'Test Button' }])

      expect(mockBaseModalOpen).toHaveBeenCalledOnce()
      const callArgs = mockBaseModalOpen.mock.calls[0]![0]
      expect(callArgs.title).toBe('title')
      expect(callArgs.description).toBe('description')
      expect(callArgs.dismissible).toBe(false)
      expect(callArgs.buttons).toHaveLength(1)
      expect(callArgs.buttons[0].label).toBe('Test Button')
    })
  })
})
