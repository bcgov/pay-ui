import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import RoutingSlipInformation from '~/components/RoutingSlip/RoutingSlipInformation.vue'
import { routingSlipMock } from '../../test-data/mock-routing-slip'
import { SlipStatus } from '~/enums/slip-status'
import { chequeRefundCodes } from '~/utils/constants'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

const mockUpdateRoutingSlipStatus = vi.fn()
const mockUpdateRoutingSlipRefundStatus = vi.fn()
const mockGetRoutingSlip = vi.fn().mockResolvedValue(routingSlipMock)
const mockUpdateRoutingSlipComments = vi.fn()
const mockToggleLoading = vi.fn()
const mockOpenPlaceRoutingSlipToNSFModal = vi.fn()
const mockOpenVoidRoutingSlipModal = vi.fn()
const mockUpdateRoutingSlipRefund = vi.fn().mockResolvedValue({})

const mockUseRoutingSlip = {
  updateRoutingSlipStatus: mockUpdateRoutingSlipStatus,
  updateRoutingSlipRefundStatus: mockUpdateRoutingSlipRefundStatus,
  getRoutingSlip: mockGetRoutingSlip,
  updateRoutingSlipComments: mockUpdateRoutingSlipComments
}

const mockStore = reactive({
  routingSlip: { ...routingSlipMock }
})

const mockPayModals = {
  openPlaceRoutingSlipToNSFModal: mockOpenPlaceRoutingSlipToNSFModal,
  openVoidRoutingSlipModal: mockOpenVoidRoutingSlipModal
}

const mockPayApi = {
  updateRoutingSlipRefund: mockUpdateRoutingSlipRefund
}

const mockShowRefundForm = ref(false)
const mockHandleStatusSelect = vi.fn()
const mockHandleRefundStatusSelect = vi.fn()
const mockHandleRefundFormSubmit = vi.fn()
const mockHandleRefundFormCancel = vi.fn()

mockNuxtImport('useRoutingSlip', () => () => mockUseRoutingSlip)
mockNuxtImport('useRoutingSlipStore', () => () => ({
  store: mockStore
}))
mockNuxtImport('usePayModals', () => () => mockPayModals)
mockNuxtImport('usePayApi', () => () => mockPayApi)
mockNuxtImport('useI18n', () => () => ({
  t: (key: string, fallback?: string) => fallback || key
}))

vi.mock('~/composables/common/useLoader', () => ({
  useLoader: () => ({
    toggleLoading: mockToggleLoading
  })
}))

vi.mock('~/composables/viewRoutingSlip/useRoutingSlipInfo', () => ({
  useRoutingSlipInfo: () => ({
    routingSlip: computed(() => mockStore.routingSlip),
    formattedDate: computed(() => 'Feb 23, 2025'),
    statusColor: computed(() => 'text-green-600'),
    statusLabel: computed(() => mockStore.routingSlip.status || '-'),
    entityNumber: computed(() => mockStore.routingSlip.paymentAccount?.accountName || ''),
    contactName: computed(() => mockStore.routingSlip.contactName),
    mailingAddress: computed(() => mockStore.routingSlip.mailingAddress),
    deliveryInstructions: computed(() => mockStore.routingSlip.mailingAddress?.deliveryInstructions),
    allowedStatuses: computed(() => mockStore.routingSlip.allowedStatuses || []),
    handleStatusSelect: mockHandleStatusSelect,
    handleRefundStatusSelect: mockHandleRefundStatusSelect,
    showRefundForm: mockShowRefundForm,
    handleRefundFormSubmit: mockHandleRefundFormSubmit,
    handleRefundFormCancel: mockHandleRefundFormCancel,
    refundAmount: computed(() => mockStore.routingSlip.refundAmount || mockStore.routingSlip.remainingAmount || 0),
    isRefundRequested: computed(() => mockStore.routingSlip.status === SlipStatus.REFUNDREQUEST),
    shouldShowRefundAmount: computed(() => {
      const hasRefundAmount = !!(mockStore.routingSlip.refundAmount || mockStore.routingSlip.remainingAmount)
      const isNotActive = mockStore.routingSlip.status !== SlipStatus.ACTIVE
      return hasRefundAmount && !mockShowRefundForm.value && isNotActive
    }),
    refundFormInitialData: computed(() => ({
      name: mockStore.routingSlip.contactName || '',
      mailingAddress: mockStore.routingSlip.mailingAddress,
      chequeAdvice: undefined
    })),
    refundStatus: computed(() => {
      const status = mockStore.routingSlip.refundStatus
      return status ? status.toUpperCase() : undefined
    }),
    chequeAdvice: computed(() => mockStore.routingSlip.refunds?.[0]?.details?.chequeAdvice || ''),
    isRefundStatusUndeliverable: computed(() =>
      mockStore.routingSlip.refundStatus === chequeRefundCodes.CHEQUE_UNDELIVERABLE),
    canUpdateRefundStatus: computed(() => {
      const status = mockStore.routingSlip.refundStatus
      return status === chequeRefundCodes.PROCESSED || status === chequeRefundCodes.CHEQUE_UNDELIVERABLE
    }),
    shouldShowRefundStatusSection: computed(() => {
      const isRequested = mockStore.routingSlip.status === SlipStatus.REFUNDREQUEST
      return (isRequested || mockStore.routingSlip.status === SlipStatus.REFUNDPROCESSED) && !mockShowRefundForm.value
    }),
    shouldShowNameAndAddress: computed(() => {
      if (mockShowRefundForm.value) {
        return false
      }
      const hasContactName = !!mockStore.routingSlip.contactName
      const address = mockStore.routingSlip.mailingAddress
      const hasMailingAddress = !!address && (
        address.street || address.city || address.region || address.postalCode || address.country
      )
      return hasContactName || hasMailingAddress
    })
  })
}))

