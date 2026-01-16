import { ShortNameLinkStatus, ShortNamePaymentActions } from '@/utils/constants'

export interface ShortNameLink {
  id: number
  accountId: number
  accountName?: string
  accountBranch?: string
  shortNameId: number
  statusCode: string
  statementsOwing: StatementOwing[]
}

export interface StatementOwing {
  statementId: number
  amountOwing: number
  pendingPaymentsCount: number
  pendingPaymentsAmount: number
}

export interface AccountLinkRow {
  id: number
  accountId: number
  accountName?: string
  accountBranch?: string
  shortNameId: number
  statusCode: string
  statementsOwing: StatementOwing[]
  isParentRow: boolean
  hasMultipleStatements: boolean
  hasPendingPayment: boolean
  hasPayableStatement: boolean
  hasInsufficientFunds: boolean
  insufficientFundMessage?: string
  amountOwing: number
  pendingPaymentAmountTotal: number
  unpaidStatementIds: string
  statementId?: number
}

export function useShortNameAccountLink(shortNameId: Ref<number>, creditsRemaining: Ref<number>) {
  const nuxtApp = useNuxtApp()
  const $payApi = (nuxtApp.$payApiWithErrorHandling || nuxtApp.$payApi) as typeof nuxtApp.$payApi

  const links = ref<ShortNameLink[]>([])
  const loading = ref(false)
  const expandedStatements = ref<Set<number>>(new Set())

  async function loadShortNameLinks(): Promise<void> {
    try {
      loading.value = true
      const response = await $payApi<{ items: ShortNameLink[] }>(
        `/eft-shortnames/${shortNameId.value}/links`,
        { method: 'GET' }
      )
      links.value = response?.items || []
    } catch (error) {
      console.error('Failed to loadShortNameLinks list.', error)
      links.value = []
    } finally {
      loading.value = false
    }
  }

  async function unlinkAccount(linkId: number): Promise<boolean> {
    try {
      loading.value = true
      await $payApi(
        `/eft-shortnames/${shortNameId.value}/links/${linkId}`,
        {
          method: 'PATCH',
          body: { statusCode: ShortNameLinkStatus.INACTIVE }
        }
      )
      await loadShortNameLinks()
      return true
    } catch (error) {
      console.error('Failed to unlink account.', error)
      return false
    } finally {
      loading.value = false
    }
  }

  async function applyPayment(accountId: number, statementId?: number): Promise<boolean> {
    try {
      loading.value = true
      const body: { action: string, accountId: string, statementId?: number } = {
        action: ShortNamePaymentActions.APPLY_CREDITS,
        accountId: String(accountId)
      }
      if (statementId !== undefined) {
        body.statementId = statementId
      }
      await $payApi(
        `/eft-shortnames/${shortNameId.value}/payment`,
        {
          method: 'POST',
          body
        }
      )
      return true
    } catch (error) {
      console.error('An error occurred applying payments.', error)
      return false
    } finally {
      loading.value = false
    }
  }

  async function cancelPayment(accountId: number, statementId?: number): Promise<boolean> {
    try {
      loading.value = true
      await $payApi(
        `/eft-shortnames/${shortNameId.value}/payment`,
        {
          method: 'POST',
          body: {
            action: ShortNamePaymentActions.CANCEL,
            accountId,
            statementId
          }
        }
      )
      return true
    } catch (error) {
      console.error('An error occurred cancelling payments.', error)
      return false
    } finally {
      loading.value = false
    }
  }

  function getUnpaidStatementsString(statementsOwing: StatementOwing[]): string {
    const statementIds = statementsOwing.map(statement => statement.statementId)
    if (statementIds.length <= 2) {
      return statementIds.join(', ')
    }
    return statementIds.slice(0, 2).join(', ') + ',...'
  }

  function isStatementsExpanded(accountId: number): boolean {
    return expandedStatements.value.has(accountId)
  }

  function toggleStatementsView(accountId: number): void {
    if (expandedStatements.value.has(accountId)) {
      expandedStatements.value.delete(accountId)
    } else {
      expandedStatements.value.add(accountId)
    }
  }

  const processedRows = computed<AccountLinkRow[]>(() => {
    const rows: AccountLinkRow[] = []
    const credits = creditsRemaining.value
    const expanded = expandedStatements.value

    for (const link of links.value) {
      const { statementsOwing, accountId } = link
      const hasMultipleStatements = statementsOwing.length > 1

      let pendingPaymentTotal = 0
      let totalOwing = 0
      let hasPendingPayment = false
      let hasPayableStatement = false
      let hasOutstandingStatements = false

      for (const statement of statementsOwing) {
        pendingPaymentTotal += statement.pendingPaymentsAmount
        totalOwing += statement.amountOwing
        if (statement.amountOwing <= credits) {
          hasPayableStatement = true
        }
        if (statement.pendingPaymentsCount > 0) {
          hasPendingPayment = true
        } else {
          hasOutstandingStatements = true
        }
      }

      const hasInsufficientFunds = totalOwing > credits && hasOutstandingStatements
      let insufficientFundMessage: string | undefined
      if (hasInsufficientFunds) {
        insufficientFundMessage = hasMultipleStatements && hasPayableStatement
          ? 'Insufficient funds to settle all statements.<br/>Review each statement to settle.'
          : 'Insufficient funds to settle all statements.'
      }

      rows.push({
        ...link,
        isParentRow: true,
        hasMultipleStatements,
        hasPendingPayment,
        hasPayableStatement,
        hasInsufficientFunds,
        insufficientFundMessage,
        amountOwing: totalOwing,
        pendingPaymentAmountTotal: pendingPaymentTotal,
        unpaidStatementIds: getUnpaidStatementsString(statementsOwing)
      })

      if (expanded.has(accountId)) {
        for (const statement of statementsOwing) {
          rows.push({
            ...link,
            isParentRow: false,
            hasMultipleStatements: false,
            hasPendingPayment: statement.pendingPaymentsCount > 0,
            hasPayableStatement: false,
            hasInsufficientFunds: statement.amountOwing > credits,
            amountOwing: statement.amountOwing,
            pendingPaymentAmountTotal: statement.pendingPaymentsAmount,
            unpaidStatementIds: String(statement.statementId),
            statementId: statement.statementId
          })
        }
      }
    }

    return rows
  })

  const isLinked = computed(() => links.value.length > 0)

  const pendingRows = computed(() =>
    processedRows.value.filter(
      row => row.statusCode === ShortNameLinkStatus.PENDING && row.amountOwing > 0
    )
  )

  function showUnlinkAccountButton(item: AccountLinkRow): boolean {
    if (!item.isParentRow || item.statementsOwing.length > 1 || item.hasPendingPayment) {
      return false
    }
    return !item.hasPayableStatement || item.amountOwing === 0
  }

  function showApplyPaymentButton(item: AccountLinkRow): boolean {
    return !item.hasPendingPayment && item.amountOwing > 0
  }

  function showCancelPaymentButton(item: AccountLinkRow): boolean {
    return item.hasPendingPayment && !item.hasMultipleStatements
  }

  return {
    links,
    loading,
    expandedStatements,
    processedRows,
    isLinked,
    pendingRows,
    loadShortNameLinks,
    unlinkAccount,
    applyPayment,
    cancelPayment,
    isStatementsExpanded,
    toggleStatementsView,
    showUnlinkAccountButton,
    showApplyPaymentButton,
    showCancelPaymentButton
  }
}
