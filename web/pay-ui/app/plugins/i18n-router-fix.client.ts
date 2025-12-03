// The intent of this is to get rid of the /en-ca routing errors that show up on initial load.
export default defineNuxtPlugin(() => {
  if (import.meta.server) {
    return
  }

  const router = useRouter()

  const originalResolve = router.resolve.bind(router)
  router.resolve = (to: string | { path?: string, name?: string }) => {
    if (typeof to === 'string' && (to === '/en-CA' || to === '/fr-CA')) {
      return originalResolve('/')
    }
    if (to && typeof to === 'object' && (to.path === '/en-CA' || to.path === '/fr-CA')) {
      return originalResolve('/')
    }
    try {
      return originalResolve(to)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('/en-CA') || errorMessage.includes('/fr-CA')) {
        return originalResolve('/')
      }
      throw error
    }
  }
})
