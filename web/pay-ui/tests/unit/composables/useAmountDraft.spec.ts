import { describe, expect, it } from 'vitest'
import { useAmountDraft } from '~/composables/useAmountDraft'

describe('useAmountDraft', () => {
  it('keeps a trailing decimal point while typing cents', () => {
    const { displayAmount, setDraft } = useAmountDraft()
    expect(displayAmount('cad', 520)).toBe('520')
    const amount = setDraft('cad', '520.')
    expect(amount).toBe(520)
    expect(displayAmount('cad', amount)).toBe('520.')
    expect(displayAmount('cad', setDraft('cad', '520.6'))).toBe('520.6')
    expect(displayAmount('cad', setDraft('cad', '520.68'))).toBe('520.68')
  })

  it('falls back to the stored amount when it changes externally', () => {
    const { displayAmount, setDraft } = useAmountDraft()
    setDraft('cad', '520.')
    expect(displayAmount('cad', 300)).toBe('300')
    expect(displayAmount('usd', 0)).toBe('')
  })
})

describe('useAmountDraft sanitizing', () => {
  it('strips non-numeric characters and limits to 2 decimals', () => {
    const { displayAmount, setDraft } = useAmountDraft()
    expect(displayAmount('cad', setDraft('cad', '1a0.0.5x9'))).toBe('10.05')
  })
})
