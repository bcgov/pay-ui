<script setup lang="ts">
import type { FilingType } from '@/interfaces/routing-slip'

const props = withDefaults(defineProps<{
  modelValue?: FilingType | null
  id?: string
}>(), {
  modelValue: null,
  id: undefined
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
    const results = await payApi.getSearchFilingType(trimmedTerm)
    return results.map((item: FilingType) => ({
      ...item,
      label: `${item.filingTypeCode?.description} - ${item.corpTypeCode?.description}`
    }))
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
