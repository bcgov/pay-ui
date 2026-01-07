describe('getErrorStatus', () => {
  it('should return status codes from error objects, prioritize response.status, '
    + 'and return undefined for invalid inputs', () => {
    expect(getErrorStatus({ response: { status: 404, data: 'Not Found' } })).toBe(404)
    expect(getErrorStatus({ statusCode: 403, message: 'Forbidden' })).toBe(403)

    const mixedError = {
      statusCode: 500,
      response: { status: 404 }
    }
    expect(getErrorStatus(mixedError)).toBe(404)

    const standardError = new Error('Network failed')
    expect(getErrorStatus(standardError)).toBeUndefined()
    expect(getErrorStatus(null)).toBeUndefined()
    expect(getErrorStatus(undefined)).toBeUndefined()
    expect(getErrorStatus('This is not an error object')).toBeUndefined()
    expect(getErrorStatus(500)).toBeUndefined()
    expect(getErrorStatus({})).toBeUndefined()
    expect(getErrorStatus({ response: { data: 'some data' } })).toBeUndefined()
  })
})
