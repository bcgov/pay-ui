import type { LinkedRoutingSlips, Payment, RoutingSlip } from '~/interfaces/routing-slip'
import { PaymentTypes } from '~/enums/payment-types'
import { SlipStatus } from '~/enums/slip-status'

export const cashPaymentMock: Payment = {
  id: 7636,
  chequeReceiptNumber: '123456',
  paymentMethod: PaymentTypes.CASH,
  paidAmount: 982,
  paidUsdAmount: 0,
  createdBy: 'NAME@IDIR',
  paymentDate: '2025-02-23',
  isRoutingSlip: true
}

export const chequePaymentMock: Payment[] = [
  {
    id: 7637,
    chequeReceiptNumber: '123',
    paymentMethod: PaymentTypes.CHEQUE,
    paidAmount: 10.87,
    paidUsdAmount: 9,
    createdBy: 'NAME@IDIR',
    paymentDate: '2025-09-28T00:00:00',
    isRoutingSlip: true
  },
  {
    id: 7638,
    chequeReceiptNumber: '321',
    paymentMethod: PaymentTypes.CHEQUE,
    paidAmount: 45.98,
    paidUsdAmount: 30,
    createdBy: 'NAME@IDIR',
    paymentDate: '2025-02-23T00:00:00',
    isRoutingSlip: true
  }
]

export const routingSlipMock: RoutingSlip = {
  id: 4,
  number: '123456789',
  paymentAccount: {
    accountName: 'Test Account',
    billable: true,
    paymentMethod: PaymentTypes.CHEQUE
  },
  payments: chequePaymentMock,
  remainingAmount: 1000,
  total: 2000,
  totalUsd: 39,
  routingSlipDate: '2025-02-23',
  status: SlipStatus.ACTIVE,
  createdBy: 'NAME@IDIR',
  createdOn: '2025-02-23T10:00:00',
  createdName: 'John Rogers'
}

export const linkedRoutingSlipsWithChildren: LinkedRoutingSlips = {
  children: [
    {
      id: 5,
      number: '987654321',
      payments: [
        {
          id: 7639,
          chequeReceiptNumber: '456',
          paymentMethod: PaymentTypes.CASH,
          paidAmount: 500,
          paidUsdAmount: 0,
          createdBy: 'NAME@IDIR',
          paymentDate: '2025-02-24',
          isRoutingSlip: true
        }
      ],
      total: 500,
      remainingAmount: 250,
      status: SlipStatus.ACTIVE
    }
  ]
}

export const linkedRoutingSlipsWithChequeChildren: LinkedRoutingSlips = {
  children: [
    {
      id: 6,
      number: '111222333',
      payments: [
        {
          id: 7640,
          chequeReceiptNumber: '789',
          paymentMethod: PaymentTypes.CHEQUE,
          paidAmount: 300,
          paidUsdAmount: 250,
          createdBy: 'NAME@IDIR',
          paymentDate: '2025-02-25T00:00:00',
          isRoutingSlip: true
        }
      ],
      total: 300,
      totalUsd: 250,
      remainingAmount: 150,
      status: SlipStatus.ACTIVE
    }
  ]
}
