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
    <UButton
      block
      size="lg"
      color="primary"
      :label="isSubmitting ? $t('page.checkout.processing') : $t('page.checkout.confirmAndPay')"
      trailing-icon="i-mdi-chevron-right"
      :disabled="!canSubmit"
      :loading="isSubmitting"
      @click="$emit('submit')"
    />

    <p v-if="!canSubmit && !isSubmitting" class="text-sm text-red-600">
      &lt; {{ $t('page.checkout.completeRequired') }}
    </p>
  </div>
</template>
