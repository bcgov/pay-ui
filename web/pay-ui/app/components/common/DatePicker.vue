<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'
import { DateTime } from 'luxon'

const model = defineModel<string | null>({
  default: null,
  required: true
})

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
</script>

<template>
  <UPopover
    v-model:open="open"
  >
    <UButton
      color="neutral"
      variant="subtle"
      trailing-icon="i-mdi-calendar"
      :class="[
        'focus:outline-none focus-visible:outline-none ring-transparent focus-visible:ring-none',
        'focus-visible:shadow-input-focus ring-0 shadow-input rounded-b-none',
        open ? 'shadow-input-focus' : ''
      ]"
      :ui="{ trailingIcon: open ? 'text-primary' : '' }"
    >
      <template #default>
        <span v-if="localModel">{{ localModel.toString() }}</span>
        <span v-else>{{ $t('label.selectDate') }}</span>
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
