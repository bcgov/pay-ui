<script setup lang="ts">
// Shown only when the payment link carried a returnUrl (pay-api validates it against its allow-list).
const store = usePaymentLinkStore()
</script>

<template>
  <UButton
    v-if="store.returnUrl"
    color="primary"
    variant="outline"
    size="lg"
    block
    :label="$t('page.success.return')"
    @click="navigateTo(store.returnUrl, { external: true })"
  />
</template>
