const hasCallFailed = ref<boolean>(false)
const activeCalls = ref<number>(0)
const isThereActiveCalls = computed<boolean>(() => {
  return activeCalls.value > 0
})

export const useIndicators = () => {
  return {
    hasCallFailed,
    activeCalls,
    isThereActiveCalls
  }
}
