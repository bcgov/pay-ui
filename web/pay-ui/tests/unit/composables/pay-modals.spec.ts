import { mockNuxtImport } from '@nuxt/test-utils/runtime'

const mockBaseModalOpen = vi.fn()
mockNuxtImport('useConnectModal', () => {
  return () => ({
    baseModal: { open: mockBaseModalOpen }
  })
})

mockNuxtImport('useLocalePath', () => () => vi.fn((path: string) => path))

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
      expect(leaveButton.to).toBe('/home')
      expect(leaveButton.shouldClose).toBe(true)

      const cancelButton = props.buttons[1]
      expect(cancelButton.label).toBe('Cancel')
      expect(cancelButton.shouldClose).toBe(true)
      expect(cancelButton.variant).toBe('outline')
    })
  })

  describe('openPlaceRoutingSlipToNSFModal, openVoidRoutingSlipModal, and openCancelTransactionModal', () => {
    it('should open baseModal with correct props and call onConfirm for all confirmation modals', async () => {
      const mockOnConfirm1 = vi.fn().mockResolvedValue(undefined)
      await modal.openPlaceRoutingSlipToNSFModal(mockOnConfirm1)
      expect(mockBaseModalOpen).toHaveBeenCalledOnce()
      const props1 = mockBaseModalOpen.mock.calls[0]![0]
      expect(props1.title).toBeDefined()
      expect(props1.description).toBeDefined()
      expect(props1.dismissible).toBe(true)
      expect(props1.buttons).toHaveLength(2)
      await props1.buttons[0].onClick()
      expect(mockOnConfirm1).toHaveBeenCalledOnce()
      expect(props1.buttons[1].label).toBe('Cancel')
      expect(props1.buttons[1].shouldClose).toBe(true)
      expect(props1.buttons[1].variant).toBe('outline')

      vi.clearAllMocks()
      const mockOnConfirm2 = vi.fn().mockResolvedValue(undefined)
      await modal.openVoidRoutingSlipModal(mockOnConfirm2)
      expect(mockBaseModalOpen).toHaveBeenCalledOnce()
      const props2 = mockBaseModalOpen.mock.calls[0]![0]
      expect(props2.title).toBeDefined()
      expect(props2.description).toBeDefined()
      expect(props2.dismissible).toBe(true)
      expect(props2.buttons).toHaveLength(2)
      await props2.buttons[0].onClick()
      expect(mockOnConfirm2).toHaveBeenCalledOnce()
      expect(props2.buttons[1].label).toBe('Cancel')
      expect(props2.buttons[1].shouldClose).toBe(true)
      expect(props2.buttons[1].variant).toBe('outline')

      vi.clearAllMocks()
      const mockOnConfirm3 = vi.fn().mockResolvedValue(undefined)
      await modal.openCancelTransactionModal(mockOnConfirm3)
      expect(mockBaseModalOpen).toHaveBeenCalledOnce()
      const props3 = mockBaseModalOpen.mock.calls[0]![0]
      expect(props3.title).toBe('Cancel Transaction?')
      expect(props3.description).toBe(
        'Canceling a transaction will place the transaction amount back to the routing slip.'
      )
      expect(props3.dismissible).toBe(true)
      expect(props3.buttons).toHaveLength(2)
      expect(props3.buttons[0].label).toBe('Cancel Transaction')
      expect(props3.buttons[0].shouldClose).toBe(true)
      await props3.buttons[0].onClick()
      expect(mockOnConfirm3).toHaveBeenCalledOnce()
      expect(props3.buttons[1].label).toBe('Cancel')
      expect(props3.buttons[1].shouldClose).toBe(true)
      expect(props3.buttons[1].variant).toBe('outline')
    })
  })

  describe('openErrorDialog', () => {
    it('should open baseModal with correct props', async () => {
      await modal.openErrorDialog('Error Title', 'Error description message')

      expect(mockBaseModalOpen).toHaveBeenCalledOnce()
      const props = mockBaseModalOpen.mock.calls[0]![0]

      expect(props.title).toBe('Error Title')
      expect(props.description).toBe('Error description message')
      expect(props.dismissible).toBe(true)
      expect(props.buttons).toHaveLength(1)

      const okButton = props.buttons[0]
      expect(okButton.label).toBe('OK')
      expect(okButton.shouldClose).toBe(true)
    })
  })
})
