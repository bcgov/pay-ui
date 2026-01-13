<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'
import { DateTime } from 'luxon'

const model = defineModel<string | null>({
  default: null,
  required: true
})

defineProps<{
  hasError?: boolean
}>()

const emit = defineEmits<{
  blur: []
}>()

const open = ref(false)

const localModel = computed({
  get() {
    if (model.value) {
      const dt = DateTime.fromISO(model.value)
      return new CalendarDate(dt.year, dt.month, dt.day)
    }
    return undefined
  },
  set(v) {
    if (v) {
      model.value = DateTime.fromObject({
        year: v.year,
        month: v.month,
        day: v.day
      }).toISODate()
    } else {
      model.value = null
    }
  }
})

watch(open, (v) => {
  if (!v) {
    emit('blur')
  }
})
</script>

<template>
  <UPopover v-model:open="open">
    <UButton
      v-bind="$attrs"
      color="neutral"
      variant="subtle"
      trailing-icon="i-mdi-calendar"
      :class="[
        'focus:outline-none focus-visible:outline-none ring-transparent focus-visible:ring-none',
        'focus-visible:shadow-input-focus ring-0 shadow-input rounded-b-none',
        'w-full justify-between px-2.5 py-3.5 bg-shade h-14 hover:!bg-shade',
        open ? 'shadow-input-focus' : '',
        hasError ? 'shadow-input-error' : ''
      ]"
      :ui="{
        base: 'px-[19px]',
        trailingIcon: hasError
          ? 'text-error'
          : open
            ? 'text-primary'
            : ''
      }"
    >
      <template #default>
        <span v-if="localModel" class="text-neutral text-base">{{ localModel.toString() }}</span>
        <span
          v-else
          :class="hasError ? 'text-error text-base' : 'text-neutral text-base'"
        >
          {{ $t('label.selectDate') }}
        </span>
      </template>
    </UButton>

    <template #content>
      <UCalendar
        v-model="localModel"
        class="p-2"
        v-bind="$attrs"
        @update:model-value="open = false"
      />
    </template>
  </UPopover>
</template>
