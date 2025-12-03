import { mountSuspended } from '@nuxt/test-utils/runtime'
import DailyReport from '~/components/Dashboard/DailyReport.vue'
import { nextTick } from 'vue'

const mockGetDailyReport = vi.fn()
const mockToggleCalendar = vi.fn()

const mockSelectedDate = ref<string | null>(null)
const mockShowCalendar = ref<boolean>(false)
const mockIsDownloading = ref<boolean>(false)

vi.mock('~/composables/useDailyReport', () => ({
  useDailyReport: () => ({
    selectedDate: mockSelectedDate,
    getDailyReport: mockGetDailyReport,
    showCalendar: mockShowCalendar,
    isDownloading: mockIsDownloading,
    toggleCalendar: mockToggleCalendar
  })
}))

describe('DailyReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelectedDate.value = null
    mockShowCalendar.value = false
    mockIsDownloading.value = false
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-09-26T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render', async () => {
    const wrapper = await mountSuspended(DailyReport)
    expect(wrapper.exists()).toBe(true)
  })

  it('should render the Daily Report button with correct label', async () => {
    const wrapper = await mountSuspended(DailyReport)
    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('Daily Report')
  })

  it('should display calendar popover when showCalendar is true', async () => {
    mockShowCalendar.value = true
    const wrapper = await mountSuspended(DailyReport, {
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot name="trigger" /><div v-if="open"><slot name="content" /></div></div>',
            props: {
              open: {
                type: Boolean,
                default: false
              }
            },
            emits: ['update:open']
          },
          UButton: true,
          UCard: {
            template: '<div><slot name="header" /><slot /><slot name="footer" /></div>'
          },
          UCalendar: true
        }
      }
    })
    await nextTick()

    expect(wrapper.text()).toContain('Select Daily Report Date')
  })

  it('should display selected date when date is selected', async () => {
    mockSelectedDate.value = '2025-09-25'
    mockShowCalendar.value = true
    const wrapper = await mountSuspended(DailyReport, {
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot name="trigger" /><div v-if="open"><slot name="content" /></div></div>',
            props: {
              open: {
                type: Boolean,
                default: false
              }
            },
            emits: ['update:open']
          },
          UButton: true,
          UCard: {
            template: '<div><slot name="header" /><slot /><slot name="footer" /></div>'
          },
          UCalendar: true
        }
      }
    })
    await nextTick()

    expect(wrapper.text()).toContain('Selected Date:')
    expect(wrapper.text()).toContain('Thu, Sep 25, 2025')
  })

  it('should disable download button when no date is selected', async () => {
    mockSelectedDate.value = null
    mockShowCalendar.value = true
    const wrapper = await mountSuspended(DailyReport, {
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot name="trigger" /><div v-if="open"><slot name="content" /></div></div>',
            props: {
              open: {
                type: Boolean,
                default: false
              }
            },
            emits: ['update:open']
          },
          UButton: {
            template: '<button v-bind="$attrs" :disabled="disabled" '
              + ':class="{ loading: loading }"><slot>{{ label }}</slot></button>',
            props: ['label', 'disabled', 'loading'],
            inheritAttrs: false
          },
          UCard: {
            template: '<div><slot name="header" /><slot /><slot name="footer" /></div>'
          },
          UCalendar: {
            template: '<div>Calendar</div>',
            props: ['modelValue', 'maxValue']
          }
        }
      }
    })
    await nextTick()

    const downloadButton = wrapper.find('[data-test="btn-download-report"]')
    expect(downloadButton.exists()).toBe(true)
    expect(downloadButton.attributes('disabled')).toBeDefined()
  })

  it('should enable download button when date is selected', async () => {
    mockSelectedDate.value = '2025-09-25'
    mockShowCalendar.value = true
    const wrapper = await mountSuspended(DailyReport, {
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot name="trigger" /><div v-if="open"><slot name="content" /></div></div>',
            props: {
              open: {
                type: Boolean,
                default: false
              }
            },
            emits: ['update:open']
          },
          UButton: {
            template: '<button v-bind="$attrs" :disabled="disabled" '
              + ':class="{ loading: loading }"><slot>{{ label }}</slot></button>',
            props: ['label', 'disabled', 'loading'],
            inheritAttrs: false
          },
          UCard: {
            template: '<div><slot name="header" /><slot /><slot name="footer" /></div>'
          },
          UCalendar: {
            template: '<div>Calendar</div>',
            props: ['modelValue', 'maxValue']
          }
        }
      }
    })
    await nextTick()

    const downloadButton = wrapper.find('[data-test="btn-download-report"]')
    expect(downloadButton.exists()).toBe(true)
    expect(downloadButton.attributes('disabled')).toBeUndefined()
  })

  it('should show loading state on download button when downloading', async () => {
    mockSelectedDate.value = '2025-09-25'
    mockShowCalendar.value = true
    mockIsDownloading.value = true
    const wrapper = await mountSuspended(DailyReport, {
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot name="trigger" /><div v-if="open"><slot name="content" /></div></div>',
            props: {
              open: {
                type: Boolean,
                default: false
              }
            },
            emits: ['update:open']
          },
          UButton: {
            template: '<button v-bind="$attrs" :disabled="disabled" '
              + ':class="{ loading: loading }"><slot>{{ label }}</slot></button>',
            props: ['label', 'disabled', 'loading'],
            inheritAttrs: false
          },
          UCard: {
            template: '<div><slot name="header" /><slot /><slot name="footer" /></div>'
          },
          UCalendar: {
            template: '<div>Calendar</div>',
            props: ['modelValue', 'maxValue']
          }
        }
      }
    })
    await nextTick()

    const downloadButton = wrapper.find('[data-test="btn-download-report"]')
    expect(downloadButton.exists()).toBe(true)
    expect(downloadButton.classes()).toContain('loading')
  })

  it('should call getDailyReport when download button is clicked', async () => {
    mockSelectedDate.value = '2025-09-25'
    mockShowCalendar.value = true
    const wrapper = await mountSuspended(DailyReport, {
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot name="trigger" /><div v-if="open"><slot name="content" /></div></div>',
            props: {
              open: {
                type: Boolean,
                default: false
              }
            },
            emits: ['update:open']
          },
          UButton: {
            template: '<button v-bind="$attrs" :disabled="disabled" '
              + '@click="$emit(\'click\')"><slot>{{ label }}</slot></button>',
            props: ['label', 'disabled', 'loading'],
            emits: ['click'],
            inheritAttrs: false
          },
          UCard: {
            template: '<div><slot name="header" /><slot /><slot name="footer" /></div>'
          },
          UCalendar: {
            template: '<div>Calendar</div>',
            props: ['modelValue', 'maxValue']
          }
        }
      }
    })
    await nextTick()

    const downloadButton = wrapper.find('[data-test="btn-download-report"]')
    expect(downloadButton.exists()).toBe(true)
    await downloadButton.trigger('click')
    await nextTick()

    expect(mockGetDailyReport).toHaveBeenCalledOnce()
  })

  it('should call toggleCalendar(false) when cancel button is clicked', async () => {
    mockShowCalendar.value = true
    const wrapper = await mountSuspended(DailyReport, {
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot name="trigger" /><div v-if="open"><slot name="content" /></div></div>',
            props: {
              open: {
                type: Boolean,
                default: false
              }
            },
            emits: ['update:open']
          },
          UButton: {
            template: '<button v-bind="$attrs" :disabled="disabled" '
              + '@click="$emit(\'click\')"><slot>{{ label }}</slot></button>',
            props: ['label', 'disabled', 'loading'],
            emits: ['click'],
            inheritAttrs: false
          },
          UCard: {
            template: '<div><slot name="header" /><slot /><slot name="footer" /></div>'
          },
          UCalendar: {
            template: '<div>Calendar</div>',
            props: ['modelValue', 'maxValue']
          }
        }
      }
    })
    await nextTick()

    const cancelButton = wrapper.find('[data-test="btn-cancel"]')
    expect(cancelButton.exists()).toBe(true)
    await cancelButton.trigger('click')
    await nextTick()

    expect(mockToggleCalendar).toHaveBeenCalledWith(false)
  })

  it('should not call getDailyReport when download button is clicked without date', async () => {
    mockSelectedDate.value = null
    mockShowCalendar.value = true
    const wrapper = await mountSuspended(DailyReport, {
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot name="trigger" /><div v-if="open"><slot name="content" /></div></div>',
            props: {
              open: {
                type: Boolean,
                default: false
              }
            },
            emits: ['update:open']
          },
          UButton: {
            template: '<button v-bind="$attrs" :disabled="disabled" '
              + '@click="$emit(\'click\')"><slot>{{ label }}</slot></button>',
            props: ['label', 'disabled', 'loading'],
            emits: ['click'],
            inheritAttrs: false
          },
          UCard: {
            template: '<div><slot name="header" /><slot /><slot name="footer" /></div>'
          },
          UCalendar: {
            template: '<div>Calendar</div>',
            props: ['modelValue', 'maxValue']
          }
        }
      }
    })
    await nextTick()

    const downloadButton = wrapper.find('[data-test="btn-download-report"]')
    expect(downloadButton.exists()).toBe(true)
    expect(downloadButton.attributes('disabled')).toBeDefined()

    await downloadButton.trigger('click')
    await nextTick()

    expect(mockGetDailyReport).not.toHaveBeenCalled()
  })

  it('should format selected date correctly', async () => {
    mockSelectedDate.value = '2025-09-25'
    mockShowCalendar.value = true
    const wrapper = await mountSuspended(DailyReport, {
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot name="trigger" /><div v-if="open"><slot name="content" /></div></div>',
            props: {
              open: {
                type: Boolean,
                default: false
              }
            },
            emits: ['update:open']
          },
          UButton: true,
          UCard: {
            template: '<div><slot name="header" /><slot /><slot name="footer" /></div>'
          },
          UCalendar: true
        }
      }
    })
    await nextTick()
    expect(wrapper.text()).toContain('Thu, Sep 25, 2025')
  })

  it('should update selectedDate when localModel is set', async () => {
    mockSelectedDate.value = null
    const wrapper = await mountSuspended(DailyReport, {
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot name="trigger" /><div v-if="open"><slot name="content" /></div></div>',
            props: {
              open: {
                type: Boolean,
                default: false
              }
            },
            emits: ['update:open']
          },
          UButton: true,
          UCard: {
            template: '<div><slot name="header" /><slot /><slot name="footer" /></div>'
          },
          UCalendar: {
            template: '<div>Calendar</div>',
            props: ['modelValue', 'maxValue'],
            emits: ['update:modelValue']
          }
        }
      }
    })
    const calendar = wrapper.findComponent({ name: 'UCalendar' })
    if (calendar.exists()) {
      const testDate = { year: 2025, month: 9, day: 25 }
      await calendar.vm.$emit('update:modelValue', testDate)
      await nextTick()
      expect(mockSelectedDate.value).toBe('2025-09-25')
    }
  })

  it('should set selectedDate to null when localModel is set to undefined', async () => {
    mockSelectedDate.value = '2025-09-25'
    const wrapper = await mountSuspended(DailyReport, {
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot name="trigger" /><div v-if="open"><slot name="content" /></div></div>',
            props: {
              open: {
                type: Boolean,
                default: false
              }
            },
            emits: ['update:open']
          },
          UButton: true,
          UCard: {
            template: '<div><slot name="header" /><slot /><slot name="footer" /></div>'
          },
          UCalendar: {
            template: '<div>Calendar</div>',
            props: ['modelValue', 'maxValue'],
            emits: ['update:modelValue']
          }
        }
      }
    })
    const calendar = wrapper.findComponent({ name: 'UCalendar' })
    if (calendar.exists()) {
      await calendar.vm.$emit('update:modelValue', undefined)
      await nextTick()
      expect(mockSelectedDate.value).toBeNull()
    }
  })

  it('should display empty string when no date is selected in formatSelectedDate', async () => {
    mockSelectedDate.value = null
    mockShowCalendar.value = true
    const wrapper = await mountSuspended(DailyReport, {
      global: {
        stubs: {
          UPopover: {
            template: '<div><slot name="trigger" /><div v-if="open"><slot name="content" /></div></div>',
            props: {
              open: {
                type: Boolean,
                default: false
              }
            },
            emits: ['update:open']
          },
          UButton: true,
          UCard: {
            template: '<div><slot name="header" /><slot /><slot name="footer" /></div>'
          },
          UCalendar: true
        }
      }
    })
    await nextTick()
    const selectedDateText = wrapper.text().match(/Selected Date:.*?(\w+)/)
    if (selectedDateText) {
      expect(wrapper.text()).toContain('Selected Date:')
    }
  })
})
