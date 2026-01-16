<script setup lang="ts">
import { UI_CONSTANTS } from '@/utils/constants'

const {
  icon = 'i-mdi-information-outline',
  iconClass = 'text-primary shrink-0 size-6'
} = defineProps<{
  icon?: string
  iconClass?: string
  text?: string
}>()
</script>

<template>
  <UTooltip
    arrow
    :text
    :delay-duration="UI_CONSTANTS.TOOLTIP_DELAY_MS"
  >
    <UIcon
      :name="icon"
      :class="iconClass"
    />

    <template #content>
      <slot />
    </template>
  </UTooltip>
</template>
