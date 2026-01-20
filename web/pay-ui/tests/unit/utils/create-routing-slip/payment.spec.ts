describe('Create Routing Slip - Payment', () => {
  describe('getRoutingSlipDateSchema', () => {
    const dateSchema = getRoutingSlipDateSchema()

    it.each([
      ['2025-01-01', true, undefined],
      ['', false, 'Cheque date is required'],
      [null, false, 'Cheque date is required']
    ])('should validate %s', (input, shouldPass, errorMessage) => {
      const result = dateSchema.safeParse(input)
      expect(result.success).toBe(shouldPass)
      if (!shouldPass && !result.success) {
        expect(result.error.issues[0]!.message).toBe(errorMessage)
      }
    })
  })

  describe('getRoutingSlipAmountSchema', () => {
    const amountSchema = getRoutingSlipAmountSchema()

    it.each([
      ['100', true, undefined],
      ['99.99', true, undefined],
      ['0.01', true, undefined],
      ['10.123', false, 'Paid Amount can only be up to 2 decimal places'],
      ['', false, 'Paid Amount is required'],
      ['0', false, 'Paid Amount must be greater than zero'],
      ['0.00', false, 'Paid Amount must be greater than zero']
    ])('should validate %s', (input, shouldPass, errorMessage) => {
      const result = amountSchema.safeParse(input)
      expect(result.success).toBe(shouldPass)
      if (!shouldPass && !result.success) {
        expect(result.error.issues[0]!.message).toBe(errorMessage)
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

    it.each([
      [PaymentTypes.CASH, false, { amountUSD: '' }, true, undefined, undefined],
      [PaymentTypes.CASH, true, { amountUSD: '' }, false, ['paymentItems', '123', 'amountUSD'], 'Paid Amount is required'],
      [PaymentTypes.CASH, false, { date: '' }, true, undefined, undefined],
      [PaymentTypes.CHEQUE, false, { date: '' }, false, ['paymentItems', '123', 'date'], 'Cheque date is required']
    ])('should validate %s payment with isUSD=%s', (paymentType, isUSD, overrides, shouldPass, errorPath, errorMessage) => {
      const result = paymentSchema.safeParse({
        paymentType,
        isUSD,
        paymentItems: { 123: createItem(overrides) }
      })

      expect(result.success).toBe(shouldPass)
      if (!shouldPass && !result.success) {
        const issue = result.error.issues[0]!
        expect(issue.path).toEqual(errorPath)
        expect(issue.message).toBe(errorMessage)
      }
    })
  })
})
