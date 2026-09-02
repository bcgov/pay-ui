<script setup lang="ts">
/**
 * Inline info panel shown inside the Online Banking radio card once
 * selected. Foreshadows the "Payment Pending" screen the user lands on after
 * Confirm — sets expectations for the 3-4 day settlement window before they
 * commit.
 */
</script>

<template>
  <div class="border-t border-slate-200 px-5 py-4 space-y-3 text-sm text-slate-700">
    <p>{{ $t('page.checkout.ob.nextStep') }}</p>
    <i18n-t keypath="page.checkout.ob.paymentInFull" tag="p">
      <template #emphasis>
        <strong>{{ $t('page.checkout.ob.paymentInFullEmphasis') }}</strong>
      </template>
    </i18n-t>
  </div>
</template>
