import { defineNuxtPlugin } from '#app'
import { useRoute } from 'vue-router'

// Add body class for wide table pages (home, eft)
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('vue:setup', () => {
    const route = useRoute()

    const wideTablePaths = ['/home', '/eft']

    watch(() => route.path, (newPath) => {
      const isWideTablePage = wideTablePaths.some(path => newPath.includes(path))
      if (isWideTablePage) {
        document.body.classList.add('table-wide-active')
      } else {
        document.body.classList.remove('table-wide-active')
      }
    }, { immediate: true })
  })
})
