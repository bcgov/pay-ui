/*
Composable function for loader component that is displayed whenever async process takes place
Global loader is used in App.vue where show a full route loader -
<loader-component v-show="globalLoader"></loader-component>
While, isLoading can be used inside an individual component -
<loader-component v-if="isLoading"></loader-component>
<load>
*/

import { useIndicators } from '@/composables/useIndicators'

export function useLoader() {
  const { isThereActiveCalls } = useIndicators()
  const isLoading = ref<boolean>(false)

  function changeLoadingStatus(isLoadingStatus: boolean): void {
    isLoading.value = isLoadingStatus
  }

  function toggleLoading(isLoading: boolean): void {
    changeLoadingStatus(isLoading)
  }

  return {
    isLoading,
    isThereActiveCalls,
    toggleLoading
  }
}
