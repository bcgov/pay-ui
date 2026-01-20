import { EFTErrorCode, EFTErrorMessage, FASErrorCode, FASErrorMessage } from '~/enums/api-errors'

interface ApiError {
  response?: {
    _data?: {
      type?: string
      title?: string
      detail?: string
      rootCause?: {
        type?: string
        title?: string
        detail?: string
      }
    }
    data?: {
      type?: string
      title?: string
      detail?: string
      rootCause?: {
        type?: string
        title?: string
        detail?: string
      }
    }
  }
  data?: {
    type?: string
    title?: string
    detail?: string
    rootCause?: {
      type?: string
      title?: string
      detail?: string
    }
  }
}

export function getEFTErrorMessage(error: unknown): string {
  const apiMessage = extractErrorMessage(error)
  if (apiMessage) {
    return apiMessage
  }

  const errorType = extractErrorType(error)

  if (!errorType) {
    return 'An error occurred while processing your request.'
  }

  const knownError = Object.values(EFTErrorCode).find(code => code === errorType)
  if (knownError) {
    return EFTErrorMessage[knownError as EFTErrorCode]
  }

  return `An error occurred: ${errorType}`
}

export function getFASErrorMessage(error: unknown): string {
  const apiMessage = extractErrorMessage(error)
  if (apiMessage) {
    return apiMessage
  }

  const errorType = extractErrorType(error)

  if (!errorType) {
    return 'An error occurred while processing your request.'
  }

  const knownError = Object.values(FASErrorCode).find(code => code === errorType)
  if (knownError) {
    return FASErrorMessage[knownError as FASErrorCode]
  }

  return `An error occurred: ${errorType}`
}

export function getErrorMessage(error: unknown): string {
  const apiMessage = extractErrorMessage(error)
  if (apiMessage) {
    return apiMessage
  }

  const errorType = extractErrorType(error)

  if (!errorType) {
    return 'An error occurred while processing your request.'
  }

  const eftError = Object.values(EFTErrorCode).find(code => code === errorType)
  if (eftError) {
    return EFTErrorMessage[eftError as EFTErrorCode]
  }

  const fasError = Object.values(FASErrorCode).find(code => code === errorType)
  if (fasError) {
    return FASErrorMessage[fasError as FASErrorCode]
  }

  return `An error occurred: ${errorType}`
}

export function extractErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined
  }

  const apiError = error as ApiError

  return (
    apiError.response?._data?.rootCause?.title
    || apiError.response?._data?.title
    || apiError.response?.data?.rootCause?.title
    || apiError.response?.data?.title
    || apiError.data?.rootCause?.title
    || apiError.data?.title
  )
}

export function extractErrorType(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined
  }

  const apiError = error as ApiError

  return (
    apiError.response?._data?.type
    || apiError.response?._data?.rootCause?.type
    || apiError.response?.data?.type
    || apiError.response?.data?.rootCause?.type
    || apiError.data?.type
    || apiError.data?.rootCause?.type
  )
}

export function isEFTError(error: unknown, errorCode: EFTErrorCode): boolean {
  const errorType = extractErrorType(error)
  return errorType === errorCode
}

export function isFASError(error: unknown, errorCode: FASErrorCode): boolean {
  const errorType = extractErrorType(error)
  return errorType === errorCode
}
