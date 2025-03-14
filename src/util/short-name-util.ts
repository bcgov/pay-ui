import { EFTRefund } from '@/models/short-name'
import { ChequeRefundStatus, EFTRefundStatus, EFTRefundStatusDescription, ShortNameType, ShortNameTypeDescription } from '@/util/constants'

/**
 * A class to put all the common short name utility methods.
 */
export default class ShortNameUtils {
  // Header Filter item definitions used for drop down select
  static readonly ShortNameTypeItems = [
    { text: ShortNameTypeDescription[ShortNameType.EFT], value: ShortNameType.EFT },
    { text: ShortNameTypeDescription[ShortNameType.WIRE], value: ShortNameType.WIRE }
  ]

  static getShortNameTypeDescription (type: string) {
    return type ? ShortNameTypeDescription[type] : type
  }

  static getEFTRefundStatusDescription (refundDetails: EFTRefund) {
    const { chequeStatus, status: refundStatus } = refundDetails

    // For approved/completed statuses, show cheque status if available
    if ([EFTRefundStatus.APPROVED, EFTRefundStatus.COMPLETED].includes(refundStatus as EFTRefundStatus) && chequeStatus) {
      const status = ChequeRefundStatus.find(status => status.code === chequeStatus)
      if (status) {
        return status.text
      }
    }
    // Default to showing the refund status description
    return refundStatus ? EFTRefundStatusDescription[refundStatus] : refundStatus
  }
}
