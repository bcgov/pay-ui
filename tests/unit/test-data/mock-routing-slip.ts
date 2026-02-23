import {
  AccountInfo,
  LinkedRoutingSlips,
  ManualTransactionDetails,
  RefundRequestDetails,
  RoutingSlip,
  RoutingSlipDetails
} from '@/models/RoutingSlip'
import { Address, BaseAddressModel } from '@/models/Address'

import { Invoice } from '@/models/Invoice'
import { InvoiceStatus } from '@/util/constants'
import { Payment } from '@/models/Payment'

export const invoice: Invoice[] = [
  {
    businessIdentifier: 'CP0001405',
    corpTypeCode: 'CP',
    createdBy: 'SERVICE-ACCOUNT-ENTITY-SERVICE-ACCOUNT',
    createdOn: '2021-07-15T17:57:32.432827',
    id: 1,
    lineItems: [
      {
        description: 'Annual Report'
      },
      {
        description: '2.0 Version1'
      }
    ],
    references: [
      {
        id: 8427,
        invoiceNumber: 'REGD00010652',
        statusCode: 'ACTIVE'
      }
    ],
    total: 1000,
    statusCode: 'COMPLETED'
  },
  {
    businessIdentifier: 'CP000140135',
    corpTypeCode: 'CP',
    createdName: 'testIDIR',
    createdOn: '2021-07-15T17:57:32.432827',
    id: 1,
    lineItems: [
      {
        description: 'Annual Report'
      }
    ],
    references: [
      {
        id: 8427,
        invoiceNumber: 'REGD00010652',
        statusCode: 'COMPLETED'
      }
    ],
    total: 10000,
    statusCode: 'COMPLETED'
  }
]

export const cancelledInvoice: Invoice[] = [
  {
    businessIdentifier: 'CP0001405',
    corpTypeCode: 'CP',
    createdBy: 'SERVICE-ACCOUNT-ENTITY-SERVICE-ACCOUNT',
    createdOn: '2021-07-15T17:57:32.432827',
    id: 1,
    lineItems: [
      {
        description: 'Annual Report'
      },
      {
        description: '2.0 Version1'
      }
    ],
    references: [
      {
        id: 8427,
        invoiceNumber: 'REGD00010652',
        statusCode: 'ACTIVE'
      }
    ],
    total: 1000,
    statusCode: InvoiceStatus.REFUND_REQUESTED
  },
  {
    businessIdentifier: 'CP000140135',
    corpTypeCode: 'CP',
    createdName: 'testIDIR',
    createdOn: '2021-07-15T17:57:32.432827',
    id: 1,
    lineItems: [
      {
        description: 'Annual Report'
      }
    ],
    references: [
      {
        id: 8427,
        invoiceNumber: 'REGD00010652',
        statusCode: 'COMPLETED'
      }
    ],
    total: 10000,
    statusCode: 'COMPLETED'
  }
]

export const routingSlipMock: RoutingSlip = {
  id: 4,
  number: '123',
  paymentAccount: { billable: true, name: 'test', paymentMethod: 'CHEQUE' },
  payments: [
    {
      chequeReceiptNumber: '123',
      createdBy: 'user',
      id: 7636,
      paymentMethod: 'CHEQUE',
      paidAmount: 123,
      paymentDate: '2021-07-15'
    }
  ],
  remainingAmount: 1000,
  routingSlipDate: '2021-07-08',
  status: 'ACTIVE',
  total: 1000,
  invoices: invoice
}

export const routingSlipWithCancelledInvoice: RoutingSlip = {
  id: 4,
  number: '123',
  paymentAccount: { billable: true, name: 'test', paymentMethod: 'CHEQUE' },
  payments: [
    {
      chequeReceiptNumber: '123',
      createdBy: 'user',
      id: 7636,
      paymentMethod: 'CHEQUE',
      paidAmount: 123,
      paymentDate: '2021-07-15'
    }
  ],
  remainingAmount: 1000,
  routingSlipDate: '2021-07-08',
  status: 'ACTIVE',
  total: 1000,
  invoices: cancelledInvoice
}

export const routingSlipRefundRequested: RoutingSlip = {
  id: 4,
  number: '123',
  paymentAccount: { billable: true, name: 'test', paymentMethod: 'CHEQUE' },
  payments: [
    {
      chequeReceiptNumber: '123',
      createdBy: 'user',
      id: 7636,
      paymentMethod: 'CHEQUE',
      paidAmount: 123,
      paymentDate: '2021-07-15'
    }
  ],
  remainingAmount: 1000,
  routingSlipDate: '2021-07-08',
  status: 'REFUND_REQUESTED',
  total: 1000,
  invoices: invoice
}

export const routingSlipDetailsMock: RoutingSlipDetails = {
  number: 'RoutingTEST123',
  routingSlipDate: '2021-08-13'
}

export const accountInfoMock: AccountInfo = {
  accountName: 'Thomas Wayne'
}

