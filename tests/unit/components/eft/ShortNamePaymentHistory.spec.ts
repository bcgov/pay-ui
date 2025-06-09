import { Wrapper, createLocalVue, mount } from '@vue/test-utils'
import { BaseVDataTable } from '@/components/datatable'
import CommonUtils from '@/util/common-util'
import ShortNameTransactions from '@/components/eft/ShortNamePaymentHistory.vue'
import { VueConstructor } from 'vue'
import Vuetify from 'vuetify'
import { axios } from '@/util/http-util'
import { baseVdataTable } from '../../test-data/baseVdata'
import { setupIntersectionObserverMock } from '../../util/helper-functions'
import sinon from 'sinon'
import { ShortNameHistoryType } from '@/util/constants'

sessionStorage.setItem('AUTH_API_CONFIG', JSON.stringify({
  AUTH_API_URL: 'https://localhost:8080/api/v1',
  PAY_API_URL: 'https://pay-api-dev.apps.silver.devops.gov.bc.ca/api/v1'
}))

const vuetify = new Vuetify({})
// Selectors
const { header, headerTitles, itemRow, itemCell } = baseVdataTable
const headers = ['Date', 'Description', 'Related Statement Number', 'Amount', 'Actions']

describe('ShortNamePaymentHistory.vue', () => {
  setupIntersectionObserverMock()
  let wrapper: Wrapper<any>
  let sandbox: any
  let localVue: VueConstructor<any>
  let historyResponse: any

  beforeEach(async () => {
    vi.spyOn(CommonUtils, 'isEftRefundApprover').mockReturnValue(true)
    localVue = createLocalVue()
    historyResponse = {
      items: [
        {
          accountBranch: 'Sushi Division',
          accountId: '3202',
          accountName: 'Odysseus Chiu',
          amount: 50,
          historicalId: 5,
          isProcessing: true,
          isReversible: false,
          shortNameBalance: 418.5,
          shortNameId: 2,
          statementNumber: 5374449,
          invoiceId: 12345,
          createdOn: '2024-08-01T00:01:30.885474',
          transactionDate: '2024-08-01T00:01:30.885474',
          transactionType: 'INVOICE_REFUND'
        },
        {
          accountBranch: 'Sushi Division',
          accountId: '3202',
          accountName: 'Odysseus Chiu',
          amount: 351.5,
          historicalId: 5,
          isProcessing: true,
          isReversible: false,
          shortNameBalance: 368.5,
          shortNameId: 2,
          statementNumber: 5374449,
          createdOn: '2024-08-01T00:01:30.885474',
          transactionDate: '2024-08-01T00:01:30.885474',
          transactionType: 'STATEMENT_REVERSE'
        },
        {
          accountBranch: 'Sushi Division',
          accountId: '3202',
          accountName: 'Odysseus Chiu',
          amount: 131.5,
          historicalId: 3,
          isProcessing: false,
          isReversible: false,
          shortNameBalance: 368.5,
          shortNameId: 2,
          statementNumber: 5455966,
          createdOn: '2024-07-31T22:22:31.058547',
          transactionDate: '2024-07-31T22:22:31.058547',
          transactionType: 'STATEMENT_PAID'
        },
        {
          accountBranch: 'Sushi Division',
          accountId: '3202',
          accountName: 'Jia Xu',
          amount: 100,
          historicalId: 6,
          isProcessing: false,
          isReversible: false,
          shortNameBalance: 318.5,
          shortNameId: 2,
          statementNumber: 5374450,
          createdOn: '2025-03-17T10:00:00',
          transactionDate: '2025-03-17T10:00:00',
          transactionType: 'SN_REFUND_APPROVED',
          eftRefundChequeStatus: 'CHEQUE_UNDELIVERABLE'
        },
        {
          accountBranch: 'Sushi Division',
          accountId: '3202',
          accountName: 'Jia Xu',
          amount: 100,
          historicalId: 7,
          isProcessing: false,
          isReversible: false,
          shortNameBalance: 100,
          shortNameId: 2,
          statementNumber: 5374450,
          createdOn: '2025-03-17T10:00:00',
          transactionDate: '2025-03-15T10:00:00',
          transactionType: 'FUNDS_RECEIVED'
        }
      ]
    }

    sandbox = sinon.createSandbox()
    const get = sandbox.stub(axios, 'get')
    get.returns(Promise.resolve({ data: historyResponse }))

    wrapper = mount(ShortNameTransactions, {
      propsData: {
        shortNameDetails: { shortName: null, id: null }
      },
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

  it('Renders short name transaction table with correct contents', async () => {
    // Change the prop value
    await wrapper.setProps({ shortNameDetails: { id: 1, shortName: 'SHORTNAME' } })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('#table-title-cell').text()).toContain('Short Name Payment History')

    // verify table
    expect(wrapper.findComponent(BaseVDataTable).exists()).toBe(true)
    expect(wrapper.findComponent(BaseVDataTable).find(header).exists()).toBe(true)
    expect(wrapper.find('#eft-transactions-table').exists()).toBe(true)
    expect(wrapper.find('.v-data-table__wrapper').exists()).toBe(true)
    const titles = wrapper.findComponent(BaseVDataTable).findAll(headerTitles)
    expect(titles.length).toBe(headers.length)
    for (let i = 0; i < headers.length; i++) {
      expect(titles.at(i).text()).toBe(headers[i])
    }

    await wrapper.vm.$nextTick()
    // verify data
    const itemRows = wrapper.findComponent(BaseVDataTable).findAll(itemRow)
    expect(itemRows.length).toBe(historyResponse.items.length)
    for (let i = 0; i < historyResponse.items.length; i++) {
      const columns = itemRows.at(i).findAll(itemCell)
      expect(columns.at(0).text()).toBe(
        CommonUtils.formatUtcToPacificDate(historyResponse.items[i].createdOn, wrapper.vm.dateDisplayFormat))
      expect(columns.at(1).text()).toContain(wrapper.vm.formatDescription(historyResponse.items[i]))
      expect(columns.at(1).text()).toContain(wrapper.vm.formatAdditionalDescription(historyResponse.items[i]))
      expect(columns.at(2).text()).toBe(historyResponse.items[i].statementNumber
        ? historyResponse.items[i].statementNumber.toString() : '')
      expect(columns.at(3).text()).toContain(
        wrapper.vm.formatTransactionAmount(historyResponse.items[i].amount))
      if (historyResponse.items[i].isReversible) {
        expect(columns.at(4).find("[data-test='reverse-payment-btn']").exists()).toBeTruthy()
      } else {
        expect(columns.at(4).find("[data-test='reverse-payment-btn']").exists()).toBeFalsy()
      }

      if (historyResponse.items[i].transactionType === ShortNameHistoryType.FUNDS_RECEIVED) {
        expect(wrapper.find('[data-test="info-icon"]').exists()).toBeTruthy()
      }
    }
  })
})
