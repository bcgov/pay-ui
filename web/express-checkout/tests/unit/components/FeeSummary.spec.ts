import { mountSuspended } from '@nuxt/test-utils/runtime'
import FeeSummary from '~/components/checkout/FeeSummary.vue'
import type { PayInvoice } from '~/stores/paymentLink'

describe('FeeSummary', () => {
  it('renders one row per invoice line item with its description and base fee', async () => {
    const invoice: PayInvoice = {
      id: 1,
      total: 51.5,
      serviceFees: 1.5,
      lineItems: [
        { description: 'Annual Report', filingFees: 30 },
        { description: 'Certificate Copy', filingFees: 20 }
      ]
    }
    const wrapper = await mountSuspended(FeeSummary, { props: { invoice } })
    const html = wrapper.html()
    expect(html).toContain('Annual Report')
    expect(html).toContain('$30.00')
    expect(html).toContain('Certificate Copy')
    expect(html).toContain('$20.00')
  })

  it('shows the quantity subtitle when a line has multi-unit quantity metadata', async () => {
    const invoice: PayInvoice = {
      id: 1,
      lineItems: [
        { description: 'Search', filingFees: 15, quantity: 3, quantityDesc: 'companies' }
      ]
    }
    const wrapper = await mountSuspended(FeeSummary, { props: { invoice } })
    expect(wrapper.html()).toContain('× 3 companies')
  })

  it('omits the subtitle when quantity is 1 or missing', async () => {
    const invoice: PayInvoice = {
      id: 1,
      lineItems: [
        { description: 'Filing', filingFees: 20 },
        { description: 'Filing', filingFees: 20, quantity: 1 }
      ]
    }
    const wrapper = await mountSuspended(FeeSummary, { props: { invoice } })
    expect(wrapper.html()).not.toContain('×')
  })

  it('sums per-line service fees into a single Service Fee row when top-level is absent', async () => {
    const invoice: PayInvoice = {
      id: 1,
      lineItems: [
        { description: 'A', filingFees: 10, serviceFees: 1 },
        { description: 'B', filingFees: 10, serviceFees: 0.5 }
      ]
    }
    const wrapper = await mountSuspended(FeeSummary, { props: { invoice } })
    // Both line rows show their base fee (service excluded)…
    expect(wrapper.html()).toContain('$10.00')
    // …and the aggregate lands in a single Service Fee row.
    expect(wrapper.html()).toContain('$1.50')
  })

  it('renders Total Fees from invoice.total with the CAD caption', async () => {
    const invoice: PayInvoice = {
      id: 1,
      total: 351.5,
      lineItems: [{ description: 'X', filingFees: 350 }]
    }
    const wrapper = await mountSuspended(FeeSummary, { props: { invoice } })
    const html = wrapper.html()
    expect(html).toContain('CAD')
    expect(html).toContain('$351.50')
  })
})
