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

  /**
   * POST /bank-accounts/verifications — same call auth-web makes to validate bank info.
   *
   * Fail-open on downstream outage (mirrors auth-web's `validatePADInfo` in
   * `sbc-auth/auth-web/src/stores/org.ts:481-501`): if pay-api reports the
   * CAS/pay-connector chain is unreachable (`statusCode !== 200`) or the request
   * itself throws, treat the info as valid so setup can proceed. Bank rejection
   * would still surface later at debit time — blocking here on a transient
   * upstream outage is worse than proceeding.
   */
  async function verifyPadInfo(padInfo: PadBankInfo): Promise<PadVerifyResponse> {
    try {
      const response = await ($payApi as ReturnType<typeof $fetch.create>)<PadVerifyResponse>(
        '/bank-accounts/verifications',
        {
          method: 'POST',
          body: padInfo
        }
      )
      if (response?.statusCode !== 200) {
        return { isValid: true }
      }
      return response
    } catch (err) {
      const e = err as { response?: { status?: number } }
      console.error('PAD Verification API Failed! - ', err)
      return {
        isValid: true,
        statusCode: e?.response?.status ?? 500,
        message: 'Failed'
      }
    }
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
   * PUT auth-api /orgs/{orgId} — flips the org's paymentInfo to PAD with the
   * supplied bank details. Mirrors the request shape auth-web's `updateOrg`
   * builds.
   *
   * `?scope=cfs_account` narrows auth-api's update handler to just the CFS-
   * account/paymentInfo path — it skips the general org rules (e.g. Premium
   * upgrade checks) that would otherwise reject a PAD-info-only update from
   * this express flow.
   */
  async function updateOrgPadInfo(orgId: number, padInfo: PadBankInfo): Promise<unknown> {
    return await ($authApi as ReturnType<typeof $fetch.create>)(
      `/orgs/${orgId}`,
      {
        method: 'PUT',
        query: { scope: 'cfs_account' },
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

  /**
   * GET auth-api /documents/termsofuse_pad — returns the latest PAD terms document.
   * Same call auth-web's TermsOfUseDialog uses. Response shape includes:
   *   { type, version_id, content }  — content is HTML/markdown, with "Month Day, Year"
   *   swapped to today's date server-side.
   */
  async function getPadTermsOfUse(): Promise<{ content: string, version_id?: string, type?: string }> {
    return await ($authApi as ReturnType<typeof $fetch.create>)<{ content: string, version_id?: string, type?: string }>(
      '/documents/termsofuse_pad',
      { method: 'GET' }
    )
  }

  return { getAccountPaymentInfo, verifyPadInfo, updateOrgPadInfo, getOrgAuthorizations, getPadTermsOfUse }
}
