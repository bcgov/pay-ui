import { createLocalVue, mount } from '@vue/test-utils'
import ShortNameRefundSelection from '@/components/eft/ShortNameRefundSelection.vue'
import Vue from 'vue'
import VueRouter from 'vue-router'
import Vuetify from 'vuetify'
import sinon from 'sinon'

Vue.use(Vuetify)
Vue.use(VueRouter)

describe('ShortNameRefundSelection.vue', () => {
  let wrapper: any
  const localVue = createLocalVue()
  const vuetify = new Vuetify({})
  let sandbox: any

  beforeEach(() => {
    const router = new VueRouter()
    sandbox = sinon.createSandbox()
    wrapper = mount(ShortNameRefundSelection, {
      propsData: {
        shortNameId: 1
      },
      localVue,
      vuetify,
      router
    })
  })

  afterEach(() => {
    wrapper.destroy()
    sandbox.restore()
  })

  it('is a Vue instance', () => {
    expect(wrapper.vm).toBeTruthy()
  })

  it('renders the component correctly', () => {
    expect(wrapper.find('.view-header__title').text()).toBe('Refund Information')
    expect(wrapper.find('[data-test="radio-eft-refund-direct-deposit"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="radio-eft-refund-cheque"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="btn-refund-selection-cancel"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="btn-refund-selection-next"]').exists()).toBe(true)

    const refundText = wrapper.find('[data-test="select-refund-type-text"]')
    expect(refundText.element.classList.contains('error-text')).toBe(false)
  })

  it('return to previous page when cancel button is clicked', async () => {
    const push = sinon.stub(wrapper.vm.$router, 'push')
    await wrapper.find('[data-test="btn-refund-selection-cancel"]').trigger('click')

    expect(push.calledWith({ name: 'shortnamedetails', params: { shortNameId: 1 } })).toBe(true)
    push.restore()
  })

  it('goes to eft refund cas information form', async () => {
    const push = sinon.stub(wrapper.vm.$router, 'push')
    await wrapper.find('[data-test="radio-eft-refund-direct-deposit"]').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-test="btn-refund-selection-next"]').trigger('click')

    expect(push.calledWith({ name: 'shortnamerefund', params: { shortNameId: 1 } })).toBe(true)
    push.restore()
  })

  it('goes to eft refund cheque information form', async () => {
    const push = sinon.stub(wrapper.vm.$router, 'push')
    await wrapper.find('[data-test="radio-eft-refund-cheque"]').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-test="btn-refund-selection-next"]').trigger('click')

    expect(push.calledWith({ name: 'shortnamerefundcheque', params: { shortNameId: 1 } })).toBe(true)
    push.restore()
  })

  it('error text highlight when refund type is not selected', async () => {
    const refundText = wrapper.find('[data-test="select-refund-type-text"]')
    await wrapper.find('[data-test="btn-refund-selection-next"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(refundText.element.classList.contains('error-text')).toBe(true)
  })
})
