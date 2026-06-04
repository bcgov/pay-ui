<script setup lang="ts">
import type { FilingType } from '@/interfaces/routing-slip'

const props = withDefaults(defineProps<{
  modelValue?: FilingType | null
  id?: string
  sortResults?: boolean
}>(), {
  modelValue: null,
  id: undefined,
  sortResults: false
})

const emit = defineEmits<{
  'update:modelValue': [value: FilingType | null]
  'input': []
}>()

const selected = computed({
  get: () => props.modelValue,
  set: (value: FilingType | null) => {
    emit('update:modelValue', value)
    emit('input')
  }
})

const payApi = usePayApi()
const searchFilingTypes = async (searchTerm: string | undefined): Promise<Array<FilingType & { label: string }>> => {
  if (!searchTerm) {
    return []
  }

  const trimmedTerm = searchTerm.trim()
  if (trimmedTerm.length < 3) {
    return []
  }

  try {
    // Global Exception handler will handle this one.
    const results = await payApi.getSearchFilingType(trimmedTerm)
    const mapped = results.map((item: FilingType) => {
      const corpDesc = item.corpTypeCode?.description
      return {
        ...item,
        label: corpDesc ? `${item.filingTypeCode?.description} - ${corpDesc}` : (item.filingTypeCode?.description ?? '')
      }
    })
    return props.sortResults ? mapped.sort((a, b) => a.label.localeCompare(b.label)) : mapped
  } catch (error) {
    console.error('Error searching filing types:', error)
    return []
  }
}
</script>

<template>
  <div class="w-full">
    <AsyncAutoComplete
      :id="id"
      v-model="selected"
      label="Filing Type Name"
      :query-fn="searchFilingTypes"
      data-test="input-filing-type"
      v-bind="$attrs"
    >
      <template #item="{ item }">
        <div class="filing-details">
          <span>{{ item.filingTypeCode?.description }}</span>
          <span v-if="item.corpTypeCode?.description">
            <span>-</span>
            {{ item.corpTypeCode?.description }}
          </span>
        </div>
      </template>
    </AsyncAutoComplete>
  </div>
</template>

<style lang="scss" scoped>
.filing-details {
  display: flex;
  span {
    min-width: 118px;

    span {
      padding: 0 5px !important;
    }
  }
}
</style>
