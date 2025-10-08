export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated, authUser } = useConnectAuth()
  const rtc = useRuntimeConfig().public
  const localePath = useLocalePath()

  if (!isAuthenticated.value) {
    return navigateTo(localePath(`/auth/login?return=${rtc.baseUrl}${to.fullPath.slice(1)}`))
  } else if (to.meta?.allowedRoles && !to.meta.allowedRoles.some(role => authUser.value.roles.includes(role))) {
    throw createError({
      statusCode: 403,
      fatal: true,
      message: 'Missing required role.'
    })
  }
})
