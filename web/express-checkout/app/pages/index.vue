<script setup lang="ts">
const { t } = useI18n()

useHead({
  title: t('page.landing.title')
})
</script>

<template>
  <section class="mx-auto max-w-2xl px-6 py-16 text-center">
    <h1 class="text-2xl font-semibold">
      {{ $t('page.landing.h1') }}
    </h1>
    <p class="mt-4 text-gray-600">
      To make a payment, use the link you received from your service provider.
    </p>
  </section>
</template>
