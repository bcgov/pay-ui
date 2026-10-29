import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createPinia, setActivePinia } from 'pinia'
import { usePadAccountState } from '~/composables/usePadAccountState'
import { usePaymentLinkStore } from '~/stores/paymentLink'
import type { AccountPaymentInfo } from '~/stores/paymentLink'

const getAccountPaymentInfo = vi.fn()
const getOrgAuthorizations = vi.fn()
vi.mock('~/composables/useAccount', () => ({
  useAccount: () => ({
    getAccountPaymentInfo,
    getOrgAuthorizations,
    verifyPadInfo: vi.fn(),
    updateOrgPadInfo: vi.fn(),
    getPadTermsOfUse: vi.fn()
  })
}))

mockNuxtImport('useRuntimeConfig', () => () => ({
  public: { authWebUrl: 'https://auth.example.test/' }
}) as ReturnType<typeof useRuntimeConfig>)

function padAccount(overrides: Partial<AccountPaymentInfo> = {}): AccountPaymentInfo {
  return {
    id: 1,
    paymentMethod: 'PAD',
    cfsAccount: { paymentMethod: 'PAD', status: 'ACTIVE' },
    ...overrides
  }
}

describe('usePadAccountState', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    getAccountPaymentInfo.mockReset()
    getOrgAuthorizations.mockReset()
  })

  describe('padState', () => {
    it('is NOT_SETUP when accountInfo is absent', () => {
      const store = usePaymentLinkStore()
      store.setAccount(42)
      const pad = usePadAccountState()
      expect(pad.padState.value).toBe('NOT_SETUP')
    })

    it('is NOT_SETUP when the account is not PAD', () => {
      const store = usePaymentLinkStore()
      store.setAccount(42)
      store.setAccountInfo({ id: 1, paymentMethod: 'DIRECT_PAY' })
      const pad = usePadAccountState()
      expect(pad.padState.value).toBe('NOT_SETUP')
    })

    it('honors cfsAccount.paymentMethod when top-level paymentMethod is unset', () => {
      const store = usePaymentLinkStore()
      store.setAccount(42)
      store.setAccountInfo({ id: 1, cfsAccount: { paymentMethod: 'PAD', status: 'ACTIVE' } })
      const pad = usePadAccountState()
      expect(pad.padState.value).toBe('READY')
    })

    it('is FROZEN when CFS status is FREEZE', () => {
      const store = usePaymentLinkStore()
      store.setAccount(42)
      store.setAccountInfo(padAccount({ cfsAccount: { paymentMethod: 'PAD', status: 'FREEZE' } }))
      const pad = usePadAccountState()
      expect(pad.padState.value).toBe('FROZEN')
    })

    it('is PENDING for both PENDING and PENDING_PAD_ACTIVATION CFS states', () => {
      const store = usePaymentLinkStore()
      store.setAccount(42)
      const pad = usePadAccountState()

      store.setAccountInfo(padAccount({ cfsAccount: { paymentMethod: 'PAD', status: 'PENDING' } }))
      expect(pad.padState.value).toBe('PENDING')

      store.setAccountInfo(padAccount({ cfsAccount: { paymentMethod: 'PAD', status: 'PENDING_PAD_ACTIVATION' } }))
      expect(pad.padState.value).toBe('PENDING')
    })

    it('is READY for an ACTIVE PAD account', () => {
      const store = usePaymentLinkStore()
      store.setAccount(42)
      store.setAccountInfo(padAccount())
      const pad = usePadAccountState()
      expect(pad.padState.value).toBe('READY')
    })
  })

  describe('padNotSetUp', () => {
    it('is true when the account is not PAD', () => {
      const store = usePaymentLinkStore()
      store.setAccount(42)
      store.setAccountInfo({ id: 1, paymentMethod: 'ONLINE_BANKING' })
      const pad = usePadAccountState()
      expect(pad.padNotSetUp.value).toBe(true)
    })

    it('is false for a PAD-enabled account', () => {
      const store = usePaymentLinkStore()
      store.setAccount(42)
      store.setAccountInfo(padAccount())
      const pad = usePadAccountState()
      expect(pad.padNotSetUp.value).toBe(false)
    })

    it('is suppressed to false while account is loading', async () => {
      // Hold the fetch open so we can observe the loading-suppression window.
      let resolveLoad: (v: AccountPaymentInfo) => void
      getAccountPaymentInfo.mockReturnValueOnce(new Promise<AccountPaymentInfo>((res) => { resolveLoad = res }))

      const store = usePaymentLinkStore()
      store.setAccount(42)
      const pad = usePadAccountState()

      const pending = pad.refresh()
      expect(pad.padNotSetUp.value).toBe(false) // suppressed while loading

      resolveLoad!({ id: 1, paymentMethod: 'DIRECT_PAY' })
      await pending
      expect(pad.padNotSetUp.value).toBe(true) // exposed once loading finishes
    })
  })

  describe('canEditPadInfo', () => {
    it('is true when the user has change_pad_info (case-insensitive)', async () => {
      getAccountPaymentInfo.mockResolvedValueOnce(padAccount())
      getOrgAuthorizations.mockResolvedValueOnce({ roles: ['CHANGE_PAD_INFO', 'view_account'] })

      const store = usePaymentLinkStore()
      store.setAccount(42)
      const pad = usePadAccountState()
      await pad.load()

      expect(pad.canEditPadInfo.value).toBe(true)
    })

    it('is false when the role is absent', async () => {
      getAccountPaymentInfo.mockResolvedValueOnce(padAccount())
      getOrgAuthorizations.mockResolvedValueOnce({ roles: ['view_account'] })

      const store = usePaymentLinkStore()
      store.setAccount(42)
      const pad = usePadAccountState()
      await pad.load()

      expect(pad.canEditPadInfo.value).toBe(false)
    })

    it('is false when auth-api throws', async () => {
      getAccountPaymentInfo.mockResolvedValueOnce(padAccount())
      getOrgAuthorizations.mockRejectedValueOnce(new Error('boom'))

      const store = usePaymentLinkStore()
      store.setAccount(42)
      const pad = usePadAccountState()
      await pad.load()

      expect(pad.canEditPadInfo.value).toBe(false)
    })
  })

  describe('accountSettingsUrl', () => {
    it('composes the auth-web product-settings URL from the config + selected account', () => {
      const store = usePaymentLinkStore()
      store.setAccount(42)
      const pad = usePadAccountState()
      expect(pad.accountSettingsUrl.value).toBe('https://auth.example.test/account/42/settings/product-settings')
    })

    it('is empty when no account is selected', () => {
      const pad = usePadAccountState()
      expect(pad.accountSettingsUrl.value).toBe('')
    })
  })

  describe('load / refresh', () => {
    it('is a no-op when no account is selected', async () => {
      const pad = usePadAccountState()
      await pad.load()
      expect(getAccountPaymentInfo).not.toHaveBeenCalled()
      expect(getOrgAuthorizations).not.toHaveBeenCalled()
    })

    it('swallows account fetch errors and leaves accountInfo unchanged', async () => {
      getAccountPaymentInfo.mockRejectedValueOnce(new Error('down'))
      getOrgAuthorizations.mockResolvedValueOnce({ roles: [] })

      const store = usePaymentLinkStore()
      store.setAccount(42)
      const pad = usePadAccountState()

      await expect(pad.load()).resolves.toBeUndefined()
      expect(store.accountInfo).toBeNull()
    })
  })
})
