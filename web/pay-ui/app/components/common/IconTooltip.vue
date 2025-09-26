<script setup lang="ts">
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
    :delay-duration="300"
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
