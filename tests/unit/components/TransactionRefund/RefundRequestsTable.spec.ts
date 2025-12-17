import { Wrapper, createLocalVue, mount } from '@vue/test-utils'

import CommonUtils from '@/util/common-util'
import { VueConstructor } from 'vue'
import Vuetify from 'vuetify'
import { axios } from '@/util/http-util'
import { baseVdataTable } from '../../test-data/baseVdata'
import { setupIntersectionObserverMock } from '../../util/helper-functions'
import sinon from 'sinon'
import { BaseVDataTable } from '@/components/datatable'
import RefundRequestsTable from '@/components/refund/RefundRequestsTable.vue'
import { getPaymentTypeDisplayName } from '@/util/payment-type-display'

const vuetify = new Vuetify({})
// Selectors
const { header, headerTitles, itemRow, itemCell } = baseVdataTable
const headers = [
  'Requested By',
  'Request Date',
  'Reason for Refund',
  'Transaction Amount',
  'Refund Amount',
  'Payment Method',
  'Actions']

describe('RefundRequestsTable.vue', () => {
  setupIntersectionObserverMock()
  let wrapper: Wrapper<any>
  let sandbox: any
  let localVue: VueConstructor<any>
  let searchResponse: any

  beforeEach(async () => {
    localVue = createLocalVue()
    searchResponse = {
      items: [
        {
          decisionBy: null,
          decisionDate: null,
          declineReason: null,
          invoiceId: 52305,
          notificationEmail: 'test@example.com',
          partialRefundLines: [],
          paymentMethod: 'DIRECT_PAY',
          refundAmount: 31.5,
          refundId: 1009,
          refundMethod: 'Refund back to Credit Card',
          refundReason: 'test reason',
          refundStatus: 'PENDING_APPROVAL',
          refundType: 'INVOICE',
          requestedBy: 'requester',
          requestedDate: '2025-12-16T23:58:23.872481',
          staffComment: null,
          transactionAmount: 31.5
        }
      ]
    }

    sandbox = sinon.createSandbox()
    const get = sandbox.stub(axios, 'get')
    get.returns(new Promise(resolve => resolve({ data: searchResponse })))

    wrapper = mount(RefundRequestsTable, {
      localVue,
      vuetify
    })
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper.destroy()
    sessionStorage.clear()
    sandbox.restore()

    vi.resetModules()
    vi.clearAllMocks()
  })

  it('Renders refunds requests table with correct contents', async () => {
    expect(wrapper.findComponent(BaseVDataTable).exists()).toBe(true)
    expect(wrapper.findComponent(BaseVDataTable).find(header).exists()).toBe(true)
    expect(wrapper.find('.v-data-table__wrapper').exists()).toBe(true)
    const titles = wrapper.findComponent(BaseVDataTable).findAll(headerTitles)
    expect(titles.length).toBe(headers.length)
    for (let i = 0; i < headers.length; i++) {
      expect(titles.at(i).text()).toBe(headers[i])
    }

    const itemRows = wrapper.findComponent(BaseVDataTable).findAll(itemRow)
    expect(itemRows.length).toBe(searchResponse.items.length)
    for (let i = 0; i < searchResponse.items.length; i++) {
      const columns = itemRows.at(i).findAll(itemCell)
      expect(columns.at(0).text()).toBe(searchResponse.items[i].requestedBy)
      expect(columns.at(1).text()).toBe(
        CommonUtils.formatUtcToPacificDate(searchResponse.items[i].requestedDate, 'MMMM DD, YYYY'))
      expect(columns.at(2).text()).toBe(searchResponse.items[i].refundReason)
      expect(columns.at(3).text()).toBe(CommonUtils.formatAmount(searchResponse.items[i].transactionAmount))
      expect(columns.at(4).text()).toBe(CommonUtils.formatAmount(searchResponse.items[i].refundAmount))
      expect(columns.at(5).text()).toBe(getPaymentTypeDisplayName(searchResponse.items[i].paymentMethod))
    }
  })
})
