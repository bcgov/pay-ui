// This fixes warning about /en-CA in the console.
export default defineNuxtPlugin(() => {
  if (process.server) return

  const router = useRouter()

  const originalResolve = router.resolve.bind(router)
  router.resolve = (to: any) => {
    if (to === '/en-CA' || to === '/fr-CA') {
      return originalResolve('/')
    }
    if (to?.path === '/en-CA' || to?.path === '/fr-CA') {
      return originalResolve('/')
    }
    try {
      return originalResolve(to)
    } catch (error: any) {
      throw error
    }
  }
})
