import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useCanadaPost } from '~/composables/useCanadaPost'

const { runtime } = vi.hoisted(() => ({ runtime: { addressCompleteKey: 'test-key' as string | undefined } }))

mockNuxtImport('useRuntimeConfig', original => () => {
  const config = original()
  return { ...config, public: { ...config.public, addressCompleteKey: runtime.addressCompleteKey } }
})

type Listener = (address: Record<string, string>) => void

class FakeAddress {
  static instances: FakeAddress[] = []
  listeners: Record<string, Listener> = {}
  destroy = vi.fn()
  constructor(public fields: unknown[], public options: Record<string, unknown>) {
    FakeAddress.instances.push(this)
  }

  listen(name: string, fn: Listener) {
    this.listeners[name] = fn
  }
}

const win = window as unknown as { pca?: unknown, currentAddressComplete?: FakeAddress }

describe('useCanadaPost', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    FakeAddress.instances = []
    runtime.addressCompleteKey = 'test-key'
    win.pca = { fieldMode: { SEARCH: 'search-mode' }, Address: FakeAddress }
    delete win.currentAddressComplete
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    delete win.pca
    delete win.currentAddressComplete
  })

  it('starts with an empty address and no active field', () => {
    const { activeAddressField, address } = useCanadaPost()
    expect(activeAddressField.value).toBeUndefined()
    expect(Object.values(address).every(v => v === '')).toBe(true)
  })

  it('warns and does nothing when the pca script is not loaded', () => {
    delete win.pca
    const { enableAddressComplete, activeAddressField } = useCanadaPost()
    enableAddressComplete('street-input', 'CA', false)
    expect(activeAddressField.value).toBe('street-input')
    expect(warnSpy).toHaveBeenCalledWith('AddressComplete not initialized due to missing script and/or key')
    expect(win.currentAddressComplete).toBeUndefined()
  })

  it('warns and does nothing when the AddressComplete key is missing', () => {
    runtime.addressCompleteKey = ''
    useCanadaPost().enableAddressComplete('street-input', 'CA', false)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(FakeAddress.instances).toHaveLength(0)
  })

  it('restricts search to the given country when country selection is disabled', () => {
    useCanadaPost().enableAddressComplete('street-input', 'US', false)

    expect(FakeAddress.instances).toHaveLength(1)
    const instance = FakeAddress.instances[0]!
    expect(win.currentAddressComplete).toBe(instance)
    expect(instance.fields).toEqual([{ element: 'street-input', field: 'Line1', mode: 'search-mode' }])
    expect(instance.options).toEqual({
      key: 'test-key',
      bar: {},
      countries: { defaultCode: 'US', codesList: 'US' }
    })
    expect(instance.listeners.populate).toBeTypeOf('function')
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('shows the country bar and does not restrict codes when country selection is enabled', () => {
    useCanadaPost().enableAddressComplete('street-input', 'CA', true)
    expect(FakeAddress.instances[0]!.options).toEqual({
      key: 'test-key',
      bar: { visible: true, showCountry: true },
      countries: { defaultCode: 'CA' }
    })
  })

  it('destroys a previous AddressComplete instance before creating a new one', () => {
    const { enableAddressComplete } = useCanadaPost()
    enableAddressComplete('first', 'CA', false)
    const first = FakeAddress.instances[0]!
    enableAddressComplete('second', 'CA', false)

    expect(first.destroy).toHaveBeenCalledTimes(1)
    expect(win.currentAddressComplete).toBe(FakeAddress.instances[1])
  })

  it('populates the address from the AddressComplete response', () => {
    const { enableAddressComplete, address } = useCanadaPost()
    enableAddressComplete('street-input', 'CA', false)

    FakeAddress.instances[0]!.listeners.populate!({
      Line1: '123 Main St',
      Line2: 'Suite 4',
      City: 'Victoria',
      ProvinceCode: 'BC',
      PostalCode: 'V8V 1A1',
      CountryIso2: 'CA',
      Street: 'Main St',
      BuildingNumber: '123',
      SubBuilding: '4'
    })

    expect({ ...address }).toEqual({
      street: '123 Main St',
      streetAdditional: 'Suite 4',
      city: 'Victoria',
      region: 'BC',
      postalCode: 'V8V 1A1',
      country: 'CA',
      locationDescription: '',
      streetName: 'Main St',
      streetNumber: '123',
      unitNumber: '4'
    })
  })

  it('defaults missing street lines when populating', () => {
    const { enableAddressComplete, address } = useCanadaPost()
    enableAddressComplete('street-input', 'CA', false)
    FakeAddress.instances[0]!.listeners.populate!({ Line1: '', City: 'Victoria' })
    expect(address.street).toBe('N/A')
    expect(address.streetAdditional).toBe('')
    expect(address.city).toBe('Victoria')
  })
})
