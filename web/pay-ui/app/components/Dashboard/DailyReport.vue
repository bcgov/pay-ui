<script setup lang="ts">
import { useDailyReport } from '@/composables/useDailyReport'
import { DateTime } from 'luxon'

const {
  selectedDate,
  getDailyReport,
  showCalendar,
  isDownloading,
  toggleCalendar
} = useDailyReport()

const localModel = computed({
  get() {
    if (selectedDate.value) {
      const dt = DateTime.fromISO(selectedDate.value)
      return luxonToCalendarDate(dt)
    }
    return undefined
  },
  set(v) {
    if (v) {
      selectedDate.value = DateTime.fromObject({
        year: v.year,
        month: v.month,
        day: v.day
      }).toISODate()
    } else {
      selectedDate.value = null
    }
  }
})

const maxDate = computed(() => {
  const yesterday = getToday().minus({ days: 1 })
  return luxonToCalendarDate(yesterday)
})

const formatSelectedDate = () => {
  if (selectedDate.value) {
    const dt = DateTime.fromISO(selectedDate.value)
    return dt.toFormat('EEE, MMM dd, yyyy')
  }
  return ''
}
</script>

<template>
  <div v-can:fas_reports.hide class="text-end daily-report">
    <UPopover v-model:open="showCalendar">
      <UButton
        label="Daily Report"
        trailing-icon="mdi-calendar"
      />

      <template #content>
        <UCard>
          <template #header>
            <span class="font-bold">
              Select Daily Report Date
            </span>
          </template>

          <div>
            <UCalendar
              v-model="localModel"
              :max-value="maxDate"
            />
            <div class="mt-4">
              <span>
                Selected Date:
                <span class="font-bold">{{ (formatSelectedDate()) }}</span>
              </span>
            </div>
          </div>

          <template #footer>
            <UButton
              label="Download Report"
              color="primary"
              class="font-bold"
              variant="ghost"
              :loading="isDownloading"
              data-test="btn-download-report"
              :disabled="!selectedDate"
              @click="getDailyReport"
            />
            <UButton
              label="Cancel"
              color="neutral"
              variant="ghost"
              data-test="btn-cancel"
              @click="toggleCalendar(false)"
            />
          </template>
        </UCard>
      </template>
    </UPopover>
  </div>
</template>

<style scoped>
.view-heade {
  flex-direction: colum;
}
</style>

<style>
.v-date-picker-title__date > div {
  font-size: 24px !important;
  font-weight: 700;
}
</style>
