import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Create Routing Slip - Address', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRoutingSlipAddressSchema', () => {
    const addressSchema = getRoutingSlipAddressSchema()

    it('should pass with name and address', () => {
      const result = addressSchema.safeParse({
        name: 'Valid Name',
        address: { street: 'Main' }
      })
      expect(result.success).toBe(true)
    })

    it('should fail if name is too long', () => {
      const longName = 'a'.repeat(91)
      const result = addressSchema.safeParse({
        name: longName,
        address: {}
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues[0]!
        expect(issue.message).toBe('Maximum 90 characters')
        expect(issue.path).toEqual(['name'])
      }
    })

    it('should validate address', () => {
      const longStreet = 'a'.repeat(51)
      const result = addressSchema.safeParse({
        name: 'Valid Name',
        address: { street: longStreet }
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues[0]!
        expect(issue.message).toBe('Maximum 50 characters')
        expect(issue.path).toEqual(['address', 'street'])
      }
    })

    it('should pass if name is empty', () => {
      const result = addressSchema.safeParse({
        name: '',
        address: {}
      })
      expect(result.success).toBe(true)
    })
  })
})
