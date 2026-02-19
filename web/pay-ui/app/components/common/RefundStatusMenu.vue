<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { ChequeRefundStatus, chequeRefundCodes } from '~/utils/constants'

const { t } = useI18n()

const props = defineProps<{
  currentRefundStatus?: string | null
}>()

const emit = defineEmits<{
  select: [status: string]
}>()

const items = computed<DropdownMenuItem[]>(() => {
  const currentStatus = props.currentRefundStatus
  let allowedCodes: string[] = []

  if (currentStatus === chequeRefundCodes.PROCESSED) {
    allowedCodes = [chequeRefundCodes.CHEQUE_UNCASHED, chequeRefundCodes.CHEQUE_UNDELIVERABLE]
  } else if (currentStatus === chequeRefundCodes.CHEQUE_UNCASHED) {
    allowedCodes = [chequeRefundCodes.PROCESSED]
  } else if (currentStatus === chequeRefundCodes.CHEQUE_UNDELIVERABLE) {
    allowedCodes = [chequeRefundCodes.PROCESSED]
  } else {
    allowedCodes = [
      chequeRefundCodes.CHEQUE_UNCASHED,
      chequeRefundCodes.CHEQUE_UNDELIVERABLE,
      chequeRefundCodes.PROCESSED
    ]
  }

  return ChequeRefundStatus
    .filter(status => status.display && allowedCodes.includes(status.code))
    .map(status => ({
      onSelect: () => {
        emit('select', status.code)
      },
      label: status.text
    }))
})
</script>

<template>
  <UDropdownMenu :items>
    <template #default="{ open }">
      <UButton
        variant="ghost"
        color="primary"
        :trailing-icon="open ? 'i-mdi-menu-up' : 'i-mdi-menu-down'"
        :label="t('label.updateStatus')"
        class="text-primary hover:text-primary-dark h-auto"
        v-bind="$attrs"
      />
    </template>
  </UDropdownMenu>
</template>
