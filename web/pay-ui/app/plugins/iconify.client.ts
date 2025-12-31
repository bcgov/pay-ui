import { addCollection } from '@iconify/vue'
import { icons as mdiIcons } from '@iconify-json/mdi'

export default defineNuxtPlugin(() => {
  // Add MDI icon collection locally to prevent API fetching
  addCollection(mdiIcons)
})
