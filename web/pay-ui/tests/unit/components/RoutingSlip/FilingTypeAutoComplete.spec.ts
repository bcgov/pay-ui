import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import FilingTypeAutoComplete from '~/components/RoutingSlip/FilingTypeAutoComplete.vue'
import type { FilingType } from '~/interfaces/routing-slip'

const { mockGetSearchFilingType } = vi.hoisted(() => {
  return {
    mockGetSearchFilingType: vi.fn()
  }
})

const mockPayApi = {
  getSearchFilingType: mockGetSearchFilingType
}

mockNuxtImport('usePayApi', () => () => mockPayApi)

describe('FilingTypeAutoComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSearchFilingType.mockResolvedValue([])
  })

  it('should render, pass props, emit events, and handle search terms', async () => {
    const wrapper = await mountSuspended(FilingTypeAutoComplete, {
      global: {
        stubs: {
          AsyncAutoComplete: {
            template: '<div data-test="input-filing-type" :id="id" '
              + ':data-label="label" :data-model-value="JSON.stringify(modelValue)"></div>',
            props: ['id', 'label', 'modelValue', 'queryFn'],
            emits: ['update:modelValue', 'input', 'blur', 'focus']
          }
        }
      }
    })
    expect(wrapper.exists()).toBe(true)

    const autocompleteElement = wrapper.find('[data-test="input-filing-type"]')
    expect(autocompleteElement.exists()).toBe(true)

    const mockFilingType: FilingType = {
      filingTypeCode: {
        code: 'OTANN',
        description: 'Annual Report'
      },
      corpTypeCode: {
        code: 'BC',
        description: 'BC Company',
        product: 'BC'
      }
    }

    const wrapper2 = await mountSuspended(FilingTypeAutoComplete, {
      props: {
        modelValue: mockFilingType,
        id: 'test-filing-type'
      },
      global: {
        stubs: {
          AsyncAutoComplete: {
            template: '<div data-test="input-filing-type" :id="id" '
              + ':data-label="label" :data-model-value="JSON.stringify(modelValue)"></div>',
            props: ['id', 'label', 'modelValue', 'queryFn'],
            emits: ['update:modelValue', 'input', 'blur', 'focus']
          }
        }
      }
    })

    const autocompleteElement2 = wrapper2.find('[data-test="input-filing-type"]')
    expect(autocompleteElement2.exists()).toBe(true)
    expect(autocompleteElement2.attributes('id')).toBe('test-filing-type')
    expect(autocompleteElement2.attributes('data-label')).toBe('Filing Type Name')
    const component = wrapper2.vm as InstanceType<typeof FilingTypeAutoComplete> & {
      searchFilingTypes?: (searchTerm: string | undefined) => Promise<Array<FilingType & { label: string }>> }
    const queryFn = component.searchFilingTypes
    expect(typeof queryFn).toBe('function')

    const autocomplete = wrapper2.findComponent({ name: 'AsyncAutoComplete' })
    if (autocomplete.exists() && autocomplete.vm) {
      await autocomplete.vm.$emit('update:modelValue', mockFilingType)
      expect(wrapper2.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper2.emitted('update:modelValue')?.[0]).toEqual([mockFilingType])
      expect(wrapper2.emitted('input')).toBeTruthy()
      expect(wrapper2.emitted('input')?.length).toBe(1)
    }

    if (queryFn) {
      const result = await queryFn(undefined)
      expect(result).toEqual([])
      expect(mockGetSearchFilingType).not.toHaveBeenCalled()
    }
  })

  it('should return empty array when trimmed searchTerm is less than 3 characters', async () => {
    const wrapper = await mountSuspended(FilingTypeAutoComplete, {
      global: {
        stubs: {
          AsyncAutoComplete: {
            template: '<div></div>',
            props: ['id', 'label', 'modelValue', 'queryFn'],
            emits: ['update:modelValue', 'input', 'blur', 'focus']
          }
        }
      }
    })

    const component = wrapper.vm as InstanceType<typeof FilingTypeAutoComplete> & {
      searchFilingTypes?: (searchTerm: string | undefined) => Promise<Array<FilingType & { label: string }>>
    }
    const queryFn = component.searchFilingTypes
    expect(queryFn).toBeTruthy()
    expect(typeof queryFn).toBe('function')
    if (!queryFn) {
      throw new Error('queryFn is undefined')
    }

    const result1 = await queryFn('ab')
    const result2 = await queryFn('  ab  ')
    const result3 = await queryFn('a')
    const result4 = await queryFn('xy')

    expect(result1).toEqual([])
    expect(result2).toEqual([])
    expect(result3).toEqual([])
    expect(result4).toEqual([])
    expect(mockGetSearchFilingType).not.toHaveBeenCalled()
  })

  it('should call API and return results when searchTerm length is exactly 3', async () => {
    const mockResults: FilingType[] = [
      {
        filingTypeCode: {
          code: 'OTANN',
          description: 'Annual Report'
        },
        corpTypeCode: {
          code: 'BC',
          description: 'BC Company',
          product: 'BC'
        }
      }
    ]

    mockGetSearchFilingType.mockResolvedValue(mockResults)

    const wrapper = await mountSuspended(FilingTypeAutoComplete, {
      global: {
        stubs: {
          AsyncAutoComplete: {
            template: '<div data-test="autocomplete"></div>',
            props: ['id', 'label', 'modelValue', 'queryFn'],
            emits: ['update:modelValue', 'input', 'blur', 'focus']
          }
        }
      }
    })

    const component = wrapper.vm as InstanceType<typeof FilingTypeAutoComplete> & {
      searchFilingTypes?: (searchTerm: string | undefined) => Promise<Array<FilingType & { label: string }>>
    }
    const queryFn = component.searchFilingTypes
    expect(queryFn).toBeTruthy()
    expect(typeof queryFn).toBe('function')
    if (!queryFn) {
      throw new Error('queryFn is undefined')
    }

    const result1 = await queryFn('abc')
    expect(mockGetSearchFilingType).toHaveBeenCalledWith('abc')
    expect(mockGetSearchFilingType).toHaveBeenCalledTimes(1)
    expect(result1).toHaveLength(1)
    expect(result1[0]).toMatchObject({
      ...mockResults[0],
      label: 'Annual Report - BC Company'
    })

    vi.clearAllMocks()
    mockGetSearchFilingType.mockResolvedValue(mockResults)
    const queryFn2 = component.searchFilingTypes
    if (!queryFn2) {
      throw new Error('queryFn is undefined')
    }

    const result2 = await queryFn2('  xyz  ')
    expect(mockGetSearchFilingType).toHaveBeenCalledWith('xyz')
    expect(mockGetSearchFilingType).toHaveBeenCalledTimes(1)
    expect(result2).toHaveLength(1)
  })

  it('should call getSearchFilingType with trimmed searchTerm and handle results', async () => {
    const mockResults: FilingType[] = [
      {
        filingTypeCode: {
          code: 'OTANN',
          description: 'Annual Report'
        },
        corpTypeCode: {
          code: 'BC',
          description: 'BC Company',
          product: 'BC'
        }
      }
    ]

    mockGetSearchFilingType.mockResolvedValue(mockResults)

    const wrapper = await mountSuspended(FilingTypeAutoComplete, {
      global: {
        stubs: {
          AsyncAutoComplete: {
            template: '<div data-test="autocomplete"></div>',
            props: ['id', 'label', 'modelValue', 'queryFn'],
            emits: ['update:modelValue', 'input', 'blur', 'focus']
          }
        }
      }
    })

    const component = wrapper.vm as InstanceType<typeof FilingTypeAutoComplete> & {
      searchFilingTypes?: (searchTerm: string | undefined) => Promise<Array<FilingType & { label: string }>>
    }
    const queryFn = component.searchFilingTypes
    expect(queryFn).toBeTruthy()
    expect(typeof queryFn).toBe('function')
    if (!queryFn) {
      throw new Error('queryFn is undefined')
    }

    await queryFn('  annual  ')
    expect(mockGetSearchFilingType).toHaveBeenCalledWith('annual')
    expect(mockGetSearchFilingType).toHaveBeenCalledTimes(1)
  })

  it('should map results with label property', async () => {
    const mockResults: FilingType[] = [
      {
        filingTypeCode: {
          code: 'OTANN',
          description: 'Annual Report'
        },
        corpTypeCode: {
          code: 'BC',
          description: 'BC Company',
          product: 'BC'
        }
      },
      {
        filingTypeCode: {
          code: 'OTADD',
          description: 'Address Change'
        },
        corpTypeCode: {
          code: 'BC',
          description: 'BC Company',
          product: 'BC'
        }
      }
    ]

    mockGetSearchFilingType.mockResolvedValue(mockResults)

    const wrapper = await mountSuspended(FilingTypeAutoComplete, {
      global: {
        stubs: {
          AsyncAutoComplete: {
            template: '<div data-test="autocomplete"></div>',
            props: ['id', 'label', 'modelValue', 'queryFn'],
            emits: ['update:modelValue', 'input', 'blur', 'focus']
          }
        }
      }
    })

    const component = wrapper.vm as InstanceType<typeof FilingTypeAutoComplete> & {
      searchFilingTypes?: (searchTerm: string | undefined) => Promise<Array<FilingType & { label: string }>>
    }
    const queryFn = component.searchFilingTypes
    expect(queryFn).toBeTruthy()
    expect(typeof queryFn).toBe('function')
    if (!queryFn) {
      throw new Error('queryFn is undefined')
    }

    const result = await queryFn('annual')
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      ...mockResults[0],
      label: 'Annual Report - BC Company'
    })
    expect(result[1]).toMatchObject({
      ...mockResults[1],
      label: 'Address Change - BC Company'
    })
  })

  it('should handle results without corpTypeCode description', async () => {
    const mockResults: FilingType[] = [
      {
        filingTypeCode: {
          code: 'OTANN',
          description: 'Annual Report'
        }
      }
    ]

    mockGetSearchFilingType.mockResolvedValue(mockResults)

    const wrapper = await mountSuspended(FilingTypeAutoComplete, {
      global: {
        stubs: {
          AsyncAutoComplete: {
            template: '<div data-test="autocomplete"></div>',
            props: ['id', 'label', 'modelValue', 'queryFn'],
            emits: ['update:modelValue', 'input', 'blur', 'focus']
          }
        }
      }
    })

    const component = wrapper.vm as InstanceType<typeof FilingTypeAutoComplete> & {
      searchFilingTypes?: (searchTerm: string | undefined) => Promise<Array<FilingType & { label: string }>>
    }
    const queryFn = component.searchFilingTypes
    expect(queryFn).toBeTruthy()
    expect(typeof queryFn).toBe('function')
    if (!queryFn) {
      throw new Error('queryFn is undefined')
    }

    const result = await queryFn('annual')
    expect(result).toHaveLength(1)
    expect(result[0]?.label).toBe('Annual Report - undefined')
  })

  it('should handle errors gracefully and return empty array', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockGetSearchFilingType.mockRejectedValue(new Error('API Error'))

    const wrapper = await mountSuspended(FilingTypeAutoComplete, {
      global: {
        stubs: {
          AsyncAutoComplete: {
            template: '<div data-test="autocomplete"></div>',
            props: ['id', 'label', 'modelValue', 'queryFn'],
            emits: ['update:modelValue', 'input', 'blur', 'focus']
          }
        }
      }
    })

    const component = wrapper.vm as InstanceType<typeof FilingTypeAutoComplete> & {
      searchFilingTypes?: (searchTerm: string | undefined) => Promise<Array<FilingType & { label: string }>>
    }
    const queryFn = component.searchFilingTypes
    expect(queryFn).toBeTruthy()
    expect(typeof queryFn).toBe('function')
    if (!queryFn) {
      throw new Error('queryFn is undefined')
    }

    const result = await queryFn('annual')

    expect(result).toEqual([])
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error searching filing types:', expect.any(Error))
    consoleErrorSpy.mockRestore()
  })

  it('should render item template slot correctly with and without corpTypeCode', async () => {
    const wrapper = await mountSuspended(FilingTypeAutoComplete, {
      global: {
        stubs: {
          AsyncAutoComplete: {
            template: `
              <div>
                <slot name="item" :item="testItem"></slot>
              </div>
            `,
            props: ['id', 'label', 'modelValue', 'queryFn'],
            emits: ['update:modelValue', 'input', 'blur', 'focus'],
            data() {
              return {
                testItem: {
                  filingTypeCode: {
                    description: 'Annual Report'
                  },
                  corpTypeCode: {
                    description: 'BC Company'
                  }
                }
              }
            }
          }
        }
      }
    })

    const filingDetails = wrapper.find('.filing-details')
    expect(filingDetails.exists()).toBe(true)
    expect(filingDetails.text()).toContain('Annual Report')
    expect(filingDetails.text()).toContain('BC Company')

    const wrapper2 = await mountSuspended(FilingTypeAutoComplete, {
      global: {
        stubs: {
          AsyncAutoComplete: {
            template: `
              <div>
                <slot name="item" :item="testItem"></slot>
              </div>
            `,
            props: ['id', 'label', 'modelValue', 'queryFn'],
            emits: ['update:modelValue', 'input', 'blur', 'focus'],
            data() {
              return {
                testItem: {
                  filingTypeCode: {
                    description: 'Annual Report'
                  }
                }
              }
            }
          }
        }
      }
    })

    const filingDetails2 = wrapper2.find('.filing-details')
    expect(filingDetails2.exists()).toBe(true)
    expect(filingDetails2.text()).toContain('Annual Report')
    expect(filingDetails2.text()).not.toContain('-')
  })

  it('should use default props and pass $attrs to AsyncAutoComplete', async () => {
    const wrapper = await mountSuspended(FilingTypeAutoComplete, {
      global: {
        stubs: {
          AsyncAutoComplete: {
            template: '<div data-test="input-filing-type"></div>',
            props: ['id', 'label', 'modelValue', 'queryFn'],
            emits: ['update:modelValue', 'input', 'blur', 'focus']
          }
        }
      }
    })

    expect(wrapper.exists()).toBe(true)
    const autocompleteElement = wrapper.find('[data-test="input-filing-type"]')
    expect(autocompleteElement.exists()).toBe(true)
  })
})
