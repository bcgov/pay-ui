<script setup lang="ts">
defineProps<{
  columns: string[]
}>()

const model = defineModel<string[]>({ required: true })
</script>

<template>
  <USelect
    v-model="model"
    :items="columns"
    multiple
    :aria-label="$t('label.columnsToShow')"
    :ui="{
      base: 'bg-white',
      item: 'text-neutral-highlighted data-highlighted:not-data-disabled:text-neutral-highlighted'
        + ' data-highlighted:not-data-disabled:before:bg-shade data-[state=checked]:text-neutral-highlighted'
        + ' data-[state=checked]:bg-transparent',
      content: 'min-w-fit',
      itemTrailingIcon: 'hidden'
    }"
  >
    <template #default>
      <span class="pl-4 pr-8">{{ $t('label.columnsToShow') }}</span>
    </template>
    <template #item-leading="{ item }">
      <UIcon
        :name="model.includes(item)
          ? 'i-mdi-checkbox-marked'
          : 'i-mdi-checkbox-blank-outline'
        "
        class="size-6 shrink-0"
        :class="model.includes(item)
          ? 'text-primary'
          : 'text-neutral-highlighted'
        "
      />
    </template>
  </USelect>
</template>
