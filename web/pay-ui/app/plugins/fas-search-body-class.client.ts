import { defineNuxtPlugin } from '#app'
import { useRoute } from 'vue-router'

//Temp code replace 
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('vue:setup', () => {
    const route = useRoute()
    const isFasSearch = ref(false) 

    watch(() => route.path, (newPath) => {
      if (isFasSearch.value || newPath === '/home') {
        document.body.classList.add('fas-search-active')
      } else {
        isFasSearch.value = false
        document.body.classList.remove('fas-search-active')
      }
    }, { immediate: true })
  })
})
