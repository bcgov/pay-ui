<script setup lang="ts">
/**
 * Edge-case PAD status banner shown below the method cards when PAD is
 * selected but the account can't proceed straight to submit:
 *   LOADING → waiting on account fetch
 *   PENDING → CFS activation in progress (submit still allowed; funds queue)
 *   FROZEN  → CFS account frozen (submit blocked)
 *
 * The READY state renders inline banking info inside the PAD card, so it's
 * not handled here.
 */
import type { PadState } from '../../composables/usePadAccountState'

defineProps<{
  state: Extract<PadState, 'LOADING' | 'PENDING' | 'FROZEN'>
}>()
</script>

<template>
  <div
    v-if="state === 'LOADING'"
    class="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500"
  >
    {{ $t('page.checkout.pad.loading') }}
  </div>
  <div
    v-else-if="state === 'PENDING'"
    class="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
  >
    <p class="font-semibold">
      {{ $t('page.checkout.pad.pendingTitle') }}
    </p>
    <p class="mt-1">
      {{ $t('page.checkout.pad.pendingBody') }}
    </p>
    <p class="mt-2 text-xs italic">
      {{ $t('page.checkout.pad.pendingEditLocked') }}
    </p>
  </div>
  <div
    v-else-if="state === 'FROZEN'"
    class="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800"
  >
    <p class="font-semibold">
      {{ $t('page.checkout.pad.frozenTitle') }}
    </p>
    <p class="mt-1">
      {{ $t('page.checkout.pad.frozenBody') }}
    </p>
  </div>
</template>
