<script setup lang="ts">
import { DateTime } from 'luxon'

const crsStore = useCreateRoutingSlipStore()

defineEmits<{
  cancel: []
  create: []
}>()

const payData = computed<RoutingSlipPaymentItem[]>(() => {
  const items: RoutingSlipPaymentItem[] = []

  for (const uuid in crsStore.state.payment.paymentItems) {
    const item = crsStore.state.payment.paymentItems[uuid]!
    const date = DateTime.fromISO(item.date)

    items.push({
      ...item,
      date: date.isValid ? date.toFormat('DDD') : '',
      amountCAD: Number(item.amountCAD).toFixed(2),
      amountUSD: Number(item.amountUSD).toFixed(2)
    })
  }

  return items
})

const shouldShowNameAndAddress = computed(() => {
  const name = crsStore.state.address.name
  const address = crsStore.state.address.address
  const hasName = !!name?.trim()
  const hasAddress = !!address && (
    !!address.street?.trim()
    || !!address.city?.trim()
    || !!address.region?.trim()
    || !!address.postalCode?.trim()
    || !!address.country?.trim()
    || !!address.streetAdditional?.trim()
    || !!address.locationDescription?.trim()
  )
  return hasName || hasAddress
})
</script>

<template>
  <div class="flex flex-col gap-16">
    <div class="flex flex-col gap-6">
      <ReviewRoutingSlipRow
        :label="$t('label.routingSlipUniqueID')"
        :value="crsStore.state.details.id"
      />
      <ReviewRoutingSlipRow
        :label="$t('label.date')"
        :value="DateTime.fromISO(crsStore.state.details.date).toFormat('DDD')"
      />
      <ReviewRoutingSlipRow
        :label="$t('label.entityNumber')"
        :value="crsStore.state.details.entity"
      />
    </div>
    <div class="flex flex-col gap-6">
      <ReviewRoutingSlipRow
        :label="$t('label.paymentInformation')"
        :value="crsStore.isCheque ? $t('enum.PaymentTypes.CHEQUE') : $t('enum.PaymentTypes.CASH')"
      />
      <div class="space-y-8">
        <div
          v-for="(item, index) in payData"
          :key="index"
          class="flex flex-col gap-2 sm:gap-4 sm:flex-row"
        >
          <ConnectInput
            :id="`review-${crsStore.isCheque ? 'cheque' : 'receipt'}-number-${index}`"
            :model-value="item.identifier"
            :label="crsStore.isCheque ? $t('label.chequeNumber') : $t('label.receiptNumber')"
            disabled
            class="flex-1"
          />
          <ConnectInput
            v-if="crsStore.isCheque"
            :id="`review-cheque-date-${index}`"
            :model-value="item.date"
            :label="$t('label.chequeDate')"
            disabled
            class="flex-1"
          />
          <ConnectInput
            :id="`review-amount-cad-${index}`"
            :model-value="item.amountCAD"
            :label="$t('label.amountCAD')"
            disabled
            class="flex-1"
          />
          <ConnectInput
            v-if="crsStore.state.payment.isUSD"
            :id="`review-amount-usd-${index}`"
            :model-value="item.amountUSD"
            :label="$t('label.amountUSD')"
            disabled
            class="flex-1"
          />
        </div>
      </div>
      <ReviewRoutingSlipRow
        v-if="crsStore.isCheque"
        :label="$t('label.totalAmount')"
        :value="`$${crsStore.totalCAD}`"
      />
    </div>
    <ReviewRoutingSlipRow
      v-if="shouldShowNameAndAddress"
      :label="$t('label.nameOfPersonOrOrgAndAddress')"
    >
      <div class="flex flex-col gap-6">
        <span v-if="crsStore.state.address.name?.trim()">
          {{ crsStore.state.address.name }}
        </span>
        <ConnectAddressDisplay
          v-if="crsStore.state.address.address"
          :key="JSON.stringify(crsStore.state.address.address)"
          :address="crsStore.state.address.address"
          text-decor
        />
      </div>
    </ReviewRoutingSlipRow>

    <div class="flex justify-between border-t border-line-muted sm:pt-10 pt-6">
      <UButton
        :label="$t('label.backToEdit')"
        variant="outline"
        leading-icon="i-mdi-chevron-left"
        size="xl"
        :disabled="crsStore.loading"
        @click="crsStore.reviewMode = false"
      />
      <div class="flex gap-4">
        <UButton
          :label="$t('label.create')"
          size="xl"
          :loading="crsStore.loading"
          @click="$emit('create')"
        />
        <UButton
          :label="$t('label.cancel')"
          variant="outline"
          size="xl"
          :disabled="crsStore.loading"
          @click="$emit('cancel')"
        />
      </div>
    </div>
  </div>
</template>
