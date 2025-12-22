<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import type { CalendarDate } from '@internationalized/date'
import { DateTime } from 'luxon'
import CommonUtils from '@/utils/common-util'

const { t } = useI18n()

interface Props {
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: undefined
})

const emit = defineEmits<{ (e: 'change', value: { startDate: string | null, endDate: string | null }): void }>()

// defineModel replaces modelValue & update:modelValue
// can use v-model in parent as normal
// https://vuejs.org/api/sfc-script-setup.html#definemodel
const model = defineModel<{ startDate: string | null, endDate: string | null }>({
  default: {
    startDate: null,
    endDate: null
  },
  required: true
})

const localModel = shallowRef<{ start: CalendarDate | undefined, end: CalendarDate | undefined }>({
  start: undefined,
  end: undefined
})

const open = ref(false)

const config = [
  {
    code: DATEFILTER_CODES.TODAY,
    label: t(`enum.DATEFILTER_CODES.${DATEFILTER_CODES.TODAY}`),
    getRange: getTodayRange
  },
  {
    code: DATEFILTER_CODES.YESTERDAY,
    label: t(`enum.DATEFILTER_CODES.${DATEFILTER_CODES.YESTERDAY}`),
    getRange: getYesterdayRange
  },
  {
    code: DATEFILTER_CODES.LASTWEEK,
    label: t(`enum.DATEFILTER_CODES.${DATEFILTER_CODES.LASTWEEK}`),
    getRange: getLastWeekRange
  },
  {
    code: DATEFILTER_CODES.LASTMONTH,
    label: t(`enum.DATEFILTER_CODES.${DATEFILTER_CODES.LASTMONTH}`),
    getRange: getLastMonthRange
  },
  {
    code: DATEFILTER_CODES.CUSTOMRANGE,
    label: t(`enum.DATEFILTER_CODES.${DATEFILTER_CODES.CUSTOMRANGE}`),
    getRange: resetRange
  }
]

function resetRange() {
  return { start: undefined, end: undefined }
}

// take local CalendarDate, convert to iso date and set v-model, close popover
function applyDateRange() {
  if (!localModel.value.start || !localModel.value.end) {
    return
  }
  const startDate = localModel.value.start.toString()
  const endDate = localModel.value.end.toString()
  model.value = { startDate, endDate }
  emit('change', model.value)
  open.value = false
}

function cancel() {
  localModel.value = resetRange()
  open.value = false
}

function clearDateRange() {
  model.value = { startDate: null, endDate: null }
  localModel.value = resetRange()
  emit('change', model.value)
}

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

function syncLocalStateToVModel() {
  if (model.value.startDate && model.value.endDate) {
    localModel.value = {
      start: luxonToCalendarDate(DateTime.fromISO(model.value.startDate, { zone: 'America/Vancouver' })),
      end: luxonToCalendarDate(DateTime.fromISO(model.value.endDate, { zone: 'America/Vancouver' }))
    }
  } else {
    localModel.value = resetRange()
  }
}

// manages range option styling
const activeFilterCode = computed(() => getFilterCodeForRange(localModel.value))

const ranges = computed<ButtonProps[]>(() =>
  config.map(c => ({
    label: c.label,
    onClick: () => {
      localModel.value = c.getRange()
    },
    class: activeFilterCode.value === c.code ? 'text-primary bg-shade-highlighted' : ''
  }))
)

const triggerButtonLabel = computed(() => {
  if (model.value.startDate && model.value.endDate) {
    const startDate = CommonUtils.formatDisplayDate(model.value.startDate, 'yyyy-MM-dd')
    const endDate = CommonUtils.formatDisplayDate(model.value.endDate, 'yyyy-MM-dd')
    return `${startDate} - ${endDate}`
  }
  return ''
})

const popoverRangeDisplay = computed(() => {
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
  syncLocalStateToVModel()
}, { immediate: true })
</script>

<template>
  <UPopover
    v-model:open="open"
    @update:open="syncLocalStateToVModel"
  >
    <div class="relative flex items-center w-full">
      <UButton
        color="neutral"
        variant="subtle"
        trailing-icon="i-mdi-calendar"
        :class="[
          'focus:outline-none focus-visible:outline-none ring-transparent focus-visible:ring-none',
          'focus-visible:shadow-input-focus ring-0 shadow-input rounded-b-none',
          'date-range-filter-button flex-1',
          open ? 'shadow-input-focus' : ''
        ]"
        :ui="{ trailingIcon: open ? 'text-primary' : '' }"
      >
        <template #default>
          <span v-if="triggerButtonLabel" class="flex-1 text-left pr-8">{{ triggerButtonLabel }}</span>
          <span v-else class="date-range-placeholder">{{ props.placeholder || $t('label.date') }}</span>
        </template>
      </UButton>
      <button
        v-if="model.startDate && model.endDate"
        type="button"
        class="absolute right-14 z-10 h-10 w-10 min-w-0 p-0 flex items-center justify-center
        text-primary focus:outline-none cursor-pointer"
        style="pointer-events: auto;"
        @click.stop="clearDateRange"
      >
        <UIcon name="i-mdi-close" class="h-6 w-6" />
      </button>
    </div>

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
            :value="popoverRangeDisplay"
          />
          <div class="bg-line w-full h-[0.5px]" />
          <UCalendar
            id="date-range-calendar"
            v-model="localModel"
            name="date-range-calendar"
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

<style scoped>
.date-range-placeholder {
  font-size: 12.25px;
}

:deep(.date-range-filter-button) {
  padding-left: 12px;
  padding-right: 12px;
}
</style>
