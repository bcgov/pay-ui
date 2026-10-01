import { mountSuspended } from '@nuxt/test-utils/runtime'
import SuccessEft from '~/components/success/SuccessEft.vue'

async function mount() {
  return await mountSuspended(SuccessEft, {
    props: { dateFormatted: 'Sep 9, 2026, 2:14 pm', amountFormatted: '$25.00' }
  })
}

describe('SuccessEft', () => {
  it('renders the date, method, and amount rows', async () => {
    const wrapper = await mount()
    expect(wrapper.text()).toContain('Sep 9, 2026, 2:14 pm')
    expect(wrapper.text()).toContain('Electronic Funds Transfer')
    expect(wrapper.text()).toContain('$25.00')
  })

  it('does not render an invoice reference number row', async () => {
    // pay-api doesn't create the CFS invoice reference until the nightly batch
    // job runs, so this screen never has one to show — see checkout.vue history.
    const wrapper = await mount()
    expect(wrapper.text()).not.toContain('Invoice Reference Number')
  })

  it('shows the next-statement confirmation text', async () => {
    const wrapper = await mount()
    expect(wrapper.text()).toContain('next EFT statement')
  })
})
