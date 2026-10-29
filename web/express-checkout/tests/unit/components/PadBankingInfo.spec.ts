import { mountSuspended } from '@nuxt/test-utils/runtime'
import PadBankingInfo from '~/components/checkout/PadBankingInfo.vue'

const cfsAccount = { bankTransitNumber: '00720', bankInstitutionNumber: '001', bankAccountNumber: 'XXXXXXX' }

describe('PadBankingInfo', () => {
  it('opens the banking help from a clickable button, not a hover-only title', async () => {
    const wrapper = await mountSuspended(PadBankingInfo, { props: { cfsAccount } })
    const help = wrapper.find('button[aria-label*="bank account details on file"]')
    expect(help.exists()).toBe(true)
  })

  it('shows Edit only when the caller can change PAD info', async () => {
    const readOnly = await mountSuspended(PadBankingInfo, { props: { cfsAccount, canEdit: false } })
    expect(readOnly.text()).not.toContain('Edit')

    const editable = await mountSuspended(PadBankingInfo, { props: { cfsAccount, canEdit: true } })
    const edit = editable.findAll('button').find(b => b.text().includes('Edit'))
    expect(edit).toBeDefined()
    await edit!.trigger('click')
    expect(editable.emitted('edit')).toHaveLength(1)
  })
})
