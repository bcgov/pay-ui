import type { AccountPaymentInfo } from '../stores/paymentLink'

export interface PadBankInfo {
  bankInstitutionNumber: string
  bankTransitNumber: string
  bankAccountNumber: string
}

export interface PadVerifyResponse {
  isValid: boolean
  message?: string | string[]
  statusCode?: number
}

/**
 * Account-side helpers used by the express-checkout checkout page:
 *   - fetch current payment method + CFS account state (drives PAD widget / OB display)
 *   - validate PAD banking details against pay-api
 *   - PUT the org's paymentInfo through auth-api when the user completes PAD setup
 *
 * All URLs come from the `$payApi` / `$authApi` fetchers injected by `nuxt-pay` /
 * `nuxt-auth` respectively.
 */
export function useAccount() {
  const { $payApi, $authApi } = useNuxtApp()

  /** GET /accounts/{id} → paymentMethod + cfsAccount (status, cfsAccountNumber, …) */
  async function getAccountPaymentInfo(accountId: number): Promise<AccountPaymentInfo> {
    return await ($payApi as ReturnType<typeof $fetch.create>)<AccountPaymentInfo>(
      `/accounts/${accountId}`,
      {
        method: 'GET'
      }
    )
  }

  /** POST /bank-accounts/verifications — same call auth-web makes to validate bank info. */
  async function verifyPadInfo(padInfo: PadBankInfo): Promise<PadVerifyResponse> {
    return await ($payApi as ReturnType<typeof $fetch.create>)<PadVerifyResponse>(
      '/bank-accounts/verifications',
      {
        method: 'POST',
        body: padInfo
      }
    )
  }

  /**
   * GET auth-api /orgs/{orgId}/authorizations?expanded=true — returns the caller's
   * roles on the org (`{ roles: ['admin' | 'coordinator' | 'user' | 'make_payment', ...] }`).
   * Used to gate the PAD setup widget: only `admin` / `coordinator` can change PAD info,
   * matching sbc-auth's `v-can:CHANGE_PAD_INFO` directive.
   */
  async function getOrgAuthorizations(orgId: number): Promise<{ roles: string[] }> {
    return await ($authApi as ReturnType<typeof $fetch.create>)<{ roles: string[] }>(
      `/orgs/${orgId}/authorizations`,
      {
        method: 'GET',
        query: { expanded: 'true' }
      }
    )
  }

  /**
   * PUT auth-api /orgs/{orgId} — flips the org's paymentInfo to PAD with the supplied
   * bank details. Mirrors the request shape auth-web's `updateOrg` builds.
   */
  async function updateOrgPadInfo(orgId: number, padInfo: PadBankInfo): Promise<unknown> {
    return await ($authApi as ReturnType<typeof $fetch.create>)(
      `/orgs/${orgId}`,
      {
        method: 'PUT',
        body: {
          paymentInfo: {
            paymentMethod: 'PAD',
            bankInstitutionNumber: padInfo.bankInstitutionNumber,
            bankTransitNumber: padInfo.bankTransitNumber,
            bankAccountNumber: padInfo.bankAccountNumber
          }
        }
      }
    )
  }

  return { getAccountPaymentInfo, verifyPadInfo, updateOrgPadInfo, getOrgAuthorizations }
}
