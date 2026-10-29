import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import ShortNameAccountLink from '~/components/eft/ShortNameAccountLink.vue'

const h = vi.hoisted(() => ({
  loadShortNameLinks: vi.fn(),
  unlinkAccount: vi.fn(),
  applyPayment: vi.fn(),
  cancelPayment: vi.fn(),
  toggleStatementsView: vi.fn(),
  rows: [] as Record<string, unknown>[],
  linked: true,
  loading: false,
  expanded: new Set<number>(),
  capturedColumns: [] as { meta: { class: { td: unknown } } }[]
}))

vi.mock('~/composables/eft/useShortNameAccountLink', async () => {
  const { ref } = await import('vue')
  return {
    useShortNameAccountLink: () => ({
      loading: ref(h.loading),
      processedRows: ref(h.rows),
      isLinked: ref(h.linked),
      loadShortNameLinks: h.loadShortNameLinks,
      unlinkAccount: h.unlinkAccount,
      applyPayment: h.applyPayment,
      cancelPayment: h.cancelPayment,
      isStatementsExpanded: (id: number) => h.expanded.has(id),
      toggleStatementsView: h.toggleStatementsView,
      showUnlinkAccountButton: (i: { amountOwing: number, isParentRow: boolean }) => i.amountOwing === 0,
      showApplyPaymentButton: (i: { hasPendingPayment: boolean, amountOwing: number }) =>
        !i.hasPendingPayment && i.amountOwing > 0,
      showCancelPaymentButton: (i: { hasPendingPayment: boolean }) => i.hasPendingPayment
    })
  }
})

mockNuxtImport('useI18n', () => () => ({ t: (k: string) => k }))

const slots = ['linkedAccount-cell', 'accountBranch-cell', 'unpaidStatementIds-cell', 'amountOwing-cell',
  'actions-cell']

const stubs = {
  UTable: {
    props: ['data', 'columns', 'loading', 'expanded'],
    setup(props: { columns: typeof h.capturedColumns }) {
      h.capturedColumns = props.columns
    },
    template: `<div class="table">
      <div v-for="(row, index) in data" :key="index" class="row">
        ${slots.map(s => `<div class="${s}"><slot name="${s}" :row="{ original: row }" :index="index" /></div>`)
          .join('')}
        <div class="expanded"><slot name="expanded" :row="{ original: row }" /></div>
      </div>
      <slot name="loading" /><slot name="empty" />
      <span class="expanded-keys">{{ Object.keys(expanded).join(',') }}</span>
    </div>`
  },
  UModal: {
    props: ['open'],
    template: '<div v-if="open" class="modal"><slot name="header" /><slot name="body" /><slot name="footer" /></div>'
  },
  UButton: {
    props: ['label', 'disabled'],
    emits: ['click'],
    template: '<button :disabled="disabled" @click="$emit(\'click\', $event)">{{ label }}</button>'
  },
  UDropdownMenu: {
    props: ['items'],
    template: '<div class="dropdown"><slot /></div>'
  },
  IconTooltip: { props: ['text'], template: '<i class="tip">{{ text }}</i>' },
  UIcon: { props: ['name'], template: '<i class="icon" :data-name="name" />' },
  ShortNameLinkingDialog: true
}

const row = (over: Record<string, unknown> = {}) => ({
  id: 1,
  accountId: 100,
  accountName: 'Acme',
  accountBranch: 'Vancouver',
  isParentRow: true,
  hasMultipleStatements: false,
  hasPendingPayment: false,
  hasInsufficientFunds: false,
  amountOwing: 50,
  pendingPaymentAmountTotal: 0,
  unpaidStatementIds: '7',
  statementsOwing: [{ statementId: 7 }],
  ...over
})

const details = { id: 5, shortName: 'SN', shortNameType: 'EFT', creditsRemaining: 10, linkedAccountsCount: 1 }

const build = (props: Record<string, unknown> = {}) =>
  mount(ShortNameAccountLink, {
    props: { shortNameDetails: details, shortName: { id: 5, shortName: 'SN' }, ...props },
    global: { stubs }
  })

const btn = (w: ReturnType<typeof build>, label: string) => w.findAll('button').find(b => b.text() === label)

