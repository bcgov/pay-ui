import { ChequeRefundStatus } from '~/utils/constants/cheque-refund-status'

describe('ChequeRefundStatus', () => {
  it('should be defined', () => {
    expect(ChequeRefundStatus).toBeDefined()
    expect(Array.isArray(ChequeRefundStatus)).toBe(true)
  })

  it('should have correct structure for each status', () => {
    ChequeRefundStatus.forEach((status) => {
      expect(status).toHaveProperty('code')
      expect(status).toHaveProperty('text')
      expect(status).toHaveProperty('display')
      expect(typeof status.code).toBe('string')
      expect(typeof status.text).toBe('string')
      expect(typeof status.display).toBe('boolean')
    })
  })

  it('should contain PROCESSING status', () => {
    const processingStatus = ChequeRefundStatus.find(s => s.code === 'PROCESSING')
    expect(processingStatus).toBeDefined()
    expect(processingStatus?.text).toBe('Processing')
    expect(processingStatus?.display).toBe(false)
  })

  it('should contain PROCESSED status', () => {
    const processedStatus = ChequeRefundStatus.find(s => s.code === 'PROCESSED')
    expect(processedStatus).toBeDefined()
    expect(processedStatus?.text).toBe('Cheque Issued')
    expect(processedStatus?.display).toBe(true)
  })

  it('should contain CHEQUE_UNDELIVERABLE status', () => {
    const undeliverableStatus = ChequeRefundStatus.find(s => s.code === 'CHEQUE_UNDELIVERABLE')
    expect(undeliverableStatus).toBeDefined()
    expect(undeliverableStatus?.text).toBe('Cheque Undeliverable')
    expect(undeliverableStatus?.display).toBe(true)
  })

  it('should have all required statuses', () => {
    const codes = ChequeRefundStatus.map(s => s.code)
    expect(codes).toContain('PROCESSING')
    expect(codes).toContain('PROCESSED')
    expect(codes).toContain('CHEQUE_UNDELIVERABLE')
    expect(codes.length).toBe(3)
  })

  it('should have unique codes', () => {
    const codes = ChequeRefundStatus.map(s => s.code)
    const uniqueCodes = new Set(codes)
    expect(uniqueCodes.size).toBe(codes.length)
  })

  it('should have display true for user-facing statuses', () => {
    const displayableStatuses = ChequeRefundStatus.filter(s => s.display)
    expect(displayableStatuses.length).toBe(2)
    expect(displayableStatuses.map(s => s.code)).toEqual(['PROCESSED', 'CHEQUE_UNDELIVERABLE'])
  })

  it('should have display false for internal statuses', () => {
    const internalStatuses = ChequeRefundStatus.filter(s => !s.display)
    expect(internalStatuses.length).toBe(1)
    expect(internalStatuses[0]?.code).toBe('PROCESSING')
  })
})
