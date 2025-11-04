import type { Address } from '@/models/Address'

export interface NotaryInformation {
  notaryName?: string
  address?: Address
  key?: string
}

export interface NotaryContact {
  email?: string
  phone?: string
  extension?: string
  key?: string
}