describe('ShortNameAccountLink rows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.rows = []
    h.linked = true
    h.loading = false
    h.expanded = new Set()
    h.unlinkAccount.mockResolvedValue(true)
    h.applyPayment.mockResolvedValue(true)
    h.cancelPayment.mockResolvedValue(true)
  })

  it('renders nothing when there is no short name', () => {
    const w = build({ shortNameDetails: null })
    expect(w.find('.card-title').exists()).toBe(false)
    expect(h.loadShortNameLinks).not.toHaveBeenCalled()
  })

  it('shows the empty table and link button when linked', () => {
    const w = build()
    expect(w.text()).toContain('No linked accounts.')
    expect(btn(w, '+ Link a New Account')).toBeTruthy()
  })

  it('shows loading state while loading even when not linked', () => {
    h.linked = false
    h.loading = true
    const w = build()
    expect(w.text()).toContain('Loading linked accounts...')
  })

  it('opens the linking dialog from both link buttons', async () => {
    const w = build()
    await btn(w, '+ Link a New Account')!.trigger('click')
    expect((w.vm as unknown as { state: { isShortNameLinkingDialogOpen: boolean } })
      .state.isShortNameLinkingDialogOpen).toBe(true)
    h.linked = false
    const w2 = build()
    await btn(w2, 'Link to Account')!.trigger('click')
    expect((w2.vm as unknown as { state: { isShortNameLinkingDialogOpen: boolean } })
      .state.isShortNameLinkingDialogOpen).toBe(true)
  })

  it('renders parent row cells with multiple statements and toggles', async () => {
    h.rows = [row({
      hasMultipleStatements: true,
      statementsOwing: [{ statementId: 1 }, { statementId: 2 }],
      insufficientFundMessage: 'Not enough'
    })]
    const w = build()
    expect(w.find('.linkedAccount-cell').text()).toContain('Acme')
    expect(w.find('.linkedAccount-cell .icon').attributes('data-name')).toBe('i-mdi-chevron-down')
    expect(w.find('.accountBranch-cell').text()).toContain('Vancouver')
    expect(w.find('.unpaidStatementIds-cell').text()).toContain('View All statements')
    expect(w.find('.amountOwing-cell .tip').text()).toBe('Not enough')
    await w.find('.linkedAccount-cell .cursor-pointer').trigger('click')
    await w.find('.statement-view-link').trigger('click')
    expect(h.toggleStatementsView).toHaveBeenCalledTimes(2)
    expect(h.toggleStatementsView).toHaveBeenCalledWith(100)
  })

  it('shows expanded state labels', () => {
    h.expanded = new Set([100])
    h.rows = [row({ hasMultipleStatements: true, statementsOwing: [{}, {}] })]
    const w = build()
    expect(w.find('.linkedAccount-cell .icon').attributes('data-name')).toBe('i-mdi-chevron-up')
    expect(w.find('.statement-view-link').text()).toBe('View less')
  })

  it('renders child rows without parent-only content', () => {
    h.rows = [row({ isParentRow: false, statementId: 9, unpaidStatementIds: '9' })]
    const w = build()
    expect(w.find('.linkedAccount-cell').text()).toBe('')
    expect(w.find('.accountBranch-cell').text()).toBe('')
    expect(w.find('.unpaidStatementIds-cell .child-statement-row').exists()).toBe(true)
    expect(w.find('.amountOwing-cell .child-statement-row').exists()).toBe(true)
    expect(w.find('.statement-view-link').exists()).toBe(false)
  })

  it('applies payment for parent (Apply All) and child rows and emits', async () => {
    h.rows = [
      row({ hasMultipleStatements: true, statementsOwing: [{}, {}] }),
      row({ id: 2, isParentRow: false, statementId: 9 })
    ]
    const w = build()
    const parent = w.findAll('.row')[0]!
    const child = w.findAll('.row')[1]!
    expect(parent.find('.dropdown').exists()).toBe(true)
    expect(child.find('.dropdown').exists()).toBe(false)
    await parent.findAll('button').find(b => b.text() === 'Apply All')!.trigger('click')
    await vi.waitFor(() => expect(h.applyPayment).toHaveBeenCalledWith(100, undefined))
    await child.findAll('button').find(b => b.text() === 'Apply Payment')!.trigger('click')
    await vi.waitFor(() => expect(h.applyPayment).toHaveBeenCalledWith(100, 9))
    expect(w.emitted('on-payment-action')?.length).toBe(2)
  })

  it('disables apply when funds are insufficient and labels single statement', () => {
    h.rows = [row({ hasInsufficientFunds: true })]
    const w = build()
    const apply = btn(w, 'Apply Payment')!
    expect(apply.attributes('disabled')).toBeDefined()
  })

  it('does not emit when apply payment fails', async () => {
    h.applyPayment.mockResolvedValue(false)
    h.rows = [row()]
    const w = build()
    await btn(w, 'Apply Payment')!.trigger('click')
    await vi.waitFor(() => expect(h.applyPayment).toHaveBeenCalled())
    expect(w.emitted('on-payment-action')).toBeUndefined()
  })

  it('unlinks an account through the confirmation modal', async () => {
    h.rows = [row({ amountOwing: 0, id: 3 })]
    const w = build()
    await btn(w, 'Unlink Account')!.trigger('click')
    expect(w.find('.modal').text()).toContain('The link with this account will be removed.')
    await btn(w, 'Confirm')!.trigger('click')
    await vi.waitFor(() => expect(h.unlinkAccount).toHaveBeenCalledWith(3))
    expect(w.find('.modal').exists()).toBe(false)
  })

  it('does not render unlink for child rows with zero owing', () => {
    h.rows = [row({ amountOwing: 0, isParentRow: false })]
    const w = build()
    expect(w.find('.actions-cell button').exists()).toBe(false)
  })

  it('cancels a pending payment (child passes statement id) and the modal can be dismissed', async () => {
    h.rows = [row({ hasPendingPayment: true, isParentRow: false, statementId: 4 })]
    const w = build()
    await btn(w, 'Cancel Payment')!.trigger('click')
    expect(w.find('.modal').text()).toContain('The applied amount will be returned to the short name.')
    await btn(w, 'Cancel')!.trigger('click')
    expect(w.find('.modal').exists()).toBe(false)
    await btn(w, 'Cancel Payment')!.trigger('click')
    await btn(w, 'Confirm')!.trigger('click')
    await vi.waitFor(() => expect(h.cancelPayment).toHaveBeenCalledWith(100, 4))
    expect(w.emitted('on-payment-action')?.length).toBe(1)
  })

  it('renders the pending payment expansion and keys it by parent index', () => {
    h.rows = [row({ id: 8, hasPendingPayment: true, pendingPaymentAmountTotal: 25 })]
    const w = build({ highlightedLinkId: 8 })
    expect(w.find('.expanded').text()).toContain('will be applied to this account today')
    expect(w.find('.expanded .bg-green-100').exists()).toBe(true)
    expect(w.find('.expanded-keys').text()).toBe('0')
    const w2 = build()
    expect(w2.find('.expanded .bg-green-100').exists()).toBe(false)
  })

  it('highlights the linked row via column td classes', () => {
    h.rows = [row()]
    build({ highlightedLinkId: 1 })
    const td = h.capturedColumns[0]!.meta.class.td as (c: { row: { original: { id: number } } }) => string
    expect(td({ row: { original: { id: 1 } } })).toContain('bg-green-100')
    expect(td({ row: { original: { id: 2 } } })).not.toContain('bg-green-100')
  })

  it('reloads links and emits after linking; loads only when an id is present', async () => {
    const w = build()
    await (w.vm as unknown as { onLinkAccount: (a: unknown) => Promise<void> }).onLinkAccount({ a: 1 })
    expect(h.loadShortNameLinks).toHaveBeenCalledTimes(2)
    expect(w.emitted('on-link-account')?.[0]?.[0]).toEqual({ a: 1 })
    await w.setProps({ shortNameDetails: { ...details, id: 0 } })
    expect(h.loadShortNameLinks).toHaveBeenCalledTimes(2)
    await w.setProps({ shortNameDetails: { ...details, id: 6 } })
    expect(h.loadShortNameLinks).toHaveBeenCalledTimes(3)
  })

  it('dialogConfirm is a no-op without a confirm object', async () => {
    const w = build()
    await (w.vm as unknown as { dialogConfirm: () => Promise<void> }).dialogConfirm()
    expect(h.unlinkAccount).not.toHaveBeenCalled()
    expect(h.cancelPayment).not.toHaveBeenCalled()
  })
})
