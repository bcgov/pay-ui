<script setup lang="ts">
interface Props {
  open: boolean
  type: 'CAS_SUPPLIER_NUMBER' | 'CAS_SUPPLIER_SITE' | 'EMAIL' | ''
  currentValue?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'save': [data: { casSupplierNumber?: string, casSupplierSite?: string, email?: string }]
}>()

const inputValue = ref('')
const isSaving = ref(false)

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

const dialogConfig = computed(() => {
  switch (props.type) {
    case 'CAS_SUPPLIER_NUMBER':
      return {
        title: 'CAS Supplier Number',
        description: 'Enter the supplier number created in CAS for this short name',
        placeholder: 'CAS Supplier Number',
        fieldKey: 'casSupplierNumber' as const
      }
    case 'CAS_SUPPLIER_SITE':
      return {
        title: 'CAS Supplier Site',
        description: 'Enter the supplier site created in CAS for this short name',
        placeholder: 'CAS Supplier Site',
        fieldKey: 'casSupplierSite' as const
      }
    case 'EMAIL':
      return {
        title: 'Email',
        description: "Enter the contact email provided in the client's Direct Deposit Application form",
        placeholder: 'Email Address',
        fieldKey: 'email' as const
      }
    default:
      return {
        title: '',
        description: '',
        placeholder: '',
        fieldKey: 'email' as const
      }
  }
})

const isEmailValid = computed(() => {
  if (props.type !== 'EMAIL') { return true }
  if (!inputValue.value) { return true }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(inputValue.value)
})

const canSave = computed(() => {
  if (!inputValue.value.trim()) { return false }
  if (props.type === 'EMAIL' && !isEmailValid.value) { return false }
  return true
})

function closeDialog() {
  isOpen.value = false
  inputValue.value = ''
}

async function save() {
  if (!canSave.value) { return }

  isSaving.value = true
  const data = { [dialogConfig.value.fieldKey]: inputValue.value.trim() }
  emit('save', data)
}

function onSaveComplete() {
  isSaving.value = false
  closeDialog()
}

watch(() => props.open, (open) => {
  if (open) {
    inputValue.value = props.currentValue || ''
  } else {
    inputValue.value = ''
    isSaving.value = false
  }
})

defineExpose({ onSaveComplete })
</script>

<template>
  <UModal v-model:open="isOpen" :ui="{ content: 'sm:max-w-[500px]' }">
    <template #header>
      <div class="flex items-center justify-between w-full pr-2">
        <h2 class="text-xl font-bold text-gray-900">
          {{ dialogConfig.title }}
        </h2>
        <UButton
          icon="i-mdi-close"
          color="primary"
          variant="ghost"
          size="lg"
          @click.stop="closeDialog"
        />
      </div>
    </template>

    <template #body>
      <div class="space-y-4 py-2">
        <p class="text-gray-600">
          {{ dialogConfig.description }}
        </p>
        <UInput
          v-model="inputValue"
          :placeholder="dialogConfig.placeholder"
          size="lg"
          class="w-full"
          :type="type === 'EMAIL' ? 'email' : 'text'"
          :color="type === 'EMAIL' && inputValue && !isEmailValid ? 'error' : undefined"
        />
        <p v-if="type === 'EMAIL' && inputValue && !isEmailValid" class="text-red-500 text-sm">
          Please enter a valid email address
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-center gap-3 w-full py-2">
        <UButton
          label="Cancel"
          color="primary"
          variant="outline"
          size="lg"
          class="min-w-[100px]"
          @click.stop="closeDialog"
        />
        <UButton
          label="Save"
          color="primary"
          size="lg"
          class="min-w-[100px]"
          :loading="isSaving"
          :disabled="!canSave"
          @click="save"
        />
      </div>
    </template>
  </UModal>
</template>
