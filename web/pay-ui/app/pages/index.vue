<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

definePageMeta({
  layout: 'connect-auth'
})

useHead({
  title: t('page.home.title')
})

setBreadcrumbs([
  { label: 'Pay UI' }
])
</script>

<template>
  <div class="py-10 space-y-10">
    <h1>{{ $t('page.home.h1') }}</h1>
    <UButton
      label="Go to Protected"
      :to="localePath('/protected')"
    />
  </div>
</template>