export const chequePaymentMock: Payment[] = [
  {
    chequeReceiptNumber: 'CHEQUE1',
    paidAmount: 100,
    paymentMethod: 'CHEQUE'
  },
  {
    chequeReceiptNumber: 'CHEQUE2',
    paidAmount: 100,
    paymentMethod: 'CHEQUE'
  }
]

export const cashPaymentMock: Payment = {
  chequeReceiptNumber: 'CASH123',
  paidAmount: 1000,
  paymentMethod: 'CASH'
}

export const linkedRoutingSlipsWithChildren: LinkedRoutingSlips = {
  children: [
    {
      id: 49,
      number: '123REF1231',
      parentNumber: '998877665',
      paymentAccount: {
        accountName: 'Thomas Shelby',
        billable: true,
        paymentMethod: 'CASH'
      },
      payments: [
        {
          chequeReceiptNumber: '123RF1231',
          id: 7884,
          isRoutingSlip: true,
          paidAmount: 1000.0,
          paymentMethod: 'CASH',
          paymentSystem: 'FAS',
          statusCode: 'COMPLETED'
        }
      ],
      remainingAmount: 10900.0,
      routingSlipDate: '2021-07-09',
      status: 'LINKED',
      total: 1000.0
    }
  ],
  parent: null
}

export const linkedRoutingSlipsWithChequeChildren: LinkedRoutingSlips = {
  children: [
    {
      id: 49,
      number: '123REF1231',
      parentNumber: '998877665',
      paymentAccount: {
        accountName: 'Thomas Shelby',
        billable: true,
        paymentMethod: 'CHEQUE'
      },
      payments: [
        {
          chequeReceiptNumber: '123RF1231',
          id: 7884,
          isRoutingSlip: true,
          paidAmount: 1000.0,
          paymentMethod: 'CHEQUE',
          paymentSystem: 'FAS',
          statusCode: 'COMPLETED'
        }
      ],
      remainingAmount: 10900.0,
      routingSlipDate: '2021-07-09',
      status: 'LINKED',
      total: 1000.0
    }
  ],
  parent: null
}

export const autoCompleteRoutingSlips: RoutingSlip[] = [
  {
    id: 1,
    number: 'AutoComplete1',
    paymentAccount: { billable: true, name: 'test', paymentMethod: 'CHEQUE' },
    payments: [
      {
        chequeReceiptNumber: '123',
        createdBy: 'user',
        id: 7636,
        paymentMethod: 'CHEQUE',
        paidAmount: 123,
        paymentDate: '2021-07-15'
      }
    ],
    remainingAmount: 1000,
    routingSlipDate: '2021-07-08',
    status: 'ACTIVE',
    total: 1000,
    invoices: invoice
  },
  {
    id: 2,
    number: 'AutoComplete2',
    paymentAccount: { billable: true, name: 'test', paymentMethod: 'CHEQUE' },
    payments: [
      {
        chequeReceiptNumber: '123',
        createdBy: 'user',
        id: 7636,
        paymentMethod: 'CHEQUE',
        paidAmount: 123,
        paymentDate: '2021-07-15'
      }
    ],
    remainingAmount: 1000,
    routingSlipDate: '2021-07-08',
    status: 'ACTIVE',
    total: 2000,
    invoices: invoice
  }
]

export const filingType: any = [
  {
    corpTypeCode: {
      code: 'BEN',
      description: 'Benefit Company',
      isOnlineBankingAllowed: true,
      product: 'BUSINESS'
    },
    fee: 'EN107',
    feeEndDate: null,
    feeScheduleId: 31,
    feeStartDate: '2019-12-23',
    filingTypeCode: { code: 'BCCGM', description: 'Notice of Change' },
    futureEffectiveFee: null,
    priorityFee: null,
    serviceFee: 'TRF01'
  }
]

export const manualTransactionDetails: ManualTransactionDetails = {
  futureEffective: false,
  priority: true,
  referenceNumber: 'test',
  filingType: {
    corpTypeCode: {
      code: 'BEN',
      description: 'Benefit Company',
      isOnlineBankingAllowed: true,
      product: 'BUSINESS'
    },
    fee: 'EN107',
    feeScheduleId: 31,
    filingTypeCode: { code: 'BCCGM', description: 'Notice of Change' },
    futureEffectiveFee: null,
    priorityFee: null
  },
  quantity: 1
}

export const address: Address = {
  city: 'Victoria', country: 'CA', postalCode: 'V9B 6A2', region: 'BC', street: '799 McCallum Rd', streetAdditional: ''
}

export const baseAddress: BaseAddressModel = {
  addressCity: 'Victoria', addressCountry: 'CA', postalCode: 'V9B 6A2', addressRegion: 'BC', streetAddress: '799 McCallum Rd', streetAddressAdditional: ''
}

export const refundRequestDetails: RefundRequestDetails = {
  name: 'test',
  mailingAddress: { city: 'Victoria', country: 'CA', postalCode: 'V9B 6A2', region: 'BC', street: '799 McCallum Rd', streetAdditional: '' }
}
