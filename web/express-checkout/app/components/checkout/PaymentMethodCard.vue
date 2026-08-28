<script setup lang="ts">
/**
 * One radio card in the payment-method list.
 *
 * Wraps a native <input type="radio"> so v-model against `<PaymentMethodCard
 * v-model="method" value="…"/>` behaves exactly like a bare radio.
 *
 * `#body` slot replaces the default title + subtitle when the caller needs to
 * inject richer content (e.g. the PAD "set up required" body with an inline
 * link). `#extra` slot renders below the label — used by the PAD variant to
 * embed the inline Banking Information panel inside the same card.
 */
defineProps<{
  modelValue: string
  value: string
  icon: string
  title: string
  subtitle?: string
  disabled?: boolean
  badge?: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <div
    class="rounded-lg border-2 bg-white transition"
    :class="[
      disabled ? 'border-slate-200 bg-slate-50/60' : '',
      !disabled && modelValue === value ? 'border-[#1A5A96] bg-blue-50/60' : '',
      !disabled && modelValue !== value ? 'border-slate-200 hover:border-slate-300' : ''
    ]"
  >
    <label
      class="block px-5 py-4"
      :class="disabled ? 'cursor-not-allowed' : 'cursor-pointer'"
    >
      <span
        v-if="badge"
        class="mb-3 inline-block rounded bg-slate-700 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"
      >
        {{ badge }}
      </span>
      <div class="flex items-start gap-4">
        <input
          type="radio"
          name="pm"
          :value="value"
          :checked="modelValue === value"
          :disabled="disabled"
          class="mt-1 h-4 w-4 accent-[#1A5A96] disabled:cursor-not-allowed"
          @change="$emit('update:modelValue', value)"
        >
        <UIcon :name="icon" class="mt-0.5 size-6 shrink-0 text-[#1A5A96]" />
        <div class="min-w-0">
          <slot name="body">
            <p class="font-semibold text-slate-900">
              {{ title }}
            </p>
            <p v-if="subtitle" class="mt-0.5 text-sm text-slate-500">
              {{ subtitle }}
            </p>
          </slot>
        </div>
      </div>
    </label>
    <slot name="extra" />
  </div>
</template>
