<script setup lang="ts">
import { FetchError } from 'ofetch'
import { DateTime } from 'luxon'
import { debounce } from 'es-toolkit'

const { t } = useI18n()
const payApi = usePayApi()

const props = defineProps<{
  parentRoutingSlipNumber: string
}>()

const emit = defineEmits<{
  success: [childRoutingSlipNumber: string]
  cancel: []
}>()

const selected = ref<string | undefined>(undefined)
const errorMessage = ref<string | undefined>(undefined)
const loading = ref<boolean>(false)

function validate() {
  if (selected.value) {
    errorMessage.value = undefined
    return true
  }
  errorMessage.value = t('text.pleaseSearchForRoutingSlip')
  return false
}

const debounceValidate = debounce(validate, 100)

async function searchRoutingSlip(number: string): Promise<RoutingSlip[]> {
  if (number.length < 3) {
    return []
  }
  const response = await payApi.postSearchRoutingSlip({ routingSlipNumber: number })

  return response.items.map(i => ({
    number: i.number!,
    routingSlipDate: DateTime.fromISO(i.routingSlipDate as string).toFormat('DDD'),
    total: i.total!
  }))
}

async function linkRoutingSlip(): Promise<void> {
  try {
    loading.value = true
    if (!validate() || !selected.value) {
      return
    }
    await payApi.postLinkRoutingSlip({
      childRoutingSlipNumber: selected.value,
      parentRoutingSlipNumber: props.parentRoutingSlipNumber
    })
    emit('success', selected.value)
  } catch (e) {
    const fallbackMsg = t('validation.unknownError')
    if (e instanceof FetchError) {
      const msg = e.response?._data.rootCause.detail || fallbackMsg
      errorMessage.value = msg
    } else {
      errorMessage.value = fallbackMsg
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col sm:flex-row gap-8 items-start">
    <UFormField :error="errorMessage" class="w-full min-w-xs sm:w-1/2 -mb-5">
      <template #default="{ error }">
        <AsyncAutoComplete
          id="routing-slip-autocomplete"
          v-model="selected"
          :label="$t('label.searchRoutingSlipUniqueID')"
          :query-fn="searchRoutingSlip"
          value-key="number"
          label-key="number"
          :disabled="loading"
          @blur="debounceValidate"
          @update:model-value="debounceValidate"
          @focus="errorMessage = undefined"
        >
          <template #item="{ item }">
            <ConnectI18nHelper
              class="line-clamp-1"
              translation-path="text.routingSlipSearchDisplay"
              :number="item.number"
              :date="item.routingSlipDate"
              :amount="item.total"
            />
          </template>
        </AsyncAutoComplete>
        <div
          v-if="!error"
          class="h-4 mt-1"
        />
      </template>
    </UFormField>
    <div class="flex flex-col sm:flex-row gap-4 items-start sm:pt-2.5 w-full">
      <UButton
        :label="$t('label.link')"
        class="h-min"
        :loading
        @click="linkRoutingSlip"
      />
      <UButton
        :disabled="loading"
        :label="$t('label.cancel')"
        class="h-min"
        @click="$emit('cancel')"
      />
    </div>
  </div>
</template>
