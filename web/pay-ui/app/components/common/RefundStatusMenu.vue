<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { ChequeRefundStatus } from '~/utils/constants'

const { t } = useI18n()

const emit = defineEmits<{
  select: [status: string]
}>()

const items = computed<DropdownMenuItem[]>(() => {
  return ChequeRefundStatus
    .filter(status => status.display)
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
        class="text-primary hover:text-primary-dark"
        v-bind="$attrs"
      />
    </template>
  </UDropdownMenu>
</template>

