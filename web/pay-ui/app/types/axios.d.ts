// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AxiosRequestConfig } from 'axios'

declare module 'axios' {

  // TODO: remove this later if not required
  interface AxiosRequestConfig {
    showGlobalLoader?: boolean
    showGlobalErrorHandling?: boolean
  }
}
