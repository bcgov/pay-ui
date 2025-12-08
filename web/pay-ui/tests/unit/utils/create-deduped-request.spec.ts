describe('createDedupedRequest', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should trigger the promise only once when run concurrently', async () => {
    const dedupeRequest = createDedupedRequest()
    const mockApiCall = vi.fn(
      () => new Promise(resolve => setTimeout(() => resolve('API Response'), 100))
    )

    const promise1 = dedupeRequest.run('key-1', mockApiCall)
    const promise2 = dedupeRequest.run('key-1', mockApiCall)
    const promise3 = dedupeRequest.run('key-1', mockApiCall)

    await vi.advanceTimersByTimeAsync(100)

    const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3])

    expect(mockApiCall).toHaveBeenCalledOnce()
    expect(result1).toBe('API Response')
    expect(result2).toBe('API Response')
    expect(result3).toBe('API Response')
  })

  it('should trigger each promise once for different keys', async () => {
    const dedupeRequest = createDedupedRequest()
    const mockApiCall1 = vi.fn(() => Promise.resolve('Response 1'))
    const mockApiCall2 = vi.fn(() => Promise.resolve('Response 2'))

    const result1 = await dedupeRequest.run('key1', mockApiCall1)
    const result2 = await dedupeRequest.run('key2', mockApiCall2)

    expect(mockApiCall1).toHaveBeenCalledOnce()
    expect(mockApiCall2).toHaveBeenCalledOnce()
    expect(result1).toBe('Response 1')
    expect(result2).toBe('Response 2')
  })

  it('should trigger the same promise when run consecutively', async () => {
    const dedupeRequest = createDedupedRequest()
    const mockApiCall = vi.fn(
      (value: string) => new Promise(resolve => setTimeout(() => resolve(value), 100))
    )

    const result1Promise = dedupeRequest.run('key1', () => mockApiCall('first'))
    await vi.advanceTimersByTimeAsync(100)
    const result1 = await result1Promise

    const result2Promise = dedupeRequest.run('key1', () => mockApiCall('second'))
    await vi.advanceTimersByTimeAsync(100)
    const result2 = await result2Promise

    expect(mockApiCall).toHaveBeenCalledTimes(2)
    expect(result1).toBe('first')
    expect(result2).toBe('second')
  })

  it('should handle promise rejection and still dedupe', async () => {
    const dedupeRequest = createDedupedRequest()
    const mockApiCall = vi.fn(() => Promise.reject(new Error('API Error')))

    const promise1 = dedupeRequest.run('key-1', mockApiCall)
    const promise2 = dedupeRequest.run('key-1', mockApiCall)

    await expect(promise1).rejects.toThrow('API Error')
    await expect(promise2).rejects.toThrow('API Error')

    expect(mockApiCall).toHaveBeenCalledOnce()
  })

  it('should remove promise from map after completion', async () => {
    const dedupeRequest = createDedupedRequest()
    const mockApiCall = vi.fn(() => Promise.resolve('Response'))

    await dedupeRequest.run('key-1', mockApiCall)
    await dedupeRequest.run('key-1', mockApiCall)

    expect(mockApiCall).toHaveBeenCalledTimes(2)
  })

  it('should handle different data types in responses', async () => {
    const dedupeRequest = createDedupedRequest()
    const mockApiCall = vi.fn(() => Promise.resolve({ data: 'test', count: 123 }))

    const result = await dedupeRequest.run('key-1', mockApiCall)

    expect(result).toEqual({ data: 'test', count: 123 })
  })
})
