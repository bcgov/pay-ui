<script setup lang="ts">
/**
 * Read-only bank details panel shown inside the PAD radio card once a PAD-
 * enabled account is selected. Emits `edit` when the pencil button is clicked
 * — the parent swaps in the PadInfoWidget in edit mode.
 */
import type { AccountCfsInfo } from '../../stores/paymentLink'

defineProps<{
  cfsAccount?: AccountCfsInfo
  canEdit?: boolean
}>()

defineEmits<{
  (e: 'edit'): void
}>()
</script>

<template>
  <div class="border-t border-slate-200 px-5 py-4">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <p class="text-sm font-semibold text-slate-900">
          {{ $t('page.checkout.pad.bankingInformation') }}
        </p>
        <UPopover :content="{ side: 'top' }" arrow>
          <UButton
            variant="link"
            color="primary"
            size="sm"
            icon="i-mdi-help-circle-outline"
            class="p-0"
            :aria-label="$t('page.checkout.pad.bankingInfoHelp')"
          />
          <template #content>
            <p class="max-w-xs p-3 text-sm text-neutral">
              {{ $t('page.checkout.pad.bankingInfoHelp') }}
            </p>
          </template>
        </UPopover>
      </div>
      <UButton
        v-if="canEdit"
        variant="link"
        color="primary"
        icon="i-mdi-pencil"
        size="sm"
        :padded="false"
        :label="$t('page.checkout.pad.edit')"
        @click="$emit('edit')"
      />
    </div>
    <dl
      v-if="cfsAccount?.bankTransitNumber || cfsAccount?.bankInstitutionNumber || cfsAccount?.bankAccountNumber"
      class="mt-3 space-y-1 text-sm text-slate-700"
    >
      <div>
        <dt class="inline font-semibold text-slate-900">
          {{ $t('padWidget.transit') }}:
        </dt>
        <dd class="ml-1 inline">
          {{ cfsAccount?.bankTransitNumber }}
        </dd>
      </div>
      <div>
        <dt class="inline font-semibold text-slate-900">
          {{ $t('padWidget.institution') }}:
        </dt>
        <dd class="ml-1 inline">
          {{ cfsAccount?.bankInstitutionNumber }}
        </dd>
      </div>
      <div>
        <dt class="inline font-semibold text-slate-900">
          {{ $t('padWidget.account') }}:
        </dt>
        <dd class="ml-1 inline">
          {{ cfsAccount?.bankAccountNumber }}
        </dd>
      </div>
    </dl>
  </div>
</template>
