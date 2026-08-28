<script setup lang="ts">
/**
 * Right-sidebar fee summary. Renders one row per invoice line item (base fee
 * only, service fees excluded), then a Service Fee aggregate, then a Total
 * Fees row with a "CAD" caption. Money math lives in useInvoiceFees.
 */
import type { PayInvoice } from '../../stores/paymentLink'

const props = defineProps<{
  invoice?: PayInvoice | null
}>()

const { lineBaseFee, serviceFees, total } = useInvoiceFees(() => props.invoice)

function fmt(n: number): string {
  return n.toFixed(2)
}
</script>

<template>
  <section class="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
    <header class="bg-[#1A2A47] px-5 py-3">
      <h2 class="text-base font-semibold !text-white">
        {{ $t('page.checkout.feeSummary') }}
      </h2>
    </header>

    <div class="divide-y divide-slate-200 px-5">
      <div
        v-for="(line, i) in invoice?.line_items || []"
        :key="i"
        class="py-4"
      >
        <div class="flex items-start justify-between gap-4">
          <p class="text-sm font-semibold text-slate-900">
            {{ line.description }}
          </p>
          <p class="whitespace-nowrap text-sm font-semibold text-slate-900">
            ${{ fmt(lineBaseFee(line)) }}
          </p>
        </div>
      </div>

      <div class="flex items-center justify-between gap-4 py-4">
        <p class="text-sm font-semibold text-slate-900">
          {{ $t('page.checkout.serviceFee') }}
        </p>
        <p class="whitespace-nowrap text-sm font-semibold text-slate-900">
          ${{ fmt(serviceFees) }}
        </p>
      </div>

      <div class="flex items-baseline justify-between gap-4 py-4">
        <p class="text-sm font-semibold text-slate-900">
          {{ $t('page.checkout.totalFees') }}
        </p>
        <p class="whitespace-nowrap text-slate-900">
          <span class="text-xs uppercase text-slate-500">CAD</span>
          <span class="ml-1 text-lg font-bold">${{ fmt(total) }}</span>
        </p>
      </div>
    </div>
  </section>
</template>
