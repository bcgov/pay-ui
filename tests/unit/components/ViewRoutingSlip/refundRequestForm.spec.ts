import { createLocalVue, mount } from '@vue/test-utils'

import { RefundRequestForm } from '@/components/ViewRoutingSlip'
import Vue from 'vue'
import Vuetify from 'vuetify'
import initialize from '@/plugins/i18n'

import { refundRequestDetails } from '../../test-data/mock-routing-slip'
import { chequeRefundCodes, ChequeRefundStatus } from '@/util/constants'
import CommonUtils from '@/util/common-util'

describe('RefundRequestForm.vue', () => {
  const i18n = initialize(Vue)
  const localVue = createLocalVue()

  const vuetify = new Vuetify({})
  const MyStub = {
    template: '<div />'
  }

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('renders component', async () => {
    vi.spyOn(CommonUtils, 'isApproverRole').mockReturnValue(true)
    const wrapper: any = mount(RefundRequestForm, {
      localVue,
      vuetify,
      i18n,
      stubs: {
        AddressForm: MyStub
      },
      propsData: {
        isEditing: true,
        inputRefundRequestDetails: refundRequestDetails
      },
      mocks: {
        chequeRefundCodes,
        ChequeRefundStatus
      },
      provide: {
        chequeRefundCodes,
        ChequeRefundStatus
      }
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-test="txtName"]').exists()).toBeTruthy()
    expect(wrapper.vm.name).toBe(refundRequestDetails.name)
    expect(wrapper.vm.address).toStrictEqual(refundRequestDetails.mailingAddress)
  })
})
