import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import LandingPage from '~/pages/pay/[token]/index.vue'
import { usePaymentLinkStore } from '~/stores/paymentLink'

const { getInvoiceByToken } = vi.hoisted(() => ({ getInvoiceByToken: vi.fn() }))
mockNuxtImport('usePayLink', () => () => ({ getInvoiceByToken }) as unknown as ReturnType<typeof usePayLink>)

// Signed in.
mockNuxtImport('useConnectAuth', () => () => ({
  isAuthenticated: ref(true),
  authUser: ref({}),
  login: vi.fn()
}) as unknown as ReturnType<typeof useConnectAuth>)

mockNuxtImport('useRoute', () => () => ({ params: { token: 'tok-1' } }) as unknown as ReturnType<typeof useRoute>)

const INACTIVE = 'This payment link is no longer active'

describe('landing page — signed-in payer on a paid link', () => {
  beforeEach(() => {
    getInvoiceByToken.mockReset()
    usePaymentLinkStore().$reset()
  })

  it('shows the inactive alert when the stored invoice for this link is already paid', async () => {
    const store = usePaymentLinkStore()
    store.setToken('tok-1')
    store.setInvoice({ id: 1, total: 25, paid: 25, statusCode: 'COMPLETED' })

    const wrapper = await mountSuspended(LandingPage)
    await flushPromises()

    expect(wrapper.text()).toContain(INACTIVE)
    expect(getInvoiceByToken).not.toHaveBeenCalled()
  })

  it('shows the inactive alert when a fresh session finds the link already COMPLETED', async () => {
    usePaymentLinkStore().setToken('tok-1')
    getInvoiceByToken.mockResolvedValueOnce({ id: 1, total: 25, paid: 25, statusCode: 'COMPLETED' })

    const wrapper = await mountSuspended(LandingPage)
    await flushPromises()

    expect(wrapper.text()).toContain(INACTIVE)
  })
})
