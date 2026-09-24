/**
 * Keeps the raw text typed into numeric amount inputs, so intermediate values like "520." or "520.0"
 * are not wiped out when the stored number is re-stringified on every keystroke.
 */
export function useAmountDraft() {
  const drafts = reactive<Record<string, string>>({})

  function displayAmount(key: string, amount?: number | null): string {
    const draft = drafts[key]
    if (draft !== undefined && Number(draft) === Number(amount || 0)) {
      return draft
    }
    return amount ? String(amount) : ''
  }

  function setDraft(key: string, value: string | number): number {
    drafts[key] = String(value ?? '')
    return Number(value)
  }

  return { displayAmount, setDraft }
}
