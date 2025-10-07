<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { DateTime } from 'luxon'

const { t } = useI18n()
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

const payColumns = computed<TableColumn<RoutingSlipPaymentItem>[]>(() => {
  const meta = {
    class: {
      th: 'text-center',
      td: 'text-center text-neutral'
    }
  }

  const cols = [
    {
      accessorKey: 'identifier',
      header: crsStore.isCheque ? t('label.chequeNumber') : t('label.receiptNumber'),
      meta
    },
    {
      accessorKey: 'amountCAD',
      header: t('label.amountCAD'),
      meta
    }
  ]

  if (crsStore.isCheque) {
    cols.splice(1, 0, {
      accessorKey: 'date',
      header: t('label.chequeDate'),
      meta
    })
  }

  if (crsStore.state.payment.isUSD) {
    cols.push({
      accessorKey: 'amountUSD',
      header: t('label.amountUSD'),
      meta
    })
  }
  return cols
})
</script>

<template>
  <div class="flex flex-col gap-10">
    <div class="flex flex-col gap-4">
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
    <div class="flex flex-col gap-4">
      <ReviewRoutingSlipRow
        :label="$t('label.paymentInformation')"
        :value="crsStore.isCheque ? $t('enum.PaymentTypes.CHEQUE') : $t('enum.PaymentTypes.CASH')"
      />
      <UTable
        class="max-h-48 mx-0 sm:mx-10"
        :data="payData"
        :columns="payColumns"
        sticky
        :ui="{
          separator: 'bg-line-muted',
          tbody: 'divide-line-muted'
        }"
      />
      <ReviewRoutingSlipRow
        v-if="crsStore.isCheque"
        :label="$t('label.totalAmount')"
        :value="`$${crsStore.totalCAD}`"
      />
    </div>
    <ReviewRoutingSlipRow :label="$t('label.nameOfPersonOrOrgAndAddress')">
      <div class="flex flex-col gap-4">
        <span>{{ crsStore.state.address.name }}</span>
        <ConnectAddressDisplay
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
