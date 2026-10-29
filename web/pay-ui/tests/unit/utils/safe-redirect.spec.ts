describe('getSafeRedirectUrl', () => {
  const origins = ['https://pay.example.ca']
  const fallback = 'https://pay.example.ca/home'

  it('allows same-origin absolute and relative URLs', () => {
    expect(getSafeRedirectUrl('https://pay.example.ca/eft?x=1', origins, fallback))
      .toBe('https://pay.example.ca/eft?x=1')
    expect(getSafeRedirectUrl('/transactions', origins, fallback)).toBe('https://pay.example.ca/transactions')
  })

  it('rejects script URLs, other origins and malformed input', () => {
    expect(getSafeRedirectUrl('javascript:alert(1)', origins, fallback)).toBe(fallback)
    expect(getSafeRedirectUrl('JaVaScRiPt:alert(1)', origins, fallback)).toBe(fallback)
    expect(getSafeRedirectUrl('data:text/html,<script>1</script>', origins, fallback)).toBe(fallback)
    expect(getSafeRedirectUrl('https://evil.example', origins, fallback)).toBe(fallback)
    expect(getSafeRedirectUrl('//evil.example/x', origins, fallback)).toBe(fallback)
    expect(getSafeRedirectUrl('https://pay.example.ca.evil.example', origins, fallback)).toBe(fallback)
    expect(getSafeRedirectUrl('http://[', origins, fallback)).toBe(fallback)
  })

  it('returns the fallback for missing, non-string or unconfigured input', () => {
    expect(getSafeRedirectUrl(undefined, origins, fallback)).toBe(fallback)
    expect(getSafeRedirectUrl(['/a', '/b'], origins, fallback)).toBe(fallback)
    expect(getSafeRedirectUrl('/home', [], fallback)).toBe(fallback)
  })
})

describe('getAppOrigins', () => {
  it('includes the window origin and the base URL origin, ignoring malformed base URLs', () => {
    expect(getAppOrigins('https://pay.example.ca/app/')).toEqual([window.location.origin, 'https://pay.example.ca'])
    expect(getAppOrigins('not a url')).toEqual([window.location.origin])
  })
})
