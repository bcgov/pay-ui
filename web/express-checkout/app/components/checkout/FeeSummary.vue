<script setup lang="ts">
/**
 * Right-sidebar fee summary. Renders one row per invoice line item (base fee
 * only, service fees excluded), then a Service Fee aggregate, then a Total
 * Fees row with a "CAD" caption. Money math lives in useInvoiceFees.
 */
import type { PayInvoice, PayInvoiceLineItem } from '../../stores/paymentLink'

const props = defineProps<{
  invoice?: PayInvoice | null
}>()

const { lineBaseFee, serviceFees, total } = useInvoiceFees(() => props.invoice)

function fmt(n: number): string {
  return n.toFixed(2)
}

// Build a subtitle like "× 3 companies" from pay-api's quantity metadata.
// Skips when the line has no quantity data or is a single-unit line.
function lineHelper(line: PayInvoiceLineItem): string {
  const qty = Number(line.quantity) || 0
  if (qty <= 1) { return line.quantityDesc ?? '' }
  return line.quantityDesc ? `× ${qty} ${line.quantityDesc}` : `× ${qty}`
}
</script>

<template>
  <section class="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
    <header class="bg-[var(--color-navy)] px-5 py-3">
      <h2 class="text-base font-semibold text-white">
        {{ $t('page.checkout.feeSummary') }}
      </h2>
    </header>

    <div class="divide-y divide-slate-200 px-5">
      <div
        v-for="(line, i) in invoice?.lineItems || []"
        :key="i"
        class="py-4"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-900">
              {{ line.description }}
            </p>
            <p v-if="lineHelper(line)" class="mt-0.5 text-xs text-slate-500">
              {{ lineHelper(line) }}
            </p>
          </div>
          <p class="whitespace-nowrap text-sm font-semibold text-slate-900">
            ${{ fmt(lineBaseFee(line)) }}
          </p>
        </div>
      </div>

      <div class="flex items-center justify-between gap-4 py-4 pl-4">
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
