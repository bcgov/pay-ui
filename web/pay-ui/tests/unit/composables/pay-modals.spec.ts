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

  describe('openPlaceRoutingSlipToNSFModal', () => {
    it('should open baseModal with correct props and call onConfirm', async () => {
      const mockOnConfirm = vi.fn().mockResolvedValue(undefined)

      await modal.openPlaceRoutingSlipToNSFModal(mockOnConfirm)

      expect(mockBaseModalOpen).toHaveBeenCalledOnce()
      const props = mockBaseModalOpen.mock.calls[0]![0]

      expect(props.title).toBeDefined()
      expect(props.description).toBeDefined()
      expect(props.dismissible).toBe(true)
      expect(props.buttons).toHaveLength(2)

      const confirmButton = props.buttons[0]
      expect(confirmButton.label).toBeDefined()
      expect(confirmButton.shouldClose).toBe(true)

      await confirmButton.onClick()
      expect(mockOnConfirm).toHaveBeenCalledOnce()

      const cancelButton = props.buttons[1]
      expect(cancelButton.label).toBe('Cancel')
      expect(cancelButton.shouldClose).toBe(true)
      expect(cancelButton.variant).toBe('outline')
    })
  })

  describe('openVoidRoutingSlipModal', () => {
    it('should open baseModal with correct props and call onConfirm', async () => {
      const mockOnConfirm = vi.fn().mockResolvedValue(undefined)

      await modal.openVoidRoutingSlipModal(mockOnConfirm)

      expect(mockBaseModalOpen).toHaveBeenCalledOnce()
      const props = mockBaseModalOpen.mock.calls[0]![0]

      expect(props.title).toBeDefined()
      expect(props.description).toBeDefined()
      expect(props.dismissible).toBe(true)
      expect(props.buttons).toHaveLength(2)

      const confirmButton = props.buttons[0]
      expect(confirmButton.label).toBeDefined()
      expect(confirmButton.shouldClose).toBe(true)

      await confirmButton.onClick()
      expect(mockOnConfirm).toHaveBeenCalledOnce()

      const cancelButton = props.buttons[1]
      expect(cancelButton.label).toBe('Cancel')
      expect(cancelButton.shouldClose).toBe(true)
      expect(cancelButton.variant).toBe('outline')
    })
  })

  describe('openCancelTransactionModal', () => {
    it('should open baseModal with correct props and call onConfirm', async () => {
      const mockOnConfirm = vi.fn().mockResolvedValue(undefined)

      await modal.openCancelTransactionModal(mockOnConfirm)

      expect(mockBaseModalOpen).toHaveBeenCalledOnce()
      const props = mockBaseModalOpen.mock.calls[0]![0]

      expect(props.title).toBe('Cancel Transaction?')
      expect(props.description).toBe(
        'Canceling a transaction will place the transaction amount back to the routing slip.'
      )
      expect(props.dismissible).toBe(true)
      expect(props.buttons).toHaveLength(2)

      const confirmButton = props.buttons[0]
      expect(confirmButton.label).toBe('Cancel Transaction')
      expect(confirmButton.shouldClose).toBe(true)

      await confirmButton.onClick()
      expect(mockOnConfirm).toHaveBeenCalledOnce()

      const cancelButton = props.buttons[1]
      expect(cancelButton.label).toBe('Cancel')
      expect(cancelButton.shouldClose).toBe(true)
      expect(cancelButton.variant).toBe('outline')
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
