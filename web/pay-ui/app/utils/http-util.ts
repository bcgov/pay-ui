import Axios from 'axios'
import { useIndicators } from '@/composables/useIndicators'

const axios = Axios.create()

const { activeCalls, hasCallFailed, isThereActiveCalls } = useIndicators()

axios.defaults.showGlobalLoader = false // by default, false
axios.defaults.showGlobalErrorHandling = true

axios.interceptors.request.use(
  async (config) => {
    const auth = useConnectAuth()
    const token = await auth.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (config.showGlobalLoader) {
      activeCalls.value++
    }
    return config
  },
  error => Promise.reject(error)
)

axios.interceptors.response.use(
  (response) => {
    // decrement active calls count by one
    if (response.config.showGlobalLoader && isThereActiveCalls.value) {
      activeCalls.value--
    }
    return response
  },
  (error) => {
    // decrement active calls count by one
    if (error.config?.showGlobalLoader && isThereActiveCalls.value) {
      activeCalls.value--
    }
    // call has failed in this case. And if the config showGlobalErrorHandling is true, then update store
    if (error.config?.showGlobalErrorHandling && error?.response?.status >= 500) {
      hasCallFailed.value = true
    }
    return Promise.reject(error)
  }
)

// to work on both case export as default and normal
export { axios }
export default axios
