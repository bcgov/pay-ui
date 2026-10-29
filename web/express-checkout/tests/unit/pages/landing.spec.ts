import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import LandingPage from '~/pages/pay/[token]/index.vue'

const { getInvoiceByToken } = vi.hoisted(() => ({ getInvoiceByToken: vi.fn() }))
mockNuxtImport('usePayLink', () => () => ({ getInvoiceByToken }) as unknown as ReturnType<typeof usePayLink>)

// Guest: not signed in.
mockNuxtImport('useConnectAuth', () => () => ({
  isAuthenticated: ref(false),
  authUser: ref({}),
  login: vi.fn()
}) as unknown as ReturnType<typeof useConnectAuth>)

mockNuxtImport('useRoute', () => () => ({ params: { token: 'tok-1' } }) as unknown as ReturnType<typeof useRoute>)

const INACTIVE = 'This payment link is no longer active'

async function mountLanding() {
  const wrapper = await mountSuspended(LandingPage)
  await flushPromises()
  return wrapper
}

describe('landing page — guest link check', () => {
  beforeEach(() => {
    getInvoiceByToken.mockReset()
  })

  it('shows the picker when the link is active', async () => {
    getInvoiceByToken.mockResolvedValueOnce({ id: 1 })

    const wrapper = await mountLanding()

    expect(getInvoiceByToken).toHaveBeenCalledWith('tok-1')
    expect(wrapper.text()).not.toContain(INACTIVE)
  })

  it('shows the inactive alert when the invoice is already COMPLETED (paid)', async () => {
    getInvoiceByToken.mockResolvedValueOnce({ id: 1, statusCode: 'COMPLETED' })

    const wrapper = await mountLanding()

    expect(wrapper.text()).toContain(INACTIVE)
  })

  it.each([400, 404, 410])('shows the inactive alert on a %i', async (statusCode) => {
    getInvoiceByToken.mockRejectedValueOnce({ statusCode })

    const wrapper = await mountLanding()

    expect(wrapper.text()).toContain(INACTIVE)
  })

  it.each([401, 403])('keeps the picker on a %i (gateway wants a session)', async (statusCode) => {
    getInvoiceByToken.mockRejectedValueOnce({ statusCode })

    const wrapper = await mountLanding()

    expect(wrapper.text()).not.toContain(INACTIVE)
  })

  it('keeps the picker on a network error', async () => {
    getInvoiceByToken.mockRejectedValueOnce(new Error('network down'))

    const wrapper = await mountLanding()

    expect(wrapper.text()).not.toContain(INACTIVE)
  })
})
