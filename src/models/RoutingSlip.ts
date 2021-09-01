import { Invoice } from './Invoice'
import { Payment } from './Payment'

// Each Routing Slip is tied to an account - PayBC
export interface AccountInfo {
  accountName?: string
  name?: string
  billable?: boolean
  paymentMethod?: string
}
// Class for storing values in CreateRoutingSlip component - for POST endpoint
export interface RoutingSlip {
  id?: number
  number?: string
  paymentAccount?: AccountInfo
  payments?: Payment[]
  routingSlipDate?: string
  createdBy?: string
  createdOn?: string
  total?: number
  remainingAmount?: number
  invoices?: Invoice[]
  status?: string
  createdName?:string,
  parentNumber?:string
}
// Class for storing values in CreateRoutingSlipDetails component
export interface RoutingSlipDetails {
  number?: string
  routingSlipDate?: string
}
export interface LinkRoutingSlipPrams{
  childRoutingSlipNumber:string,
  parentRoutingSlipNumber:string,
}

export interface LinkedRoutingSlips{
  children?: RoutingSlip[],
  parent?: RoutingSlip,
}

export interface ManualTransactionDetails{
  quantity?: number,
  referenceNumber?: string,
  total?: number,
  isFutureEffectiveFiling?: boolean,
  isPriorityFee?: boolean
}
