<script setup lang="ts">
import { EFTRefundMethod } from '@/utils/constants'

const route = useRoute()
const router = useRouter()

const shortNameId = computed(() => route.params.id as string)

definePageMeta({
  layout: 'connect-auth',
  middleware: ['pay-auth'],
  allowedRoles: [Role.EftRefund],
  hideBreadcrumbs: false
})

useHead({
  title: 'Refund Information'
})

const state = reactive({
  refundType: '' as string,
  formSubmitted: false
})

const isFormValid = computed(() => !!state.refundType)

function cancelRefundSelection() {
  router.push(`/eft/shortname-details/${shortNameId.value}`)
}

function gotoRefundForm() {
  state.formSubmitted = true
  if (isFormValid.value) {
    router.push({
      path: `/eft/shortname-details/${shortNameId.value}/refund`,
      query: { refundMethod: state.refundType }
    })
  }
}

onMounted(() => {
  setBreadcrumbs([
    { label: 'Staff Dashboard', to: '/staff/dashboard' },
    { label: 'EFT Received Payments', to: '/eft' },
    { label: 'Short Name Details', to: `/eft/shortname-details/${shortNameId.value}` },
    { label: 'Refund Selection' }
  ])
})
</script>

<template>
  <div class="w-full bg-gray-100 min-h-screen">
    <div class="max-w-4xl mx-auto px-6 py-8">
      <!-- Header -->
      <h1 class="text-2xl font-bold text-gray-900 mb-6">
        Refund Information
      </h1>

      <!-- Card -->
      <div class="bg-white rounded shadow-sm border border-gray-200">
        <div class="p-8 pt-10">
          <!-- Refund Method Selection -->
          <div class="flex flex-col sm:flex-row gap-4 sm:gap-8">
            <div class="sm:w-1/3">
              <span
                class="font-bold text-gray-900"
                :class="{ 'text-red-600': state.formSubmitted && !isFormValid }"
              >
                Select Refund Method
              </span>
            </div>
            <div class="sm:w-2/3">
              <div class="space-y-6 ml-2">
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="state.refundType"
                    type="radio"
                    :value="EFTRefundMethod.EFT"
                    class="w-5 h-5 text-primary border-gray-300 focus:ring-primary"
                  >
                  <span class="ml-3 text-gray-700">Direct Deposit (using CAS information)</span>
                </label>
                <label class="flex items-center cursor-pointer">
                  <input
                    v-model="state.refundType"
                    type="radio"
                    :value="EFTRefundMethod.CHEQUE"
                    class="w-5 h-5 text-primary border-gray-300 focus:ring-primary"
                  >
                  <span class="ml-3 text-gray-700">Issue a cheque</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="border-t border-gray-200 my-4" />

        <!-- Actions -->
        <div class="flex justify-between items-center p-6">
          <UButton
            label="Cancel"
            color="primary"
            variant="outline"
            size="lg"
            @click="cancelRefundSelection"
          />
          <UButton
            label="Next"
            color="primary"
            size="lg"
            trailing-icon="i-mdi-chevron-right"
            @click="gotoRefundForm"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input[type="radio"] {
  accent-color: var(--color-primary);
}
</style>
