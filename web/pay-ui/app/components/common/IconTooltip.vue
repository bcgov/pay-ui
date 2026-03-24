<script setup lang="ts">
import { UI_CONSTANTS } from '@/utils/constants'

const {
  icon = 'i-mdi-information-outline',
  iconClass = 'text-primary shrink-0 size-6 cursor-pointer',
  iconStyle = {},
  maxWidth = '300px',
  side = 'top'
} = defineProps<{
  icon?: string
  iconClass?: string
  iconStyle?: Record<string, string>
  maxWidth?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  text?: string
}>()
</script>

<template>
  <UTooltip
    :arrow="{ width: 20, height: 10 }"
    :text
    :content="{ side }"
    :delay-duration="UI_CONSTANTS.TOOLTIP_DELAY_MS"
    :ui="{
      content: '!bg-[rgba(73,80,87,0.95)] !text-white !h-auto !rounded px-3 py-2 text-sm text-center',
      arrow: '!fill-[rgba(73,80,87,0.95)]'
    }"
  >
    <UIcon
      :name="icon"
      :class="iconClass"
      :style="iconStyle"
    />

    <template #content>
      <div :style="{ maxWidth }">
        <slot>
          <div v-if="text" v-sanitize="text" />
        </slot>
      </div>
    </template>
  </UTooltip>
</template>
