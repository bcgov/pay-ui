import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const mockBaseModalOpen = vi.fn()
mockNuxtImport('useConnectModal', () => {
  return () => ({
    baseModal: { open: mockBaseModalOpen }
  })
})

mockNuxtImport('useLocalePath', () => () => vi.fn((path: string) => `/en-CA${path}`))

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
  const modal = usePayModals()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('openLeaveCreateRoutingSlipModal', () => {
    it('should open baseModal with correct props', async () => {
      await modal.openLeaveCreateRoutingSlipModal()

      expect(mockBaseModalOpen).toHaveBeenCalledOnce()

      const props = mockBaseModalOpen.mock.calls[0]![0]

      expect(props.title).toBe('Leave Add Routing Slip?')
      expect(props.description).toBe(
        'If you leave this page, your routing slip information will not be created or saved.'
      )
      expect(props.dismissible).toBe(true)
      expect(props.buttons).toHaveLength(2)

      const leaveButton = props.buttons[0]
      expect(leaveButton.label).toBe('Leave')
      expect(leaveButton.to).toBe('/en-CA/dashboard')
      expect(leaveButton.shouldClose).toBe(true)

      const cancelButton = props.buttons[1]
      expect(cancelButton.label).toBe('Cancel')
      expect(cancelButton.shouldClose).toBe(true)
      expect(cancelButton.variant).toBe('outline')
    })
  })
})
