<script setup lang="ts">
/**
 * The Back / Cancel / Confirm and Pay button stack that sits under the
 * Fee Summary card. Renders the red "Please complete required information"
 * hint below the primary CTA when `canSubmit` is false and we're not mid-submit.
 */
defineProps<{
  canSubmit: boolean
  isSubmitting: boolean
}>()

defineEmits<{
  (e: 'back'): void
  (e: 'cancel'): void
  (e: 'submit'): void
}>()
</script>

<template>
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-3">
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1 rounded-md border border-[#1A5A96] bg-white px-4 py-2.5 text-sm font-semibold text-[#1A5A96] transition hover:bg-blue-50"
        @click="$emit('back')"
      >
        <UIcon name="i-mdi-chevron-left" class="size-4" />
        {{ $t('page.checkout.back') }}
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-md border border-[#1A5A96] bg-white px-4 py-2.5 text-sm font-semibold text-[#1A5A96] transition hover:bg-blue-50"
        @click="$emit('cancel')"
      >
        {{ $t('page.checkout.cancel') }}
      </button>
    </div>

    <button
      type="button"
      class="flex w-full items-center justify-center gap-2 rounded-md bg-[#1A5A96] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#124372] disabled:opacity-60"
      :disabled="!canSubmit"
      @click="$emit('submit')"
    >
      {{ isSubmitting ? $t('page.checkout.processing') : $t('page.checkout.confirmAndPay') }}
      <UIcon name="i-mdi-chevron-right" class="size-4" />
    </button>

    <p v-if="!canSubmit && !isSubmitting" class="text-sm text-red-600">
      &lt; {{ $t('page.checkout.completeRequired') }}
    </p>
  </div>
</template>
