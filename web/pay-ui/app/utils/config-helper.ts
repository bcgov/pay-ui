import { SessionStorageKeys } from '@/utils/constants'

async function fetchConfig() {
  // sbc common components need the following keys
  sessionStorage.setItem(SessionStorageKeys.AuthApiUrl, getAuthAPIUrl())
  sessionStorage.setItem(SessionStorageKeys.PayApiUrl, getPayAPIURL())
  sessionStorage.setItem(SessionStorageKeys.StatusApiUrl, getStatusAPIUrl())
  sessionStorage.setItem(SessionStorageKeys.AuthWebUrl, getAuthWebUrl())
  sessionStorage.setItem(SessionStorageKeys.FasWebUrl, getFasWebUrl())
  if (getSiteminderLogoutUrl()) {
    sessionStorage.setItem(SessionStorageKeys.SiteminderLogoutUrl, getSiteminderLogoutUrl())
  }
}

/**
 * this will run everytime when vue is being loaded..so do the call only when session storage doesnt have the values
 */
function saveConfigToSessionStorage() {
  return fetchConfig()
}

function getSelfURL() {
  // this is without a trailing slash
  return `${window.location.origin}${import.meta.env.VUE_APP_PATH}`.replace(/\/$/, '') // remove the slash at the end
}

function getLdClientId() {
  return `${import.meta.env.VUE_APP_PAY_LD_CLIENT_ID}`
}

function getPayAPIURL() {
  // const payApiUrl = `${import.meta.env.NUXT_PUBLIC_PAY_API_URL}` + `${import.meta.env.NUXT_PUBLIC_PAY_API_VERSION}`
  const payApiUrl = 'https://pay-api-dev-142173140222.northamerica-northeast1.run.app/api/v1'
  return sessionStorage.getItem(SessionStorageKeys.PayApiUrl) || payApiUrl
}

function getFasAPIURL() {
  return `${getPayAPIURL()}/fas`
}

function getAuthAPIUrl() {
  const authApiUrl = `${import.meta.env.NUXT_PUBLIC_AUTH_API_URL}` + `${import.meta.env.NUXT_PUBLIC_AUTH_API_VERSION}`
  return sessionStorage.getItem(SessionStorageKeys.AuthApiUrl) || authApiUrl
}

function getAuthWebUrl() {
  return sessionStorage.getItem(SessionStorageKeys.AuthWebUrl) || `${import.meta.env.NUXT_PUBLIC_AUTH_WEB_URL}`
}

function getFasWebUrl() {
  return sessionStorage.getItem(SessionStorageKeys.FasWebUrl) || `${import.meta.env.NUXT_PUBLIC_FAS_WEB_URL}`
}

function getStatusAPIUrl() {
  const statusApiUrl = `${import.meta.env.NUXT_PUBLIC_STATUS_API_URL}`
    + `${import.meta.env.NUXT_PUBLIC_STATUS_API_VERSION}`
  return sessionStorage.getItem(SessionStorageKeys.StatusApiUrl) || statusApiUrl
}

function getSiteminderLogoutUrl() {
  const logoutUrl = `${import.meta.env.NUXT_PUBLIC_SITEMINDER_LOGOUT_URL}`
  return sessionStorage.getItem(SessionStorageKeys.SiteminderLogoutUrl) || logoutUrl
}

function getKeycloakAuthUrl() {
  return `${import.meta.env.NUXT_PUBLIC_KEYCLOAK_AUTH_URL}`
}

function getKeycloakRealm() {
  return `${import.meta.env.NUXT_PUBLIC_KEYCLOAK_REALM}`
}

function getKeycloakClientId() {
  return `${import.meta.env.NUXT_PUBLIC_KEYCLOAK_CLIENTID}`
}

function getAddressCompleteKey() {
  return `${import.meta.env.NUXT_PUBLIC_ADDRESS_COMPLETE_KEY}`
}

function addToSession(key: string, value: string) {
  sessionStorage.setItem(key, value)
}

function getFromSession(key: string) {
  return sessionStorage.getItem(key)
}

function removeFromSession(key: string) {
  sessionStorage.removeItem(key)
}

function clearSession() {
  sessionStorage.clear()
}

export default {
  fetchConfig,
  saveConfigToSessionStorage,
  getSelfURL,
  getLdClientId,
  getPayAPIURL,
  getFasAPIURL,
  getAuthAPIUrl,
  getAuthWebUrl,
  getFasWebUrl,
  getStatusAPIUrl,
  getSiteminderLogoutUrl,
  getKeycloakAuthUrl,
  getKeycloakRealm,
  getKeycloakClientId,
  getAddressCompleteKey,
  addToSession,
  getFromSession,
  removeFromSession,
  clearSession
}
