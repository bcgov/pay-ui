/**
 * Every page and every /api route requires a signed-in user with an allowed role,
 * so a new report can't be added without access control.
 * - Not signed in: pages redirect to Keycloak login, /api returns 401.
 * - Signed in without an allowed role: 403.
 */
const PUBLIC_PREFIXES = ['/auth/', '/_nuxt/', '/__nuxt', '/api/_nuxt_icon/']

export default defineEventHandler(async (event) => {
  const path = event.path.split('?')[0] ?? '/'
  const isApi = path.startsWith('/api/')
  const isStaticFile = !isApi && /\.[a-z0-9]+$/i.test(path)

  if (isStaticFile || PUBLIC_PREFIXES.some(prefix => path.startsWith(prefix))) {
    return
  }

  try {
    event.context.user = await requireInsightsUser(event)
  } catch (error) {
    if (!isApi && (error as { statusCode?: number }).statusCode === 401) {
      return sendRedirect(event, `/auth/login?return=${encodeURIComponent(event.path)}`)
    }
    throw error
  }
})
