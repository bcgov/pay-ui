import type { Address, BaseAddressModel } from '@/models/Address'
import { Role, SlipStatus } from '@/utils/constants'
import { DateTime } from 'luxon'

export default class CommonUtils {
  static formatDisplayDate(date: Date | string, format: string = 'MMM dd, yyyy'): string {
    if (!date) return '';
    
    const dateTime = DateTime.fromJSDate(
      typeof date === 'string' ? new Date(date) : date
    );
    
    return dateTime.isValid ? dateTime.toFormat(format) : '';
  }

  // blob convert to downloadable file
  static fileDownload (data: any, fileName: string, fileType: string = 'text/plain', action:string = 'download') {
    const blob = new Blob([data], { type: fileType })

    const blobURL = (window.URL && window.URL.createObjectURL) ? window.URL.createObjectURL(blob) : window.webkitURL.createObjectURL(blob)
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

  static statusListColor (status: string, textColor: boolean = true) {
    let color = ''
    switch (status) {
      case SlipStatus.ACTIVE:
      case SlipStatus.COMPLETE:
      case SlipStatus.REFUNDPROCESSED:
      case SlipStatus.WRITEOFFCOMPLETED:
        color = 'success'
        break
      case SlipStatus.BOUNCED:
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

  static appendCurrencySymbol (currency: number | string) {
    return '$' + currency
  }

  static cleanObject (obj: any) {
    if (obj.remainingAmount) {
      obj.remainingAmount = obj.remainingAmount.replace(/[^0-9.]/g, '')
    }
    return Object.keys(obj)
      .filter((k) => obj[k] !== '' && obj[k] !== null)
      .reduce((a, k) => ({ ...a, [k]: obj[k] }), {})
  }

  static createQueryParams = (params: Record<string, any>) =>
    Object.keys(params)
      .map(k => `${k}=${encodeURI(params[k])}`)
      .join('&')

  static appendQueryParamsIfNeeded (targetUrl: string, route: any): string {
    const requestParams = CommonUtils.createQueryParams(route.query)
    return requestParams ? `${targetUrl}?${requestParams}` : targetUrl
  }

  // for converting address object of sbc-auth to as needed for BaseAddress component
  static convertAddressForComponent (address: Address) : BaseAddressModel {
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
  static convertAddressForAuth (iaddress: BaseAddressModel) : Address {
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

  static verifyRoles (requestedAction: Role[]) {
    const auth = useConnectAuth()
    const userRoles = auth.authUser.value?.roles || []
  return userRoles.some(role => requestedAction.includes(role as Role))
  }

  static isApproverRole () {
    const approverRole = [Role.FAS_REFUND_APPROVER]
    return CommonUtils.verifyRoles(approverRole)
  }

  static isVoidRole () {
    const voidRole:any = [Role.FAS_VOID]
    return CommonUtils.verifyRoles(voidRole)
  }

  static isEftRefundApprover () {
    const refundApproverRole:any = [Role.EftRefundApprover]
    return CommonUtils.verifyRoles(refundApproverRole)
  }

  static canEFTRefund () {
    const eftRefundRole:any = [Role.EftRefund]
    return CommonUtils.verifyRoles(eftRefundRole)
  }

  static getUserInfo () {
    const auth = useConnectAuth()
    return auth.authUser.value
  }

  /**
   * check its in refunc process
   * @param  {string} status
   */
  static isRefundProcessStatus (status: SlipStatus) {
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
  static isRefundRequestStatus (status: SlipStatus) {
    return [
      SlipStatus.REFUNDREQUEST
    ].includes(status)
  }

  /**
   * status permission allow to chaneg details
   * @param  {string} status
   */
  static isEditEnabledBystatus (status: SlipStatus) {
    return ![
      SlipStatus.REFUNDPROCESSED,
      SlipStatus.REFUNDAUTHORIZED,
      SlipStatus.NSF,
      SlipStatus.LINKED
    ].includes(status)
  }

  static isObject = (object: any) => {
    return object != null && typeof object === 'object'
  }

  static isDeepEqual = (object1: any, object2: any) => {
    const objKeys1 = Object.keys(object1)
    const objKeys2 = Object.keys(object2)

    if (objKeys1.length !== objKeys2.length) return false

    for (const key of objKeys1) {
      const value1 = object1[key]
      const value2 = object2[key]

      const isObjects = CommonUtils.isObject(value1) && CommonUtils.isObject(value2)

      if ((isObjects && !CommonUtils.isDeepEqual(value1, value2)) ||
        (!isObjects && value1 !== value2)
      ) {
        return false
      }
    }
    return true
  }

  // Format amount for displaying dollar currency
  static formatAmount (amount: number): string {
    return amount.toLocaleString('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  static formatToTwoDecimals (amount: number | string): string {
    const number = Number(amount)
    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    return formatter.format(number)
  }

  static emailRules (isOptional: boolean = false) {
    const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    if (isOptional) {
      return [
        (v: any) => !v || pattern.test(v) || 'Valid email is required'
      ]
    } else {
      return [
        (v: any) => !!v || 'Email address is required',
        (v: any) => pattern.test(v) || 'Valid email is required'
      ]
    }
  }

  static formatAccountDisplayName (item: any) {
    return `${item?.accountId} ${item?.accountName}`
  }

  static getRefundMethodText (refundMethods: any[], refundMethodvalue: string) {
    return refundMethods.find(m => m.value === refundMethodvalue)?.text
  }

  static extractAndConvertStringToNumber (str: string) {
    return Number(str.replace(/\D/g, ''))
  }
}
