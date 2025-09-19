<script setup lang="ts">
const { t } = useI18n()

definePageMeta({
  layout: 'connect-auth'
})

useHead({
  title: t('page.home.title')
})
</script>

<template>
  <div class="py-10">
    <h1>{{ $t('page.home.h1') }}</h1>
  </div>
</template>
