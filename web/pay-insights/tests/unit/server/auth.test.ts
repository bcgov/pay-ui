import { getRealmRoles, hasAllowedRole, parseAllowedRoles, safeReturnPath } from '../../../server/utils/auth'

describe('auth utils', () => {
  it('parses a comma-separated role list', () => {
    expect(parseAllowedRoles('staff, pay_insights_viewer,,')).toEqual(['staff', 'pay_insights_viewer'])
  })

  it('reads realm roles from the token payload', () => {
    expect(getRealmRoles({ realm_access: { roles: ['staff', 'public_user'] } })).toEqual(['staff', 'public_user'])
    expect(getRealmRoles({})).toEqual([])
  })

  it('allows only users with an allowed role', () => {
    expect(hasAllowedRole(['public_user', 'staff'], ['staff'])).toBe(true)
    expect(hasAllowedRole(['public_user'], ['staff'])).toBe(false)
    expect(hasAllowedRole([], [])).toBe(false)
  })

  it('only redirects back to paths in this app', () => {
    expect(safeReturnPath('/en-CA/reports?fy=2025')).toBe('/en-CA/reports?fy=2025')
    expect(safeReturnPath('https://evil.example')).toBe('/')
    expect(safeReturnPath('//evil.example')).toBe('/')
    expect(safeReturnPath('/\\evil.example')).toBe('/')
    expect(safeReturnPath(undefined)).toBe('/')
  })
})
