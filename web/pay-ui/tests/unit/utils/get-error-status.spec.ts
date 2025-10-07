import { describe, it, expect } from 'vitest'

describe('getErrorStatus', () => {
  it('should return the status code from response.status error object', () => {
    expect(getErrorStatus({ response: { status: 404, data: 'Not Found' } })).toBe(404)
  })

  it('should return the statusCode from an error object', () => {
    expect(getErrorStatus({ statusCode: 403, message: 'Forbidden' })).toBe(403)
  })

  it('should return undefined for a standard Error object', () => {
    const standardError = new Error('Network failed')
    expect(getErrorStatus(standardError)).toBeUndefined()
  })

  it('should prioritize error.response.status over error.statusCode if both exist', () => {
    const mixedError = {
      statusCode: 500,
      response: { status: 404 }
    }
    expect(getErrorStatus(mixedError)).toBe(404)
  })

  it('should return undefined for a null input', () => {
    expect(getErrorStatus(null)).toBeUndefined()
  })

  it('should return undefined for an undefined input', () => {
    expect(getErrorStatus(undefined)).toBeUndefined()
  })

  it('should return undefined for a string input', () => {
    expect(getErrorStatus('This is not an error object')).toBeUndefined()
  })

  it('should return undefined for a number input', () => {
    expect(getErrorStatus(500)).toBeUndefined()
  })

  it('should return undefined for an empty object', () => {
    expect(getErrorStatus({})).toBeUndefined()
  })

  it('should return undefined if error.response exists but has no status', () => {
    expect(getErrorStatus({ response: { data: 'some data' } })).toBeUndefined()
  })
})
