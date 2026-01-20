export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  if (config.public.isPreviewBuild) {
    const requestUrl = useRequestURL()
    config.public.baseUrl = requestUrl.origin + '/'
  }
})
