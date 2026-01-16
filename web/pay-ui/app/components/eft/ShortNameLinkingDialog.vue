<script setup lang="ts">
import type { EFTShortnameResponse } from '@/interfaces/eft-short-name'
import CommonUtils from '@/utils/common-util'
import ShortNameUtils from '@/utils/short-name-util'
import { useShortNameLinking } from '@/composables/eft/useShortNameLinking'
import type { EftAccount } from '@/composables/eft/useShortNameLinking'

interface Props {
  shortName: EFTShortnameResponse | null
  open: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [open: boolean]
  'link-account': [account: unknown]
}>()

const { getStatementId, linkShortNameToAccount, isAlreadyMappedError } = useShortNameLinking()

const shortNameLookupRef = ref<{ clearSelection: () => void } | null>(null)
const selectedAccount = ref<EftAccount | null>(null)
const statementId = ref<number | null>(null)
const isLinking = ref(false)

const errorDialogOpen = ref(false)
const errorDialogTitle = ref('')
const errorDialogText = ref('')

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

const shortNameTypeDescription = computed(() => {
  return ShortNameUtils.getShortNameTypeDescription(props.shortName?.shortNameType || '')
})

const isAmountMismatch = computed(() => {
  if (!selectedAccount.value || !props.shortName) { return false }
  return props.shortName.creditsRemaining !== selectedAccount.value.totalDue
})

function onAccountSelected(account: EftAccount | null) {
  selectedAccount.value = account
  if (account?.accountId) {
    getStatementId(account.accountId).then((id) => {
      statementId.value = id
    })
  } else {
    statementId.value = null
  }
}

function resetDialog() {
  selectedAccount.value = null
  statementId.value = null
  shortNameLookupRef.value?.clearSelection()
}

function closeDialog() {
  isOpen.value = false
  resetDialog()
}

async function linkAccount() {
  if (!props.shortName?.id || !selectedAccount.value?.accountId) {
    return
  }

  isLinking.value = true
  const result = await linkShortNameToAccount(props.shortName.id, selectedAccount.value.accountId)

  if (result.success) {
    emit('link-account', result.data)
    closeDialog()
  } else {
    if (isAlreadyMappedError(result.errorType)) {
      errorDialogTitle.value = 'Account Already Linked'
      errorDialogText.value = 'The selected account is already linked to a bank short name.'
    } else {
      errorDialogTitle.value = 'Something Went Wrong'
      errorDialogText.value = 'An error occurred while linking the bank short name to an account.'
    }
    closeDialog()
    errorDialogOpen.value = true
  }
  isLinking.value = false
}

watch(() => props.open, (open) => {
  if (!open) {
    resetDialog()
  }
})
</script>

<template>
  <div>
    <UModal v-model:open="isOpen" :ui="{ content: 'sm:max-w-[700px] sm:w-[700px]', body: 'overflow-visible' }">
      <template #header>
        <div class="flex items-center justify-between w-full pr-2">
          <h2 class="text-xl font-bold text-gray-900">
            Linking {{ shortName?.shortName }} to an Account
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
        <div class="space-y-4 py-2 overflow-visible relative z-10">
          <div>
            <p class="text-gray-700">
              Short Name Type: {{ shortNameTypeDescription }}
            </p>
            <p class="text-gray-600">
              After the account has been linked, payment will be applied at 6:00 p.m. Pacific Time.
            </p>
          </div>

          <div class="pt-2">
            <h4 class="font-semibold mb-3 text-gray-900">
              Search by Account ID or Name to Link:
            </h4>
            <ShortNameLookup
              ref="shortNameLookupRef"
              @account="onAccountSelected"
              @reset="resetDialog"
            />
          </div>

          <div v-if="selectedAccount?.accountId" class="mt-6">
            <h4 class="font-semibold mb-4">
              Payment Information
            </h4>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span>Unsettled amount from the short name:</span>
                <span class="font-semibold">{{ CommonUtils.formatAmount(shortName?.creditsRemaining) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Amount owing on the selected account (Statement #{{ statementId || '-' }}):</span>
                <span class="font-semibold">{{ CommonUtils.formatAmount(selectedAccount.totalDue) }}</span>
              </div>
            </div>
          </div>

          <div
            v-if="selectedAccount?.accountId && isAmountMismatch"
            class="mt-4 p-4 bg-amber-50 border-2 border-amber-400 rounded"
          >
            <p class="text-gray-700 text-sm">
              <span class="font-semibold">Important:</span>
              The unsettled amount from the short name does not match with the amount owing on the account.
              This could result in over or under payment settlement.
              Please make sure you have selected the correct account to link.
            </p>
          </div>
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
            label="Link Account"
            color="primary"
            size="lg"
            class="min-w-[140px]"
            :loading="isLinking"
            :disabled="!selectedAccount?.accountId"
            @click="linkAccount"
          />
        </div>
      </template>
    </UModal>

    <UModal v-model:open="errorDialogOpen" :ui="{ width: 'max-w-md' }">
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon name="i-mdi-alert-circle-outline" class="text-red-500 size-6" />
          <h2 class="text-xl font-semibold">
            {{ errorDialogTitle }}
          </h2>
        </div>
      </template>

      <template #body>
        <p class="text-gray-700">
          {{ errorDialogText }}
        </p>
      </template>

      <template #footer>
        <div class="flex justify-center w-full">
          <UButton
            label="Close"
            color="primary"
            @click="errorDialogOpen = false"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
