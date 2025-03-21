import { createLocalVue, mount } from '@vue/test-utils'
import ShortNameRefundView from '@/components/eft/ShortNameRefundView.vue'
import Vue from 'vue'
import VueRouter from 'vue-router'
import Vuetify from 'vuetify'
import { axios } from '@/util/http-util'
import sinon from 'sinon'
import { chequeRefundCodes, ChequeRefundStatus, EFTRefundMethod, EFTRefundStatus } from '@/util/constants'
import { nextTick } from '@vue/composition-api'

Vue.use(Vuetify)
Vue.use(VueRouter)

describe('ShortNameRefundView.vue', () => {
  let wrapper: any
  const localVue = createLocalVue()
  const vuetify = new Vuetify({})
  let sandbox: any
  let summaryResponse: any

  beforeEach(() => {
    summaryResponse = {
      items: [
        {
          creditsRemaining: 300.0,
          id: 2,
          lastPaymentReceivedDate: '2023-11-24T13:47:47',
          linkedAccountsCount: 0,
          refundStatus: 'PENDING_APPROVAL',
          shortName: 'SNAME100',
          shortNameType: 'EFT'
        }
      ]
    }

    sandbox = sinon.createSandbox()
    const get = sandbox.stub(axios, 'get')
    get.returns(Promise.resolve({ data: summaryResponse }))
    wrapper = mount(ShortNameRefundView, {
      propsData: {
        shortNameDetails: { shortName: 'TEST', creditsRemaining: '500.0' }
      },
      stubs: {
        AddressForm: { template: '<div></div>' }
      },
      localVue,
      vuetify
    })
  })

  afterEach(() => {
    wrapper.destroy()
    sandbox.restore()
  })

  it('is a Vue instance', () => {
    expect(wrapper.vm).toBeTruthy()
  })

  it('renders direct deposit refund form correctly', async () => {
    wrapper.vm.refundMethod = EFTRefundMethod.EFT
    wrapper.vm.readOnly = false
    await nextTick()
    expect(wrapper.find('.view-header__title').text()).toBe('Refund Information')
    expect(wrapper.find('[data-test="refundAmount"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="casSupplierNumber"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="casSupplierSite"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="email"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="staffComment"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="entityName"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="entityAddress"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="btn-edit-cancel"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="btn-edit-done"]').exists()).toBe(true)
  })

  it('renders direct deposit refund readonly correctly', async () => {
    wrapper.vm.refundMethod = EFTRefundMethod.EFT
    wrapper.vm.readOnly = true
    await nextTick()
    expect(wrapper.find('.view-header__title').text()).toBe('Refund Information')
    expect(wrapper.find('[data-test="refundAmountReadOnly"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="casSupplierNumberReadOnly"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="casSupplierSiteReadOnly"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="emailReadOnly"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="staffCommentReadOnly"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="entityNameReadOnly"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="entityAddress"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="btn-edit-cancel"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="btn-edit-done"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="qualifiedReceiverReadOnly"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="expenseAuthorityApprovalReadOnly"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="expenseAuthorityDeclinedReadOnly"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="expenseAuthorityDeclineReasonReadOnly"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="chequeStatusChipReadOnly"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="updateChequeStatusMenu"]').exists()).toBe(false)

    wrapper.vm.refundDetails = { status: EFTRefundStatus.APPROVED }
    await nextTick()
    expect(wrapper.find('[data-test="expenseAuthorityApprovalReadOnly"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="updateChequeStatusMenu"]').exists()).toBe(false)

    wrapper.vm.refundDetails = { status: EFTRefundStatus.DECLINED }
    await nextTick()
    expect(wrapper.find('[data-test="expenseAuthorityDeclinedReadOnly"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="expenseAuthorityDeclineReasonReadOnly"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="updateChequeStatusMenu"]').exists()).toBe(false)
  })

  it('renders cheque refund form correctly', async () => {
    wrapper.vm.refundMethod = EFTRefundMethod.CHEQUE
    wrapper.vm.readOnly = false
    await nextTick()

    expect(wrapper.find('.view-header__title').text()).toBe('Refund Information')
    expect(wrapper.find('[data-test="refundAmount"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="casSupplierNumber"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="casSupplierSite"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="email"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="staffComment"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="entityName"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="entityAddress"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="btn-edit-cancel"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="btn-edit-done"]').exists()).toBe(true)
  })

  it('renders cheque refund readonly correctly', async () => {
    wrapper.vm.refundMethod = EFTRefundMethod.CHEQUE
    wrapper.vm.readOnly = true
    await nextTick()

    expect(wrapper.find('.view-header__title').text()).toBe('Refund Information')
    expect(wrapper.find('[data-test="refundAmountReadOnly"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="casSupplierNumberReadOnly"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="casSupplierSiteReadOnly"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="emailReadOnly"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="staffCommentReadOnly"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="entityNameReadOnly"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="entityAddress"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="btn-edit-cancel"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="btn-edit-done"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="qualifiedReceiverReadOnly"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="expenseAuthorityApprovalReadOnly"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="expenseAuthorityDeclinedReadOnly"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="expenseAuthorityDeclineReasonReadOnly"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="chequeStatusChipReadOnly"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="updateChequeStatusMenu"]').exists()).toBe(false)

    wrapper.vm.refundDetails = {
      status: EFTRefundStatus.APPROVED,
      chequeStatus: chequeRefundCodes.CHEQUE_UNDELIVERABLE,
      refundMethod: EFTRefundMethod.CHEQUE
    }
    await nextTick()
    expect(wrapper.find('[data-test="expenseAuthorityApprovalReadOnly"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="updateChequeStatusMenu"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="chequeStatusChipReadOnly"]').exists()).toBe(true)

    wrapper.vm.refundDetails = {
      status: EFTRefundStatus.APPROVED,
      chequeStatus: chequeRefundCodes.PROCESSED,
      refundMethod: EFTRefundMethod.CHEQUE
    }

    wrapper.vm.refundDetails = { status: EFTRefundStatus.DECLINED }
    await nextTick()
    expect(wrapper.find('[data-test="expenseAuthorityDeclinedReadOnly"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="expenseAuthorityDeclineReasonReadOnly"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="updateChequeStatusMenu"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="chequeStatusChipReadOnly"]').exists()).toBe(false)
  })

  it('return to previous page when cancel button is clicked', async () => {
    const router = new VueRouter()
    wrapper = mount(ShortNameRefundView, {
      propsData: {
        shortNameDetails: { shortName: 'TEST', creditsRemaining: '500.0' }
      },
      localVue,
      vuetify,
      router
    })
    const push = sinon.stub(wrapper.vm.$router, 'push')

    await wrapper.find('[data-test="btn-edit-cancel"]').trigger('click')

    expect(push.calledWith({ name: 'shortnamedetails' })).toBe(true)
    push.restore()
  })
})
