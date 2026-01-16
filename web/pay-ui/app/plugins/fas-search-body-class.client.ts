import { defineNuxtPlugin } from '#app'
import { useRoute } from 'vue-router'

// Add body class for wide table pages (home, eft)
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('vue:setup', () => {
    const route = useRoute()

    const wideTablePaths = ['/home', '/eft']
    const excludedPaths = ['/eft/shortname-details']

    watch(() => route.path, (newPath) => {
      const isExcluded = excludedPaths.some(path => newPath.includes(path))
      const isWideTablePage = !isExcluded && wideTablePaths.some(path => newPath.includes(path))
      if (isWideTablePage) {
        document.body.classList.add('table-wide-active')
      } else {
        document.body.classList.remove('table-wide-active')
      }
    }, { immediate: true })
  })
})
