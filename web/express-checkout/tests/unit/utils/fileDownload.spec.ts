import { fileDownload, formatFilingDateTime } from '~/utils/fileDownload'

describe('formatFilingDateTime', () => {
  it('returns an empty string for missing input', () => {
    expect(formatFilingDateTime(null)).toBe('')
    expect(formatFilingDateTime(undefined)).toBe('')
    expect(formatFilingDateTime('')).toBe('')
  })

  it('returns an empty string for unparseable input', () => {
    expect(formatFilingDateTime('not-a-date')).toBe('')
  })

  it('formats ISO strings as MMM dd, yyyy in Pacific time', () => {
    // 2026-09-01T18:00:00Z is 2026-09-01 in Vancouver (UTC-7 during DST)
    expect(formatFilingDateTime('2026-09-01T18:00:00Z')).toBe('Sep 01, 2026')
  })

  it('formats Date instances', () => {
    expect(formatFilingDateTime(new Date('2026-01-15T20:00:00Z'))).toBe('Jan 15, 2026')
  })
})

describe('fileDownload', () => {
  // JSDOM's happy-dom lacks URL.createObjectURL — stub it for the test window.
  let createSpy: ReturnType<typeof vi.fn>
  let revokeSpy: ReturnType<typeof vi.fn>
  let clickSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    createSpy = vi.fn().mockReturnValue('blob:mock-url')
    revokeSpy = vi.fn()
    window.URL.createObjectURL = createSpy as unknown as typeof URL.createObjectURL
    window.URL.revokeObjectURL = revokeSpy as unknown as typeof URL.revokeObjectURL
    clickSpy = vi.fn()
    // Force every created anchor to record .click() through our spy.
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreate(tag)
      if (tag === 'a') {
        (el as HTMLAnchorElement).click = clickSpy
      }
      return el
    })
  })

  it('creates an object URL, appends a download anchor, clicks it, and cleans up', async () => {
    fileDownload(new Uint8Array([1, 2, 3]), 'test.pdf')
    expect(createSpy).toHaveBeenCalledOnce()
    expect(clickSpy).toHaveBeenCalledOnce()
    // Cleanup runs in a 200 ms setTimeout — advance to trigger it.
    await new Promise(r => setTimeout(r, 250))
    expect(revokeSpy).toHaveBeenCalledWith('blob:mock-url')
  })
})
