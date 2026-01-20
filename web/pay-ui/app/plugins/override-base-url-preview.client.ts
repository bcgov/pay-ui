export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  if (config.public.isPreviewBuild) {
    const requestUrl = useRequestURL()
    console.log('PREVIEW BUILD DETECTED.')
    config.public.baseUrl = requestUrl.origin + '/'
  }
})
