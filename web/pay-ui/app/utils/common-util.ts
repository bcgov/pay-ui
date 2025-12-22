import type { Address, BaseAddressModel } from '~/interfaces/Address'
import { DateTime } from 'luxon'

function formatDisplayDate(
  date: Date | string | null | undefined,
  format: string | 'start' | 'end' = 'MMM dd, yyyy'
): string {
  if (!date) {
    return ''
  }

  const dateTime = typeof date === 'string'
    ? DateTime.fromISO(date, { zone: 'America/Vancouver' })
    : DateTime.fromJSDate(date).setZone('America/Vancouver')

  if (!dateTime.isValid) {
    return ''
  }

  if (format === 'start') {
    return dateTime.startOf('day').toISO() || ''
  } else if (format === 'end') {
    return dateTime.endOf('day').toISO() || ''
  } else {
    return dateTime.toFormat(format)
  }
}

// blob convert to downloadable file
function fileDownload(
  data: BlobPart,
  fileName: string,
  fileType: string = 'text/plain',
  action: string = 'download'
) {
  const blob = new Blob([data], { type: fileType })
  const blobURL = (window.URL && window.URL.createObjectURL)
    ? window.URL.createObjectURL(blob)
    : window.webkitURL.createObjectURL(blob)
  const tempLink = document.createElement('a')
  tempLink.style.display = 'none'
  tempLink.href = blobURL
  if (action === 'open') {
    tempLink.setAttribute('target', '_blank')
  } else {
    tempLink.setAttribute('download', fileName)
  }

  // Safari thinks _blank anchor are pop ups. We only want to set _blank
  // target if the browser does not support the HTML5 download attribute.
  // This allows you to download files in desktop safari if pop up blocking
  // is enabled.
  if (typeof tempLink.download === 'undefined') {
    tempLink.setAttribute('target', '_blank')
  }
  document.body.appendChild(tempLink)
  tempLink.click()
  setTimeout(() => {
    document.body.removeChild(tempLink)
    // TO CHECK: not revoking may increase more temp memory usage
    // once download, we will revokeObjectURL
    if (action !== 'open') {
      window.URL.revokeObjectURL(blobURL)
    }
  }, 200)
}

function statusListColor(status: string, textColor: boolean = true) {
  let color = ''
  switch (status) {
    case SlipStatus.ACTIVE:
    case SlipStatus.COMPLETE:
    case SlipStatus.REFUNDPROCESSED:
    case SlipStatus.WRITEOFFCOMPLETED:
      color = 'success'
      break
    case SlipStatus.NSF:
    case SlipStatus.LINKED:
    case SlipStatus.REFUNDREQUEST:
    case SlipStatus.REFUNDAUTHORIZED:
    case SlipStatus.WRITEOFFAUTHORIZED:
    case SlipStatus.WRITEOFFREQUESTED:
    case SlipStatus.VOID:
      color = 'error'
      break
  }

  return textColor ? `text-${color}` : color
}

function appendCurrencySymbol(currency: number | string) {
  return '$' + currency
}

function cleanObject(obj: Record<string, unknown>): Record<string, unknown> {
  if (typeof obj.remainingAmount === 'string') {
    obj.remainingAmount = obj.remainingAmount.replace(/[^0-9.]/g, '')
  }

  return Object.keys(obj)
    .filter(k => obj[k] !== '' && obj[k] !== null)
    .reduce((a, k) => ({ ...a, [k]: obj[k] }), {})
}

function createQueryParams(params: Record<string, string>): string {
  return Object.keys(params)
    .map(k => `${k}=${encodeURI(params[k] || '')}`)
    .join('&')
}

function appendQueryParamsIfNeeded(targetUrl: string, route: { query: Record<string, string> }): string {
  const requestParams = createQueryParams(route.query)
  return requestParams ? `${targetUrl}?${requestParams}` : targetUrl
}

// for converting address object of sbc-auth to as needed for BaseAddress component
function convertAddressForComponent(address: Address): BaseAddressModel {
  return {
    addressCity: address.city || '',
    addressCountry: address.country || '',
    addressRegion: address.region || '',
    deliveryInstructions: address.deliveryInstructions || '',
    postalCode: address.postalCode || '',
    streetAddress: address.street || '',
    streetAddressAdditional: address.streetAdditional || ''
  }
}

// for converting address object of BaseAddress component to as needed for sbc-auth
function convertAddressForAuth(iaddress: BaseAddressModel): Address {
  return {
    city: iaddress.addressCity,
    country: iaddress.addressCountry,
    region: iaddress.addressRegion,
    deliveryInstructions: iaddress.deliveryInstructions,
    postalCode: iaddress.postalCode,
    street: iaddress.streetAddress,
    streetAdditional: iaddress.streetAddressAdditional
  }
}

