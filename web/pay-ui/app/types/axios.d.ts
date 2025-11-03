import { AxiosRequestConfig } from 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    showGlobalLoader?: boolean;
    showGlobalErrorHandling?: boolean
  }
}