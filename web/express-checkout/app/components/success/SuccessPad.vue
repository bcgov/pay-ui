<script setup lang="ts">
/**
 * "Payment in Progress" screen for PAD — debit scheduled, no receipt yet.
 */
defineProps<{
  amountFormatted: string
}>()
</script>

<template>
  <div class="py-8 text-center">
    <UIcon name="i-mdi-clock-outline" class="mx-auto size-14 text-mark" />
    <h1 class="mt-4 text-3xl font-bold text-slate-900">
      {{ $t('page.success.pad.title') }}
    </h1>
    <dl class="mx-auto mt-8 max-w-md space-y-2 text-base text-slate-700">
      <div class="flex justify-center gap-2">
        <dt class="font-semibold text-slate-900">
          {{ $t('page.success.pad.methodLabel') }}:
        </dt>
        <dd>{{ $t('page.checkout.method.pad') }}</dd>
      </div>
      <div class="flex justify-center gap-2">
        <dt class="font-semibold text-slate-900">
          {{ $t('page.success.pad.amountLabel') }}:
        </dt>
        <dd>{{ amountFormatted }}</dd>
      </div>
    </dl>
    <p class="mx-auto mt-6 max-w-xl text-base text-slate-700">
      {{ $t('page.success.pad.body1', { amount: amountFormatted }) }}
    </p>
    <p class="mx-auto mt-1 max-w-xl text-base text-slate-700">
      {{ $t('page.success.pad.body2') }}
    </p>
  </div>
</template>
