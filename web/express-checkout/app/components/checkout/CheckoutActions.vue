<script setup lang="ts">
/**
 * The Confirm and Pay button that sits under the Fee Summary card. Renders
 * the red "Please complete required information" hint below when `canSubmit`
 * is false and we're not mid-submit.
 */
defineProps<{
  canSubmit: boolean
  isSubmitting: boolean
}>()

defineEmits<{
  (e: 'submit'): void
}>()
</script>

<template>
  <div class="space-y-4">
    <button
      type="button"
      class="flex w-full items-center justify-center gap-2 rounded-md bg-mark px-4 py-3 text-sm font-semibold text-white transition hover:bg-mark-dark disabled:opacity-60"
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
