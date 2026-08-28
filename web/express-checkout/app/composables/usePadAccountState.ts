import type { AccountPaymentInfo, CfsAccountStatus } from '../stores/paymentLink'

export type PadState = 'READY' | 'PENDING' | 'FROZEN' | 'NOT_SETUP' | 'LOADING'

/**
 * Encapsulates everything the checkout page needs to know about the current
 * account's PAD status:
 *   - fetches `getAccountPaymentInfo` and `getOrgAuthorizations` on demand
 *   - exposes reactive `padState`, `padNotSetUp`, `canEditPadInfo`,
 *     `hasPadBankDetails`, and `accountSettingsUrl`
 *   - `refresh()` re-runs the account fetch (used after PAD info is saved)
 *
 * Doesn't self-mount — pages call `load()` from `onMounted` after the invoice
 * is known, so a page navigating away with no account selected doesn't fire
 * spurious requests.
 */
export function usePadAccountState() {
  const store = usePaymentLinkStore()
  const { getAccountPaymentInfo, getOrgAuthorizations } = useAccount()
  const config = useRuntimeConfig().public as { authWebUrl?: string }

  const accountLoading = ref(false)
  const userPermissions = ref<string[]>([])

  async function refresh() {
    if (!store.selectedAccountId) { return }
    accountLoading.value = true
    try {
      const info = await getAccountPaymentInfo(store.selectedAccountId)
      store.setAccountInfo(info as AccountPaymentInfo)
    } catch {
      // Non-fatal — errors surface at submit-time.
    } finally {
      accountLoading.value = false
    }
  }

  async function loadPermissions() {
    if (!store.selectedAccountId) { return }
    try {
      const auth = await getOrgAuthorizations(store.selectedAccountId)
      userPermissions.value = auth?.roles ?? []
    } catch {
      userPermissions.value = []
    }
  }

  /** Fetch both account info and caller permissions in parallel. */
  async function load() {
    await Promise.all([refresh(), loadPermissions()])
  }

  const padState = computed<PadState>(() => {
    if (accountLoading.value) { return 'LOADING' }
    const info = store.accountInfo
    if (!info) { return 'NOT_SETUP' }
    const isPad = info.paymentMethod === 'PAD' || info.cfsAccount?.paymentMethod === 'PAD'
    if (!isPad) { return 'NOT_SETUP' }
    const status: CfsAccountStatus | undefined = info.cfsAccount?.status
    if (status === 'FREEZE') { return 'FROZEN' }
    if (status === 'PENDING' || status === 'PENDING_PAD_ACTIVATION') { return 'PENDING' }
    return 'READY'
  })

  // "Not set up" is a subset of padState: true when the account's payment
  // method isn't PAD (i.e., padState === 'NOT_SETUP' but not while loading).
  const padNotSetUp = computed(() => {
    if (accountLoading.value) { return false }
    const info = store.accountInfo
    return !(info?.paymentMethod === 'PAD' || info?.cfsAccount?.paymentMethod === 'PAD')
  })

  // Presence of `change_pad_info` is the same gate sbc-auth's
  // v-can:CHANGE_PAD_INFO directive enforces — admin/coordinator get it,
  // plain users don't. Compared case-insensitively because
  // /orgs/{id}/authorizations returns lowercase actions under `roles`.
  const canEditPadInfo = computed(() =>
    userPermissions.value.some(p => p.toLowerCase() === 'change_pad_info')
  )

  const hasPadBankDetails = computed(() => {
    const cfs = store.accountInfo?.cfsAccount
    return !!(cfs?.bankAccountNumber || cfs?.bankTransitNumber || cfs?.bankInstitutionNumber)
  })

  const accountSettingsUrl = computed(() => {
    const base = (config.authWebUrl || '').replace(/\/$/, '')
    const id = store.selectedAccountId
    if (!base || !id) { return '' }
    return `${base}/account/${id}/settings/product-settings`
  })

  return {
    accountLoading,
    padState,
    padNotSetUp,
    canEditPadInfo,
    hasPadBankDetails,
    accountSettingsUrl,
    load,
    refresh
  }
}
