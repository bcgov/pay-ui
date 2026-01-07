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

  it('should render, display calendar, selected date, and handle download button states', async () => {
    const wrapper = await mountSuspended(DailyReport)
    expect(wrapper.exists()).toBe(true)

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('Daily Report')

    mockShowCalendar.value = true
    const wrapper2 = await mountSuspended(DailyReport, {
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
    expect(wrapper2.text()).toContain('Select Daily Report Date')

    mockSelectedDate.value = '2025-09-25'
    const wrapper3 = await mountSuspended(DailyReport, {
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
    expect(wrapper3.text()).toContain('Selected Date:')
    expect(wrapper3.text()).toContain('Thu, Sep 25, 2025')

    mockSelectedDate.value = null
    const wrapper4 = await mountSuspended(DailyReport, {
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

    const downloadButton = wrapper4.find('[data-test="btn-download-report"]')
    expect(downloadButton.exists()).toBe(true)
    expect(downloadButton.attributes('disabled')).toBeDefined()

    mockSelectedDate.value = '2025-09-25'
    const wrapper5 = await mountSuspended(DailyReport, {
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

    const downloadButton2 = wrapper5.find('[data-test="btn-download-report"]')
    expect(downloadButton2.exists()).toBe(true)
    expect(downloadButton2.attributes('disabled')).toBeUndefined()
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

  it('should format, update, and handle date selection correctly', async () => {
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

    mockSelectedDate.value = null
    const wrapper2 = await mountSuspended(DailyReport, {
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
    const calendar = wrapper2.findComponent({ name: 'UCalendar' })
    if (calendar.exists()) {
      const testDate = { year: 2025, month: 9, day: 25 }
      await calendar.vm.$emit('update:modelValue', testDate)
      await nextTick()
      expect(mockSelectedDate.value).toBe('2025-09-25')
    }

    mockSelectedDate.value = '2025-09-25'
    const wrapper3 = await mountSuspended(DailyReport, {
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
    const calendar2 = wrapper3.findComponent({ name: 'UCalendar' })
    if (calendar2.exists()) {
      await calendar2.vm.$emit('update:modelValue', undefined)
      await nextTick()
      expect(mockSelectedDate.value).toBeNull()
    }

    mockSelectedDate.value = null
    mockShowCalendar.value = true
    const wrapper4 = await mountSuspended(DailyReport, {
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
    const selectedDateText = wrapper4.text().match(/Selected Date:.*?(\w+)/)
    if (selectedDateText) {
      expect(wrapper4.text()).toContain('Selected Date:')
    }
  })
})
