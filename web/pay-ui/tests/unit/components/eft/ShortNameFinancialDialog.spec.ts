import { mount } from '@vue/test-utils'
import ShortNameFinancialDialog from '~/components/eft/ShortNameFinancialDialog.vue'

describe('ShortNameFinancialDialog', () => {
  const defaultProps = {
    open: true,
    type: 'EMAIL' as const,
    currentValue: ''
  }

  const createWrapper = (props = {}) => {
    return mount(ShortNameFinancialDialog, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: {
          UModal: {
            template: `
              <div v-if="open" class="modal">
                <slot name="header" />
                <slot name="body" />
                <slot name="footer" />
              </div>
            `,
            props: ['open']
          },
          UButton: {
            template: '<button @click="$emit(\'click\')"><slot />{{ label }}</button>',
            props: ['label', 'loading', 'disabled']
          },
          UInput: {
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue', 'placeholder', 'type']
          },
          UIcon: true
        }
      }
    })
  }

  it('should render modal when open', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.modal').exists()).toBe(true)
  })

  it('should not render modal when closed', () => {
    const wrapper = createWrapper({ open: false })
    expect(wrapper.find('.modal').exists()).toBe(false)
  })

  it('should display correct title for EMAIL type', () => {
    const wrapper = createWrapper({ type: 'EMAIL' })
    expect(wrapper.text()).toContain('Email')
  })

  it('should display correct title for CAS_SUPPLIER_NUMBER type', () => {
    const wrapper = createWrapper({ type: 'CAS_SUPPLIER_NUMBER' })
    expect(wrapper.text()).toContain('CAS Supplier Number')
  })

  it('should display correct title for CAS_SUPPLIER_SITE type', () => {
    const wrapper = createWrapper({ type: 'CAS_SUPPLIER_SITE' })
    expect(wrapper.text()).toContain('CAS Supplier Site')
  })

  it('should emit update:open when close button is clicked', async () => {
    const wrapper = createWrapper()
    const vm = wrapper.vm as unknown as { closeDialog: () => void }
    vm.closeDialog()

    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })

  it('should emit save event with correct data for email', async () => {
    const wrapper = createWrapper({ type: 'EMAIL' })
    const input = wrapper.find('input')
    await input.setValue('test@example.com')

    const vm = wrapper.vm as unknown as { save: () => Promise<void> }
    await vm.save()

    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')![0]).toEqual([{ email: 'test@example.com' }])
  })

  it('should emit save event with correct data for CAS supplier number', async () => {
    const wrapper = createWrapper({ type: 'CAS_SUPPLIER_NUMBER' })
    const input = wrapper.find('input')
    await input.setValue('SUP123')

    const vm = wrapper.vm as unknown as { save: () => Promise<void> }
    await vm.save()

    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')![0]).toEqual([{ casSupplierNumber: 'SUP123' }])
  })

  it('should emit save event with correct data for CAS supplier site', async () => {
    const wrapper = createWrapper({ type: 'CAS_SUPPLIER_SITE' })
    const input = wrapper.find('input')
    await input.setValue('SITE1')

    const vm = wrapper.vm as unknown as { save: () => Promise<void> }
    await vm.save()

    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')![0]).toEqual([{ casSupplierSite: 'SITE1' }])
  })

  it('should validate email format', async () => {
    const wrapper = createWrapper({ type: 'EMAIL' })

    wrapper.vm.inputValue = 'invalid-email'
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isEmailValid).toBe(false)
    expect(wrapper.vm.canSave).toBe(false)
  })

  it('should accept valid email', async () => {
    const wrapper = createWrapper({ type: 'EMAIL' })

    wrapper.vm.inputValue = 'valid@example.com'
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isEmailValid).toBe(true)
    expect(wrapper.vm.canSave).toBe(true)
  })

  it('should not validate email for non-email types', () => {
    const wrapper = createWrapper({ type: 'CAS_SUPPLIER_NUMBER' })

    wrapper.vm.inputValue = 'not-an-email'
    expect(wrapper.vm.isEmailValid).toBe(true)
  })

  it('should not allow save when input is empty', () => {
    const wrapper = createWrapper()
    expect(wrapper.vm.canSave).toBe(false)
  })

  it('should trim input value when saving', async () => {
    const wrapper = createWrapper({ type: 'CAS_SUPPLIER_NUMBER' })
    const input = wrapper.find('input')
    await input.setValue('  SUP123  ')

    const vm = wrapper.vm as unknown as { save: () => Promise<void> }
    await vm.save()

    expect(wrapper.emitted('save')![0]).toEqual([{ casSupplierNumber: 'SUP123' }])
  })

  it('should populate input with currentValue when opened', async () => {
    const wrapper = createWrapper({ open: false, currentValue: 'existing@email.com' })

    await wrapper.setProps({ open: true })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.inputValue).toBe('existing@email.com')
  })

  it('should clear input when dialog is closed', async () => {
    const wrapper = createWrapper({ open: true })
    wrapper.vm.inputValue = 'test@example.com'

    await wrapper.setProps({ open: false })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.inputValue).toBe('')
  })

  it('should expose onSaveComplete method', () => {
    const wrapper = createWrapper()
    expect(typeof wrapper.vm.onSaveComplete).toBe('function')
  })

  it('should reset saving state and close dialog on onSaveComplete', () => {
    const wrapper = createWrapper()
    wrapper.vm.isSaving = true

    wrapper.vm.onSaveComplete()

    expect(wrapper.vm.isSaving).toBe(false)
    expect(wrapper.emitted('update:open')).toBeTruthy()
  })

  it('should not save when canSave is false', async () => {
    const wrapper = createWrapper({ type: 'EMAIL' })
    wrapper.vm.inputValue = ''

    const vm = wrapper.vm as unknown as { save: () => Promise<void> }
    await vm.save()

    expect(wrapper.emitted('save')).toBeFalsy()
  })

  it('should handle empty type gracefully', () => {
    const wrapper = createWrapper({ type: '' as never })
    const vm = wrapper.vm as unknown as {
      dialogConfig: { value: { title: string } }
    }

    expect(vm.dialogConfig.title).toBe('')
  })
})
