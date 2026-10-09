<script setup lang="ts">
// Shown only when the payment link carried an http(s) returnUrl.
const store = usePaymentLinkStore()
const url = computed(() => /^https?:\/\//i.test(store.invoice?.returnUrl ?? '') ? store.invoice?.returnUrl : undefined)
</script>

<template>
  <UButton
    v-if="url"
    color="primary"
    variant="outline"
    size="lg"
    block
    :label="$t('page.success.return')"
    @click="navigateTo(url, { external: true })"
  />
</template>