describe('RoutingSlipInformation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockStore.routingSlip = { ...routingSlipMock }
    mockShowRefundForm.value = false
    mockGetRoutingSlip.mockResolvedValue(routingSlipMock)
    mockUpdateRoutingSlipRefund.mockResolvedValue({})
    mockHandleStatusSelect.mockImplementation(async (status: SlipStatus) => {
      if (status === SlipStatus.REFUNDREQUEST) {
        mockShowRefundForm.value = true
      }
    })
    mockHandleRefundStatusSelect.mockImplementation(async (status: string, onCommentsUpdated?: () => void) => {
      if (onCommentsUpdated) {
        onCommentsUpdated()
      }
    })
    mockHandleRefundFormCancel.mockImplementation(() => {
      mockShowRefundForm.value = false
    })
    mockHandleRefundFormSubmit.mockImplementation(async () => {
      mockShowRefundForm.value = false
    })
  })

  it('should render', async () => {
    const wrapper = await mountSuspended(RoutingSlipInformation, {
      global: {
        stubs: {
          StatusMenu: true,
          RefundStatusMenu: true,
          RefundRequestForm: true,
          ConnectAddressDisplay: true,
          UCard: {
            template: '<div><slot /></div>'
          },
          UBadge: true
        }
      }
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display routing slip number', async () => {
    const wrapper = await mountSuspended(RoutingSlipInformation, {
      global: {
        stubs: {
          StatusMenu: true,
          RefundStatusMenu: true,
          RefundRequestForm: true,
          ConnectAddressDisplay: true,
          UCard: {
            template: '<div><slot /></div>'
          },
          UBadge: true
        }
      }
    })

    expect(wrapper.text()).toContain('123456789')
  })

  it('should display formatted date', async () => {
    const wrapper = await mountSuspended(RoutingSlipInformation, {
      global: {
        stubs: {
          StatusMenu: true,
          RefundStatusMenu: true,
          RefundRequestForm: true,
          ConnectAddressDisplay: true,
          UCard: {
            template: '<div><slot /></div>'
          },
          UBadge: true
        }
      }
    })

    await nextTick()
    expect(wrapper.text()).toContain('Feb')
  })

  it('should display status', async () => {
    const wrapper = await mountSuspended(RoutingSlipInformation, {
      global: {
        stubs: {
          StatusMenu: true,
          RefundStatusMenu: true,
          RefundRequestForm: true,
          ConnectAddressDisplay: true,
          UCard: {
            template: '<div><slot /></div>'
          },
          UBadge: true
        }
      }
    })

    await nextTick()
    expect(wrapper.text()).toContain('ACTIVE')
  })

  it('should display entity number', async () => {
    const wrapper = await mountSuspended(RoutingSlipInformation, {
      global: {
        stubs: {
          StatusMenu: true,
          RefundStatusMenu: true,
          RefundRequestForm: true,
          ConnectAddressDisplay: true,
          UCard: {
            template: '<div><slot /></div>'
          },
          UBadge: true
        }
      }
    })

    await nextTick()
    expect(wrapper.text()).toContain('Test Account')
  })

  it('should show StatusMenu when allowedStatuses exist', async () => {
    mockStore.routingSlip.allowedStatuses = [SlipStatus.ACTIVE, SlipStatus.COMPLETE]

    const wrapper = await mountSuspended(RoutingSlipInformation, {
      global: {
        stubs: {
          StatusMenu: {
            template: '<div data-test="status-menu"></div>',
            props: ['allowedStatusList'],
            emits: ['select']
          },
          RefundStatusMenu: true,
          RefundRequestForm: true,
          ConnectAddressDisplay: true,
          UCard: {
            template: '<div><slot /></div>'
          },
          UBadge: true
        }
      }
    })

    await nextTick()
    const statusMenu = wrapper.find('[data-test="status-menu"]')
    expect(statusMenu.exists()).toBe(true)
  })

  it('should not show StatusMenu when no allowedStatuses', async () => {
    mockStore.routingSlip.allowedStatuses = []

    const wrapper = await mountSuspended(RoutingSlipInformation, {
      global: {
        stubs: {
          StatusMenu: {
            template: '<div data-test="status-menu"></div>',
            props: ['allowedStatusList'],
            emits: ['select']
          },
          RefundStatusMenu: true,
          RefundRequestForm: true,
          ConnectAddressDisplay: true,
          UCard: {
            template: '<div><slot /></div>'
          },
          UBadge: true
        }
      }
    })

    await nextTick()
    const statusMenu = wrapper.find('[data-test="status-menu"]')
    expect(statusMenu.exists()).toBe(false)
  })

  it('should emit commentsUpdated when handleRefundStatusSelectWithComments is called', async () => {
    mockStore.routingSlip.status = SlipStatus.REFUNDREQUEST
    mockStore.routingSlip.refundStatus = chequeRefundCodes.PROCESSED

    const wrapper = await mountSuspended(RoutingSlipInformation, {
      global: {
        stubs: {
          StatusMenu: true,
          RefundStatusMenu: {
            template: '<div data-test="refund-status-menu"></div>',
            props: ['currentRefundStatus'],
            emits: ['select']
          },
          RefundRequestForm: true,
          ConnectAddressDisplay: true,
          UCard: {
            template: '<div><slot /></div>'
          },
          UBadge: true
        }
      }
    })

    await nextTick()

    const refundStatusMenuElement = wrapper.find('[data-test="refund-status-menu"]')
    expect(refundStatusMenuElement.exists()).toBe(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const component = wrapper.vm as any
    await component.handleRefundStatusSelectWithComments(chequeRefundCodes.PROCESSED)
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(mockHandleRefundStatusSelect).toHaveBeenCalledWith(chequeRefundCodes.PROCESSED, expect.any(Function))
    expect(wrapper.emitted('commentsUpdated')).toBeTruthy()
  })

  it('should show refund amount when shouldShowRefundAmount is true', async () => {
    mockStore.routingSlip.status = SlipStatus.COMPLETE
    mockStore.routingSlip.refundAmount = 500

    const wrapper = await mountSuspended(RoutingSlipInformation, {
      global: {
        stubs: {
          StatusMenu: true,
          RefundStatusMenu: true,
          RefundRequestForm: true,
          ConnectAddressDisplay: true,
          UCard: {
            template: '<div><slot /></div>'
          },
          UBadge: true
        }
      }
    })

    await nextTick()
    expect(wrapper.text()).toContain('500.00')
  })

  it('should show RefundRequestForm when showRefundForm is true', async () => {
    mockStore.routingSlip.status = SlipStatus.ACTIVE
    mockStore.routingSlip.allowedStatuses = [SlipStatus.REFUNDREQUEST]
    mockShowRefundForm.value = true

    const wrapper = await mountSuspended(RoutingSlipInformation, {
      global: {
        stubs: {
          StatusMenu: true,
          RefundStatusMenu: true,
          RefundRequestForm: {
            template: '<div data-test="refund-form"></div>',
            props: ['refundAmount', 'entityNumber', 'initialData'],
            emits: ['submit', 'cancel']
          },
          ConnectAddressDisplay: true,
          UCard: {
            template: '<div><slot /></div>'
          },
          UBadge: true
        }
      }
    })

    await nextTick()
    const refundForm = wrapper.find('[data-test="refund-form"]')
    expect(refundForm.exists()).toBe(true)
  })

  it('should show contact name when isRefundRequested and not showing form', async () => {
    mockStore.routingSlip.status = SlipStatus.REFUNDREQUEST
    mockStore.routingSlip.contactName = 'John Doe'

    const wrapper = await mountSuspended(RoutingSlipInformation, {
      global: {
        stubs: {
          StatusMenu: true,
          RefundStatusMenu: true,
          RefundRequestForm: true,
          ConnectAddressDisplay: true,
          UCard: {
            template: '<div><slot /></div>'
          },
          UBadge: true
        }
      }
    })

    await nextTick()
    expect(wrapper.text()).toContain('John Doe')
  })

  it('should show refund status section when shouldShowRefundStatusSection is true', async () => {
    mockStore.routingSlip.status = SlipStatus.REFUNDREQUEST
    mockStore.routingSlip.refundStatus = chequeRefundCodes.PROCESSED

    const wrapper = await mountSuspended(RoutingSlipInformation, {
      global: {
        stubs: {
          StatusMenu: true,
          RefundStatusMenu: {
            template: '<div data-test="refund-status-menu"></div>',
            props: ['currentRefundStatus'],
            emits: ['select']
          },
          RefundRequestForm: true,
          ConnectAddressDisplay: true,
          UCard: {
            template: '<div><slot /></div>'
          },
          UBadge: true
        }
      }
    })

    await nextTick()
    const refundStatusMenu = wrapper.find('[data-test="refund-status-menu"]')
    expect(refundStatusMenu.exists()).toBe(true)
  })

  it('should display cheque advice when available', async () => {
    mockStore.routingSlip.status = SlipStatus.REFUNDREQUEST
    mockStore.routingSlip.refunds = [{
      details: {
        chequeAdvice: 'Test cheque advice'
      }
    }]

    const wrapper = await mountSuspended(RoutingSlipInformation, {
      global: {
        stubs: {
          StatusMenu: true,
          RefundStatusMenu: true,
          RefundRequestForm: true,
          ConnectAddressDisplay: true,
          UCard: {
            template: '<div><slot /></div>'
          },
          UBadge: true
        }
      }
    })

    await nextTick()
    expect(wrapper.text()).toContain('Test cheque advice')
  })

  it('should display mailing address when shouldShowNameAndAddress is true', async () => {
    mockStore.routingSlip.contactName = 'John Doe'
    mockStore.routingSlip.mailingAddress = {
      street: '123 Main St',
      city: 'Victoria',
      region: 'BC',
      postalCode: 'V1X 1X1',
      country: 'CA'
    }

    const wrapper = await mountSuspended(RoutingSlipInformation, {
      global: {
        stubs: {
          StatusMenu: true,
          RefundStatusMenu: true,
          RefundRequestForm: true,
          ConnectAddressDisplay: {
            template: '<div data-test="address-display"></div>',
            props: ['address']
          },
          UCard: {
            template: '<div><slot /></div>'
          },
          UBadge: true
        }
      }
    })

    await nextTick()
    const addressDisplay = wrapper.find('[data-test="address-display"]')
    expect(addressDisplay.exists()).toBe(true)
  })

  it('should handle status select event from StatusMenu', async () => {
    mockStore.routingSlip.status = SlipStatus.ACTIVE
    mockStore.routingSlip.allowedStatuses = [SlipStatus.ACTIVE, SlipStatus.COMPLETE]
    mockStore.routingSlip.number = '123456789'

    const wrapper = await mountSuspended(RoutingSlipInformation, {
      global: {
        stubs: {
          StatusMenu: {
            template: '<div data-test="status-menu"></div>',
            props: ['allowedStatusList'],
            emits: ['select']
          },
          RefundStatusMenu: true,
          RefundRequestForm: true,
          ConnectAddressDisplay: true,
          UCard: {
            template: '<div><slot /></div>'
          },
          UBadge: true
        }
      }
    })

    await nextTick()

    const statusMenuElement = wrapper.find('[data-test="status-menu"]')
    if (statusMenuElement.exists()) {
      const statusMenu = wrapper.findComponent({ name: 'StatusMenu' })
      if (statusMenu.exists()) {
        await statusMenu.vm.$emit('select', SlipStatus.COMPLETE)
        await nextTick()
        expect(mockHandleStatusSelect).toHaveBeenCalledWith(SlipStatus.COMPLETE)
      }
    } else {
      expect(statusMenuElement.exists()).toBe(true)
    }
  })

  it('should handle refund form submit event', async () => {
    mockStore.routingSlip.status = SlipStatus.ACTIVE
    mockStore.routingSlip.number = '123456789'
    mockShowRefundForm.value = true

    const wrapper = await mountSuspended(RoutingSlipInformation, {
      global: {
        stubs: {
          StatusMenu: true,
          RefundStatusMenu: true,
          RefundRequestForm: {
            template: '<div data-test="refund-form"></div>',
            props: ['refundAmount', 'entityNumber', 'initialData'],
            emits: ['submit', 'cancel']
          },
          ConnectAddressDisplay: true,
          UCard: {
            template: '<div><slot /></div>'
          },
          UBadge: true
        }
      }
    })

    await nextTick()

    const refundFormElement = wrapper.find('[data-test="refund-form"]')
    expect(refundFormElement.exists()).toBe(true)

    const refundForm = wrapper.findComponent({ name: 'RefundRequestForm' })
    if (refundForm.exists()) {
      const submitData = {
        name: 'Test Name',
        mailingAddress: {
          street: '123 Main St',
          city: 'Victoria',
          region: 'BC',
          postalCode: 'V1X 1X1',
          country: 'CA'
        }
      }

      await refundForm.vm.$emit('submit', submitData)
      await nextTick()

      expect(mockHandleRefundFormSubmit).toHaveBeenCalledWith(submitData)
    }
  })

  it('should handle refund form cancel event', async () => {
    mockStore.routingSlip.status = SlipStatus.ACTIVE
    mockStore.routingSlip.number = '123456789'
    mockShowRefundForm.value = true

    const wrapper = await mountSuspended(RoutingSlipInformation, {
      global: {
        stubs: {
          StatusMenu: true,
          RefundStatusMenu: true,
          RefundRequestForm: {
            template: '<div data-test="refund-form"></div>',
            props: ['refundAmount', 'entityNumber', 'initialData'],
            emits: ['submit', 'cancel']
          },
          ConnectAddressDisplay: true,
          UCard: {
            template: '<div><slot /></div>'
          },
          UBadge: true
        }
      }
    })

    await nextTick()

    const refundFormElement = wrapper.find('[data-test="refund-form"]')
    expect(refundFormElement.exists()).toBe(true)

    const refundFormComponent = wrapper.findComponent({ name: 'RefundRequestForm' })
    if (refundFormComponent.exists()) {
      await refundFormComponent.vm.$emit('cancel')
      await nextTick()

      expect(mockHandleRefundFormCancel).toHaveBeenCalled()
      expect(mockShowRefundForm.value).toBe(false)
    }
  })

  it('should display refund status badge with correct color for undeliverable', async () => {
    mockStore.routingSlip.status = SlipStatus.REFUNDREQUEST
    mockStore.routingSlip.refundStatus = chequeRefundCodes.CHEQUE_UNDELIVERABLE

    const wrapper = await mountSuspended(RoutingSlipInformation, {
      global: {
        stubs: {
          StatusMenu: true,
          RefundStatusMenu: true,
          RefundRequestForm: true,
          ConnectAddressDisplay: true,
          UCard: {
            template: '<div><slot /></div>'
          },
          UBadge: {
            template: '<span :class="color" data-test="refund-badge"></span>',
            props: ['label', 'color', 'class']
          }
        }
      }
    })

    await nextTick()
    const badge = wrapper.find('[data-test="refund-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.classes()).toContain('error')
  })

  it('should display delivery instructions when available', async () => {
    mockStore.routingSlip.mailingAddress = {
      street: '123 Main St',
      city: 'Victoria',
      region: 'BC',
      postalCode: 'V1X 1X1',
      country: 'CA',
      deliveryInstructions: 'Leave at front door'
    }

    const wrapper = await mountSuspended(RoutingSlipInformation, {
      global: {
        stubs: {
          StatusMenu: true,
          RefundStatusMenu: true,
          RefundRequestForm: true,
          ConnectAddressDisplay: true,
          UCard: {
            template: '<div><slot /></div>'
          },
          UBadge: true
        }
      }
    })

    await nextTick()
    expect(wrapper.text()).toContain('Leave at front door')
  })
})
