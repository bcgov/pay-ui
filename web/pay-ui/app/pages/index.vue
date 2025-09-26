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

const dateRange = shallowRef({ start: null, end: null })

function resetDateRange() {
  dateRange.value = { start: null, end: null }
}
</script>

<template>
  <div class="py-10 space-y-10">
    <h1>{{ $t('page.home.h1') }}</h1>

    {{ dateRange }}

    <DateRangeFilter v-model="dateRange" />

    <div class="flex gap-10">
      <UButton
        label="reset"
        @click="resetDateRange"
      />
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
