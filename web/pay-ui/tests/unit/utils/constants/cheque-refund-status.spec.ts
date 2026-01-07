import { ChequeRefundStatus } from '~/utils/constants/cheque-refund-status'

describe('ChequeRefundStatus', () => {
  it('should be defined, have correct structure, contain all required statuses, '
    + 'and have correct status details', () => {
    expect(ChequeRefundStatus).toBeDefined()
    expect(Array.isArray(ChequeRefundStatus)).toBe(true)

    ChequeRefundStatus.forEach((status) => {
      expect(status).toHaveProperty('code')
      expect(status).toHaveProperty('text')
      expect(status).toHaveProperty('display')
      expect(typeof status.code).toBe('string')
      expect(typeof status.text).toBe('string')
      expect(typeof status.display).toBe('boolean')
    })

    const codes = ChequeRefundStatus.map(s => s.code)
    expect(codes).toContain('PROCESSING')
    expect(codes).toContain('PROCESSED')
    expect(codes).toContain('CHEQUE_UNDELIVERABLE')
    expect(codes.length).toBe(3)

    const uniqueCodes = new Set(codes)
    expect(uniqueCodes.size).toBe(codes.length)

    const processingStatus = ChequeRefundStatus.find(s => s.code === 'PROCESSING')
    expect(processingStatus).toBeDefined()
    expect(processingStatus?.text).toBe('Processing')
    expect(processingStatus?.display).toBe(false)

    const processedStatus = ChequeRefundStatus.find(s => s.code === 'PROCESSED')
    expect(processedStatus).toBeDefined()
    expect(processedStatus?.text).toBe('Cheque Issued')
    expect(processedStatus?.display).toBe(true)

    const undeliverableStatus = ChequeRefundStatus.find(s => s.code === 'CHEQUE_UNDELIVERABLE')
    expect(undeliverableStatus).toBeDefined()
    expect(undeliverableStatus?.text).toBe('Cheque Undeliverable')
    expect(undeliverableStatus?.display).toBe(true)

    const displayableStatuses = ChequeRefundStatus.filter(s => s.display)
    expect(displayableStatuses.length).toBe(2)
    expect(displayableStatuses.map(s => s.code)).toEqual(['PROCESSED', 'CHEQUE_UNDELIVERABLE'])

    const internalStatuses = ChequeRefundStatus.filter(s => !s.display)
    expect(internalStatuses.length).toBe(1)
    expect(internalStatuses[0]?.code).toBe('PROCESSING')
  })
})