function verifyRoles(requestedAction: Role[]) {
  const auth = useConnectAuth()
  const userRoles = auth.authUser.value?.roles || []
  return userRoles.some(role => requestedAction.includes(role as Role))
}

function isApproverRole() {
  const approverRole = [Role.FAS_REFUND_APPROVER]
  return verifyRoles(approverRole)
}

function isVoidRole() {
  const voidRole: Role[] = [Role.FAS_VOID]
  return verifyRoles(voidRole)
}

function isEftRefundApprover() {
  const refundApproverRole: Role[] = [Role.EftRefundApprover]
  return verifyRoles(refundApproverRole)
}

function canEFTRefund() {
  const eftRefundRole: Role[] = [Role.EftRefund]
  return verifyRoles(eftRefundRole)
}

function getUserInfo() {
  const auth = useConnectAuth()
  return auth.authUser.value
}

/**
 * check its in refunc process
 * @param  {string} status
 */
function isRefundProcessStatus(status: SlipStatus) {
  return [
    SlipStatus.REFUNDREQUEST,
    SlipStatus.REFUNDAUTHORIZED,
    SlipStatus.REFUNDPROCESSED,
    SlipStatus.REFUNDREJECTED,
    SlipStatus.REFUNDUPLOADED
  ].includes(status)
}

/**
 * status is refundrequest
 * @param  {string} status
 */
function isRefundRequestStatus(status: SlipStatus) {
  return [
    SlipStatus.REFUNDREQUEST
  ].includes(status)
}

/**
 * status permission allow to chaneg details
 * @param  {string} status
 */
function isEditEnabledBystatus(status: SlipStatus) {
  return ![
    SlipStatus.REFUNDPROCESSED,
    SlipStatus.REFUNDAUTHORIZED,
    SlipStatus.NSF,
    SlipStatus.LINKED
  ].includes(status)
}

function isObject(object: unknown): boolean {
  return object != null && typeof object === 'object'
}

function isDeepEqual(object1: Record<string, unknown>, object2: Record<string, unknown>): boolean {
  const objKeys1 = Object.keys(object1)
  const objKeys2 = Object.keys(object2)

  if (objKeys1.length !== objKeys2.length) {
    return false
  }

  for (const key of objKeys1) {
    const value1 = object1[key]
    const value2 = object2[key]

    const isObjects = isObject(value1) && isObject(value2)

    if ((isObjects && !isDeepEqual(value1 as Record<string, unknown>, value2 as Record<string, unknown>))
      || (!isObjects && value1 !== value2)
    ) {
      return false
    }
  }
  return true
}

// Format amount for displaying dollar currency
function formatAmount(amount: number | undefined): string {
  if (amount === undefined || amount === null) {
    return '$0.00'
  }
  return amount.toLocaleString('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function formatToTwoDecimals(amount: number | string): string {
  const number = Number(amount)
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return formatter.format(number)
}

function requiredFieldRule(errorMessage: string = 'This field is required') {
  return [(v: string | number | null | undefined) => !!v || errorMessage]
}

function emailRules(isOptional: boolean = false) {
  const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  if (isOptional) {
    return [
      (v: string) => !v || pattern.test(v) || 'Valid email is required'
    ]
  } else {
    return [
      (v: string) => !!v || 'Email address is required',
      (v: string) => pattern.test(v) || 'Valid email is required'
    ]
  }
}

function formatAccountDisplayName(item: { accountId?: string | number, accountName?: string }) {
  return `${item?.accountId} ${item?.accountName}`
}

function getRefundMethodText(refundMethods: Array<{ value: string, text: string }>, refundMethodvalue: string) {
  return refundMethods.find(m => m.value === refundMethodvalue)?.text
}

function extractAndConvertStringToNumber(str: string) {
  return Number(str.replace(/\D/g, ''))
}

function getIndexedTag(tag: string, idx: number | undefined): string {
  return `${tag}-${idx}`
}

export default {
  formatDisplayDate,
  fileDownload,
  statusListColor,
  appendCurrencySymbol,
  cleanObject,
  createQueryParams,
  appendQueryParamsIfNeeded,
  convertAddressForComponent,
  convertAddressForAuth,
  verifyRoles,
  isApproverRole,
  isVoidRole,
  isEftRefundApprover,
  canEFTRefund,
  getUserInfo,
  isRefundProcessStatus,
  isRefundRequestStatus,
  formatAmount,
  formatToTwoDecimals,
  emailRules,
  formatAccountDisplayName,
  getRefundMethodText,
  extractAndConvertStringToNumber,
  isDeepEqual,
  isEditEnabledBystatus,
  requiredFieldRule,
  getIndexedTag
}
