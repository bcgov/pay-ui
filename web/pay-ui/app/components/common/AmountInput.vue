<script setup lang="ts">
// Same as ConnectInput but without v-maska: maska re-assigns the value on every keystroke, which on a number
// input drops a trailing "." (so cents can't be typed) and moves the cursor to the start.
const model = defineModel<string | number>({ required: true })

defineProps<{
  id: string
  label: string
}>()
</script>

<template>
  <UInput
    :id
    v-model="model"
    type="number"
    :data-testid="id"
    placeholder="&nbsp;"
    class="w-full grow"
  >
    <label
      :for="id"
      class="floating-label-input"
    >
      {{ label }}
    </label>
  </UInput>
</template>
