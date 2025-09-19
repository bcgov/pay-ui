<script setup lang="ts">
const { t } = useI18n()
const accountStore = useConnectAccountStore()
const localePath = useLocalePath()

definePageMeta({
  layout: 'connect-auth',
  middleware: ['mock-connect-auth', 'connect-auth']
})

useHead({
  title: t('page.protected.title')
})

setBreadcrumbs([
  { label: 'Home', to: localePath('/') },
  { label: 'Protected' }
])
</script>

<template>
  <div class="py-10 space-y-10">
    <h1>{{ $t('page.protected.h1') }}</h1>
    <p>Hello {{ accountStore.currentAccount.label }}</p>
    <p>{{ $t('connect.validation.maxChars', { count: 50 }) }}</p>
  </div>
</template>
