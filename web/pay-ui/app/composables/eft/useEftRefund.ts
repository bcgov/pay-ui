import { EFTRefundStatus } from '@/utils/constants'

export interface EftRefund {
  id: number
  shortNameId?: number
  createdName?: string
  createdBy?: string
  createdOn?: string
  comment?: string
  refundMethod?: string
  refundAmount?: number
  casSupplierNumber?: string
  casSupplierSite?: string
  refundEmail?: string
  entityName?: string
  street?: string
  streetAdditional?: string
  city?: string
  region?: string
  country?: string
  postalCode?: string
  deliveryInstructions?: string
  decisionBy?: string
  updatedOn?: string
  declineReason?: string
  status?: string
  chequeStatus?: string
}

export interface EftRefundRequest {
  shortNameId: number
  refundMethod: string
  refundAmount: number
  refundEmail: string
  comment: string
  casSupplierNumber?: string
  casSupplierSite?: string
  entityName?: string
  street?: string
  streetAdditional?: string
  city?: string
  region?: string
  country?: string
  postalCode?: string
  deliveryInstructions?: string
}

export function useEftRefund() {
  const nuxtApp = useNuxtApp()
  const $payApi = (nuxtApp.$payApiWithErrorHandling || nuxtApp.$payApi) as typeof nuxtApp.$payApi

  async function getEftRefunds(shortNameId: number, statuses?: string[]): Promise<EftRefund[]> {
    const params = new URLSearchParams({
      shortNameId: String(shortNameId)
    })
    if (statuses?.length) {
      params.append('statuses', statuses.join(','))
    }

    return await $payApi<EftRefund[]>(
      `/eft-shortnames/shortname-refund?${params.toString()}`,
      { method: 'GET' }
    )
  }

  async function getPendingRefunds(shortNameId: number): Promise<EftRefund[]> {
    return getEftRefunds(shortNameId, [EFTRefundStatus.PENDING_APPROVAL])
  }

  async function getEftRefund(refundId: number): Promise<EftRefund | null> {
    const response = await $payApi<EftRefund>(
      `/eft-shortnames/shortname-refund/${refundId}`,
      { method: 'GET' }
    )
    return response || null
  }

  async function createEftRefund(request: EftRefundRequest): Promise<EftRefund> {
    return $payApi<EftRefund>('/eft-shortnames/shortname-refund', {
      method: 'POST',
      body: request
    })
  }

  async function approveRefund(refundId: number): Promise<void> {
    await $payApi(`/eft-shortnames/shortname-refund/${refundId}`, {
      method: 'PATCH',
      body: { status: EFTRefundStatus.APPROVED }
    })
  }

  async function declineRefund(refundId: number, declineReason?: string): Promise<void> {
    await $payApi(`/eft-shortnames/shortname-refund/${refundId}`, {
      method: 'PATCH',
      body: {
        status: EFTRefundStatus.DECLINED,
        declineReason
      }
    })
  }

  async function updateChequeStatus(refundId: number, chequeStatus: string): Promise<void> {
    await $payApi(`/eft-shortnames/shortname-refund/${refundId}`, {
      method: 'PATCH',
      body: { chequeStatus }
    })
  }

  return {
    getEftRefunds,
    getPendingRefunds,
    getEftRefund,
    createEftRefund,
    approveRefund,
    declineRefund,
    updateChequeStatus
  }
}
