export interface RefundRevenueType {
  paymentLineItemId: number
  refundAmount: number
  refundType: string
}

export interface RefundRequest {
  reason: string
  refundRevenue?: RefundRevenueType[]
}

export interface EftRefundBaseRequest {
  shortNameId: number
  refundAmount: number
  refundEmail: string
  comment?: string
}

export interface EftRefundRequest extends EftRefundBaseRequest{
  casSupplierNum: string
  casSupplierSite: string
}

export interface EftRefundChequeRequest extends EftRefundBaseRequest{
  entityName: string
  addressCity: string
  addressCountry: string
  addressRegion: string
  deliveryInstructions?: string
  postalCode: string
  streetAddress: string
  streetAddressAdditional?: string
}
