<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const modal = usePayModals()

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

    <HelloWorld />

    <div class="flex gap-10">
      <UButton
        label="Go to Protected"
        :to="localePath('/protected')"
      />
      <UButton
        label="Open example modal"
        @click="modal.openExampleModal(
          'Title Here',
          'Description Text',
          false,
          [
            { label: 'Close', shouldClose: true },
            { label: 'Alert',
              onClick: () => {
                useToast().add({ title: 'Toast Title' })
              }
            }
          ]
        )"
      />
    </div>
  </div>
</template>
