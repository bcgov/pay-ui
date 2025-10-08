<script setup lang="ts">
import type { NuxtError } from '#app'

const { t, te } = useI18n()
const localePath = useLocalePath()
// cant use definePageMeta in error.vue
useRoute().meta.hideBreadcrumbs = true

const props = defineProps<{
  error: NuxtError
}>()

const content = computed(() => {
  const status = getErrorStatus(props.error)
  const isForbidden = status === 403

  function getT(key: 'h1' | 'text') {
    const statusKey = `page.error.${status}.${key}`
    const fallbackKey = `page.error.undefined.${key}`
    return te(statusKey) ? t(statusKey) : t(fallbackKey)
  }

  return {
    h1: getT('h1'),
    text: getT('text'),
    icon: isForbidden ? 'i-mdi-lock-outline' : 'i-mdi-alert-circle-outline',
    iconClass: isForbidden ? '' : 'text-error',
    isForbidden
  }
})

onMounted(() => {
  console.error('Application Error: ', {
    name: props.error?.name || '',
    cause: props.error?.cause || '',
    message: props.error?.message || '',
    statusCode: props.error?.statusCode || '',
    statusMessage: props.error?.statusMessage || '',
    stack: props.error?.stack || '',
    data: props.error?.data || ''
  })
})
</script>

<template>
  <UApp :toaster="{ position: 'bottom-center' }">
    <NuxtLayout name="connect-auth">
      <div class="m-auto flex flex-col items-center gap-4">
        <UIcon
          :name="content.icon"
          class="size-10 shrink-0"
          :class="content.iconClass"
        />
        <h1>{{ content.h1 }}</h1>
        <p>{{ content.text }}</p>
        <div class="flex gap-4">
          <UButton
            :label="$t('connect.label.goHome')"
            icon="i-mdi-home"
            size="xl"
            :to="localePath('/home')"
          />
          <UButton
            v-if="content.isForbidden"
            :label="$t('label.contactSupport')"
            size="xl"
            href="mailto:SBC_ITOperationsSupport@gov.bc.ca?subject=FAS Support"
            target="_blank"
          />
        </div>
      </div>
    </NuxtLayout>
  </UApp>
</template>
