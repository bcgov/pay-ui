import { ShortNameType, ShortNameTypeDescription } from '@/utils/constants'

export const ShortNameTypeItems = [
  { label: ShortNameTypeDescription.EFT, value: ShortNameType.EFT },
  { label: ShortNameTypeDescription.WIRE, value: ShortNameType.WIRE }
]

export function getShortNameTypeDescription(shortNameType: string): string {
  switch (shortNameType) {
    case ShortNameType.EFT:
      return ShortNameTypeDescription.EFT
    case ShortNameType.WIRE:
      return ShortNameTypeDescription.WIRE
    default:
      return shortNameType || ''
  }
}

export default {
  ShortNameTypeItems,
  getShortNameTypeDescription
}
