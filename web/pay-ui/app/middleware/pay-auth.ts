export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated, authUser } = useConnectAuth()
  if (!isAuthenticated.value) {
    const requestUrl = useRequestURL()
    const baseUrl = requestUrl.origin
    return navigateTo(`/auth/login?return=${baseUrl}/${to.fullPath.slice(1)}`)
  } else if (to.meta?.allowedRoles && !to.meta.allowedRoles.some(role => authUser.value.roles.includes(role))) {
    throw createError({
      statusCode: 403,
      fatal: true,
      message: 'Missing required role.'
    })
  }
})
