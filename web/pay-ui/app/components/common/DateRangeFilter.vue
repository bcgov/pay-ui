<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import { CalendarDate } from '@internationalized/date'
import { DateTime } from 'luxon'

const { t } = useI18n()

// v-model state
const model = defineModel<{ start: string | null, end: string | null }>({
  default: {
    start: null,
    end: null
  },
  required: true
})

// local state
const localModel = shallowRef<{ start: CalendarDate | undefined, end: CalendarDate | undefined }>({
  start: undefined,
  end: undefined
})

// control open state - after clicking 'apply'
const open = ref(false)

const config = [
  {
    code: DATEFILTER_CODES.TODAY,
    label: t(`enum.DATEFILTER_CODES.${DATEFILTER_CODES.TODAY}`),
    getRange: getToday
  },
  {
    code: DATEFILTER_CODES.YESTERDAY,
    label: t(`enum.DATEFILTER_CODES.${DATEFILTER_CODES.YESTERDAY}`),
    getRange: getYesterday
  },
  {
    code: DATEFILTER_CODES.LASTWEEK,
    label: t(`enum.DATEFILTER_CODES.${DATEFILTER_CODES.LASTWEEK}`),
    getRange: getLastWeek
  },
  {
    code: DATEFILTER_CODES.LASTMONTH,
    label: t(`enum.DATEFILTER_CODES.${DATEFILTER_CODES.LASTMONTH}`),
    getRange: getLastMonth
  },
  {
    code: DATEFILTER_CODES.CUSTOMRANGE,
    label: t(`enum.DATEFILTER_CODES.${DATEFILTER_CODES.CUSTOMRANGE}`),
    getRange: resetRange
  }
]

function luxonToCalendarDate(date: DateTime): CalendarDate {
  return new CalendarDate(date.year, date.month, date.day)
}

function getToday() {
  const today = new Date()
  const date = new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
  return { start: date, end: date }
}

function getYesterday() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const date = new CalendarDate(yesterday.getFullYear(), yesterday.getMonth() + 1, yesterday.getDate())
  return { start: date, end: date }
}

function getLastWeek() {
  const now = DateTime.now().setZone('America/Vancouver')
  const weekStart = now.minus({ weeks: 1 }).startOf('week')
  const weekEnd = now.minus({ weeks: 1 }).endOf('week')

  return {
    start: luxonToCalendarDate(weekStart),
    end: luxonToCalendarDate(weekEnd)
  }
}

function getLastMonth() {
  const now = DateTime.now().setZone('America/Vancouver')
  const monthStart = now.minus({ months: 1 }).startOf('month')
  const monthEnd = now.minus({ months: 1 }).endOf('month')

  return {
    start: luxonToCalendarDate(monthStart),
    end: luxonToCalendarDate(monthEnd)
  }
}

function resetRange() {
  return { start: undefined, end: undefined }
}

// take local CalendarDate, convert to iso date and set v-model, close popover
function applyDateRange() {
  if (!localModel.value.start || !localModel.value.end) {
    return
  }
  const start = localModel.value.start.toString()
  const end = localModel.value.end.toString()
  model.value = { start, end }
  open.value = false
}

function cancel() {
  localModel.value = resetRange()
  open.value = false
}

// find the filter code in the config array or return custom range
function getFilterCodeForRange(range?: { start?: CalendarDate, end?: CalendarDate }): string | undefined {
  if (!range?.start || !range?.end) {
    return DATEFILTER_CODES.CUSTOMRANGE
  }
  const startStr = range.start.toString()
  const endStr = range.end.toString()

  const matchedRange = config.find((c) => {
    const r = c.getRange()
    if (r.start && r.end) { // custom range sets to undefined
      return startStr === r.start.toString() && endStr === r.end.toString()
    }
    return false
  })
  return matchedRange?.code || DATEFILTER_CODES.CUSTOMRANGE
}

// sync v-model and localModel state
function syncState() {
  if (model.value.start && model.value.end) {
    localModel.value = {
      start: luxonToCalendarDate(DateTime.fromISO(model.value.start, { zone: 'America/Vancouver' })),
      end: luxonToCalendarDate(DateTime.fromISO(model.value.end, { zone: 'America/Vancouver' }))
    }
  } else {
    localModel.value = resetRange()
  }
}

// manages range option styling
const activeFilterCode = computed(() => getFilterCodeForRange(localModel.value))

// range filter options
const ranges = computed<ButtonProps[]>(() =>
  config.map(c => ({
    label: c.label,
    onClick: () => {
      localModel.value = c.getRange()
    },
    class: activeFilterCode.value === c.code ? 'text-primary bg-shade-highlighted' : ''
  }))
)

// trigger element/button date display
const modelDisplayDate = computed(() => {
  if (model.value.start && model.value.end) {
    return `${model.value.start} - ${model.value.end}`
  }
  return ''
})

// above calendar, inside popover date display
const localDisplayDate = computed(() => {
  const { start, end } = localModel.value
  const s = start?.toString()
  const e = end?.toString()

  if (s && e) {
    return `${s} - ${e}`
  }
  if (s) {
    return `${s} -`
  }
  return '-'
})

// sync localState to v-model when v-model changes - can set calendar date externally
watch(model, () => {
  syncState()
}, { immediate: true })
</script>

<template>
  <UPopover
    v-model:open="open"
    @update:open="syncState"
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
        <span v-if="modelDisplayDate">{{ modelDisplayDate }}</span>
        <span v-else>{{ $t('label.date') }}</span>
      </template>
    </UButton>

    <template #content>
      <div class="flex divide-x-1 divide-gray-400">
        <div class="flex flex-col justify-between py-4">
          <div class="flex flex-col">
            <UButton
              v-for="range in ranges"
              :key="range.label"
              v-bind="range"
              variant="ghost"
              :class="[
                'rounded-none py-4 font-bold text-neutral-highlighted',
                range.class
              ]"
            />
          </div>
          <div class="flex gap-4 px-4">
            <UButton
              :label="$t('label.apply')"
              :disabled="!localModel.start || !localModel.end"
              @click="applyDateRange"
            />
            <UButton
              :label="$t('label.cancel')"
              variant="outline"
              @click="cancel"
            />
          </div>
        </div>
        <div class="p-4 flex flex-col gap-4">
          <ConnectI18nHelper
            class="text-neutral-highlighted"
            translation-path="label.selectedDateRange"
            :name="$t(`enum.DATEFILTER_CODES.${activeFilterCode}`)"
            :value="localDisplayDate"
          />
          <div class="bg-line w-full h-[0.5px]" />
          <UCalendar
            v-model="localModel"
            class="p-2"
            range
            size="lg"
            :year-controls="false"
            :initial-focus="true"
          />
        </div>
      </div>
    </template>
  </UPopover>
</template>
