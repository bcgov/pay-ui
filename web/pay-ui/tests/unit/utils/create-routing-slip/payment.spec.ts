
describe('Create Routing Slip - Payment', () => {
  describe('getRoutingSlipDateSchema', () => {
    const dateSchema = getRoutingSlipDateSchema()

    it('should pass for an ISO date', () => {
      expect(dateSchema.safeParse('2025-01-01').success).toBe(true)
    })

    it('should fail an empty string', () => {
      const result = dateSchema.safeParse('')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]!.message).toBe('Cheque date is required')
      }
    })

    it('should fail a null value', () => {
      const result = dateSchema.safeParse(null)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]!.message).toBe('Cheque date is required')
      }
    })
  })

  describe('getRoutingSlipAmountSchema', () => {
    const amountSchema = getRoutingSlipAmountSchema()

    it('should pass no decimal places', () => {
      expect(amountSchema.safeParse('100').success).toBe(true)
    })

    it('should pass two decimal places', () => {
      expect(amountSchema.safeParse('99.99').success).toBe(true)
    })

    it('should fail more than two decimal places', () => {
      const result = amountSchema.safeParse('10.123')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]!.message).toBe('Paid Amount can only be up to 2 decimal places')
      }
    })

    it('should fail an empty string', () => {
      const result = amountSchema.safeParse('')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]!.message).toBe('Paid Amount is required')
      }
    })
  })

  describe('getRoutingSlipPaymentSchema', () => {
    const paymentSchema = getRoutingSlipPaymentSchema()

    const createItem = (overrides = {}) => ({
      uuid: '123',
      amountCAD: '10.00',
      amountUSD: '7.50',
      identifier: 'abc',
      date: '2025-01-01',
      ...overrides
    })

    it('should not require amountUSD when isUSD = false', () => {
      const result = paymentSchema.safeParse({
        paymentType: PaymentTypes.CASH,
        isUSD: false,
        paymentItems: { 123: createItem({ amountUSD: '' }) }
      })
      expect(result.success).toBe(true)
    })

    it('should require amountUSD when isUSD = true', () => {
      const result = paymentSchema.safeParse({
        paymentType: PaymentTypes.CASH,
        isUSD: true,
        paymentItems: { 123: createItem({ amountUSD: '' }) }
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues[0]!
        expect(issue.path).toEqual(['paymentItems', '123', 'amountUSD'])
        expect(issue.message).toBe('Paid Amount is required')
      }
    })

    it('should not require a date for cash payment', () => {
      const result = paymentSchema.safeParse({
        paymentType: PaymentTypes.CASH,
        isUSD: false,
        paymentItems: { 123: createItem({ date: '' }) }
      })
      expect(result.success).toBe(true)
    })

    it('should require a date for cheque payment', () => {
      const result = paymentSchema.safeParse({
        paymentType: PaymentTypes.CHEQUE,
        isUSD: false,
        paymentItems: { 123: createItem({ date: '' }) }
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues[0]!
        expect(issue.path).toEqual(['paymentItems', '123', 'date'])
        expect(issue.message).toBe('Cheque date is required')
      }
    })
  })
})
