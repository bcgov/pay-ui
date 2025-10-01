<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { t, te } = useI18n()

const props = defineProps<{
  allowedStatusList: SlipStatus[]
}>()

const emit = defineEmits<{
  select: [SlipStatus]
}>()

const items = computed<DropdownMenuItem[]>(() => {
  return props.allowedStatusList.reduce((a, status) => {
    const i18nKey = `enum.SlipStatus.${status}`
    if (te(i18nKey)) {
      a.push({
        onSelect: () => {
          emit('select', status)
        },
        label: t(i18nKey)
      })
    }
    return a
  }, [] as DropdownMenuItem[])
})
</script>

<template>
  <UDropdownMenu :items>
    <template #default="{ open }">
      <UButton
        leading-icon="i-mdi-pencil"
        :trailing-icon="open ? 'i-mdi-menu-up' : 'i-mdi-menu-down'"
        :label="$t('label.editStatus')"
        v-bind="$attrs"
      />
    </template>
  </UDropdownMenu>
</template>
