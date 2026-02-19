<script setup lang="ts">
import CommonUtils from '@/utils/common-util'
import ShortNameUtils from '@/utils/short-name-util'
import {
  EFTRefundMethod,
  EFTRefundMethodDescription,
  EFTRefundStatus,
  EFTRefundStatusDescription,
  ChequeRefundStatus,
  ChequeRefundCode
} from '@/utils/constants'
import { getEFTErrorMessage } from '@/utils/api-error-handler'
import { useShortNameDetails } from '@/composables/eft/useShortNameDetails'
import { useEftRefund } from '@/composables/eft/useEftRefund'
import type { EftRefund, EftRefundRequest } from '@/composables/eft/useEftRefund'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const shortNameId = computed(() => Number(route.params.id))
const eftRefundId = computed(() => route.query.eftRefundId ? Number(route.query.eftRefundId) : undefined)
const refundMethodParam = computed(() => route.query.refundMethod as string || EFTRefundMethod.EFT)

const {
  shortNameDetails,
  shortName,
  loadShortname
} = useShortNameDetails(shortNameId)

const {
  getEftRefund,
  createEftRefund,
  updateChequeStatus
} = useEftRefund()

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
  isInitialLoading: true,
  isLoading: false,
  isSubmitted: false,
  hasError: false,
  refundDetails: null as EftRefund | null,
  readOnly: false,
  refundMethod: '' as string,
  refundAmount: '',
  casSupplierNumber: '',
  casSupplierSite: '',
  email: '',
  staffComment: '',
  entityName: '',
  address: {
    street: '',
    streetAdditional: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'CA',
    locationDescription: ''
  },
  statusIsExpanded: false
})

const isFormValid = computed(() => {
  if (!state.refundAmount || parseFloat(state.refundAmount) <= 0) { return false }
  if (!state.email) { return false }
  if (!state.staffComment) { return false }

  if (state.refundMethod === EFTRefundMethod.EFT) {
    if (!state.casSupplierNumber || !state.casSupplierSite) { return false }
  } else if (state.refundMethod === EFTRefundMethod.CHEQUE) {
    if (
      !state.entityName
      || !state.address.street
      || !state.address.city
      || !state.address.region
      || !state.address.postalCode
    ) { return false }
  }

  return true
})

const disableSubmission = computed(() => {
  return !isFormValid.value || state.isSubmitted || state.isLoading
})

const buttonText = computed(() => {
  if (state.isSubmitted) { return 'Submitted' }
  return 'Submit Refund Request'
})

const buttonColor = computed(() => {
  if (state.hasError) { return 'error' as const }
  if (state.isSubmitted) { return 'success' as const }
  return 'primary' as const
})

const chequeStatusList = computed(() => {
  return ChequeRefundStatus.filter(
    s => s.code !== state.refundDetails?.chequeStatus && s.display
  )
})

const refundAmountError = computed(() => {
  if (!state.refundAmount) { return 'Refund Amount is required' }
  const amount = parseFloat(state.refundAmount)
  if (amount <= 0) { return 'Refund Amount must be greater than zero' }
  if (shortNameDetails.value?.creditsRemaining && amount > shortNameDetails.value.creditsRemaining) {
    return 'Amount must be less than unsettled amount on short name'
  }
  if (!/^\d+(\.\d{1,2})?$/.test(state.refundAmount)) { return 'Amounts must be less than 2 decimal places' }
  return ''
})

async function loadRefundDetails(): Promise<void> {
  if (!eftRefundId.value) { return }

  try {
    const response = await getEftRefund(eftRefundId.value)
    if (response) {
      state.refundDetails = response
      state.refundMethod = response.refundMethod || ''
    }
  } catch (error) {
    console.error('Failed to load refund details:', error)
  }
}

function prepopulateRefund() {
  state.email = shortName.value?.email || ''
  if (state.refundMethod === EFTRefundMethod.EFT) {
    state.casSupplierNumber = shortName.value?.casSupplierNumber || ''
    state.casSupplierSite = shortName.value?.casSupplierSite || ''
  }
}

function getEmailHint(): string {
  if (state.refundMethod === EFTRefundMethod.EFT) {
    return "The email provided in the client's Direct Deposit Application form"
  }
  return ''
}

function isApproved(): boolean {
  return state.refundDetails?.status === EFTRefundStatus.APPROVED
}

function isDeclined(): boolean {
  return state.refundDetails?.status === EFTRefundStatus.DECLINED
}

function canUpdateChequeStatus(): boolean {
  return state.refundDetails?.refundMethod === EFTRefundMethod.CHEQUE
    && state.refundDetails?.status === EFTRefundStatus.APPROVED
}

function getEFTRefundStatusDescription(refundDetails: EftRefund | null): string {
  if (!refundDetails) { return '' }

  if (refundDetails.chequeStatus === ChequeRefundCode.CHEQUE_UNCASHED) {
    return 'Cheque Uncashed'
  }

  if (refundDetails.chequeStatus === ChequeRefundCode.CHEQUE_UNDELIVERABLE) {
    return 'Cheque Undeliverable'
  }

  const status = refundDetails.status as keyof typeof EFTRefundStatusDescription
  return EFTRefundStatusDescription[status] || refundDetails.status || ''
}

async function submitRefundRequest() {
  if (!isFormValid.value) { return }

  state.isLoading = true
  state.hasError = false

  const payload: EftRefundRequest = {
    shortNameId: shortNameId.value,
    refundMethod: state.refundMethod,
    refundAmount: parseFloat(state.refundAmount),
    refundEmail: state.email,
    comment: state.staffComment
  }

  if (state.refundMethod === EFTRefundMethod.EFT) {
    payload.casSupplierNumber = state.casSupplierNumber
    payload.casSupplierSite = state.casSupplierSite
  } else if (state.refundMethod === EFTRefundMethod.CHEQUE) {
    payload.entityName = state.entityName
    payload.street = state.address.street
    payload.streetAdditional = state.address.streetAdditional
    payload.city = state.address.city
    payload.region = state.address.region
    payload.country = state.address.country
    payload.postalCode = state.address.postalCode
    payload.deliveryInstructions = state.address.locationDescription
  }

  try {
    await createEftRefund(payload)

    state.isSubmitted = true
    toast.add({
      description: 'Refund request submitted successfully.',
      icon: 'i-mdi-check-circle',
      color: 'success'
    })

    setTimeout(() => {
      router.push(`/eft/shortname-details/${shortNameId.value}`)
    }, 2000)
  } catch (error) {
    console.error('Failed to submit refund request:', error)
    state.hasError = true

    toast.add({
      description: getEFTErrorMessage(error),
      icon: 'i-mdi-alert-circle',
      color: 'error'
    })
  } finally {
    state.isLoading = false
  }
}

async function updateChequeRefundStatus(statusCode: string) {
  if (!state.refundDetails?.id) { return }

  try {
    await updateChequeStatus(state.refundDetails.id, statusCode)
    await loadRefundDetails()
    state.statusIsExpanded = false
  } catch (error) {
    console.error('Failed to update cheque status:', error)
  }
}

function handleCancelButton() {
  router.push(`/eft/shortname-details/${shortNameId.value}`)
}

function formatCurrency(amount: number | undefined): string {
  return CommonUtils.formatAmount(amount)
}

function formatDate(date: string | undefined): string {
  if (!date) { return '' }
  return CommonUtils.formatDisplayDate(date, 'MMM dd, yyyy h:mm a') + ' Pacific Time'
}

onMounted(async () => {
  state.isInitialLoading = true

  await loadShortname()

  if (eftRefundId.value) {
    state.readOnly = true
    await loadRefundDetails()
  } else {
    state.refundMethod = refundMethodParam.value
    prepopulateRefund()
  }

  state.isInitialLoading = false

  setBreadcrumbs([
    { label: 'Staff Dashboard', to: '/staff/dashboard' },
    { label: 'EFT Received Payments', to: '/eft' },
    {
      label: shortNameDetails.value?.shortName || 'Short Name Details',
      to: `/eft/shortname-details/${shortNameId.value}`
    },
    { label: 'Refund Information' }
  ])
})
</script>

<template>
  <div class="w-full bg-gray-100 min-h-screen">
    <div class="max-w-4xl mx-auto px-6 py-8">
      <!-- Loading -->
      <div v-if="state.isInitialLoading" class="flex justify-center items-center min-h-[400px]">
        <UIcon name="i-mdi-loading" class="animate-spin text-4xl text-primary" />
      </div>

      <template v-else>
        <!-- Header -->
        <h1 class="text-2xl font-bold text-gray-900 mb-6">
          Refund Information
        </h1>

        <!-- Card -->
        <div class="bg-white rounded shadow-sm border border-gray-200">
          <div class="p-6 space-y-6">
            <!-- Refund Method -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <span class="font-bold text-gray-900">Refund Method</span>
              <span class="sm:col-span-2">
                {{
                  EFTRefundMethodDescription[state.refundMethod as keyof typeof EFTRefundMethodDescription]
                    || state.refundMethod
                }}
              </span>
            </div>

            <!-- Short Name -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <span class="font-bold text-gray-900">Short Name</span>
              <span class="sm:col-span-2">{{ shortNameDetails?.shortName }}</span>
            </div>

            <!-- Type -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <span class="font-bold text-gray-900">Type</span>
              <span class="sm:col-span-2">
                {{ ShortNameUtils.getShortNameTypeDescription(shortNameDetails?.shortNameType || '') }}
              </span>
            </div>

            <!-- Unsettled Amount (edit mode only) -->
            <div v-if="!state.readOnly" class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <span class="font-bold text-gray-900">Unsettled Amount on Short Name</span>
              <span class="sm:col-span-2">{{ formatCurrency(shortNameDetails?.creditsRemaining) }}</span>
            </div>

            <!-- Refund Amount -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start">
              <span class="font-bold text-gray-900 pt-2">Refund Amount</span>
              <div v-if="state.readOnly" class="sm:col-span-2">
                {{ formatCurrency(state.refundDetails?.refundAmount) }}
              </div>
              <div v-else class="sm:col-span-2">
                <UInput
                  v-model="state.refundAmount"
                  placeholder="Refund Amount"
                  size="lg"
                  class="w-full"
                  :disabled="state.isSubmitted"
                />
                <p v-if="state.refundAmount && refundAmountError" class="text-red-500 text-sm mt-1">
                  {{ refundAmountError }}
                </p>
              </div>
            </div>

            <!-- Entity Name (Cheque only) -->
            <div
              v-if="state.refundMethod === EFTRefundMethod.CHEQUE"
              class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start"
            >
              <span class="font-bold text-gray-900 pt-2">Entity Name</span>
              <div v-if="state.readOnly" class="sm:col-span-2">
                {{ state.refundDetails?.entityName }}
              </div>
              <div v-else class="sm:col-span-2">
                <UInput
                  v-model="state.entityName"
                  placeholder="Entity Name"
                  size="lg"
                  class="w-full"
                  :disabled="state.isSubmitted"
                />
                <p class="text-gray-500 text-sm mt-1">
                  Name of the individual or organization receiving the cheque
                </p>
              </div>
            </div>

            <!-- Address (Cheque only) -->
            <div
              v-if="state.refundMethod === EFTRefundMethod.CHEQUE"
              class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start"
            >
              <span class="font-bold text-gray-900 pt-2">Entity Address</span>
              <div v-if="state.readOnly" class="sm:col-span-2">
                <p>{{ state.refundDetails?.street }}</p>
                <p v-if="state.refundDetails?.streetAdditional">
                  {{ state.refundDetails?.streetAdditional }}
                </p>
                <p>
                  {{ state.refundDetails?.city }}, {{ state.refundDetails?.region }}
                  {{ state.refundDetails?.postalCode }}
                </p>
                <p>{{ state.refundDetails?.country }}</p>
              </div>
              <div v-else class="sm:col-span-2">
                <ConnectFormAddress
                  id="entity-address"
                  v-model="state.address"
                  schema-prefix="address"
                  :disabled="state.isSubmitted"
                />
              </div>
            </div>

            <!-- CAS Supplier Number (EFT only) -->
            <div
              v-if="state.refundMethod === EFTRefundMethod.EFT"
              class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start"
            >
              <span class="font-bold text-gray-900 pt-2">CAS Supplier Number</span>
              <div v-if="state.readOnly" class="sm:col-span-2">
                {{ state.refundDetails?.casSupplierNumber }}
              </div>
              <div v-else class="sm:col-span-2">
                <UInput
                  v-model="state.casSupplierNumber"
                  placeholder="CAS Supplier Number"
                  size="lg"
                  class="w-full"
                  :disabled="state.isSubmitted"
                />
                <p class="text-gray-500 text-sm mt-1">
                  This number should be created in CAS before issuing a refund
                </p>
              </div>
            </div>

            <!-- CAS Supplier Site (EFT only) -->
            <div
              v-if="state.refundMethod === EFTRefundMethod.EFT"
              class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start"
            >
              <span class="font-bold text-gray-900 pt-2">CAS Supplier Site</span>
              <div v-if="state.readOnly" class="sm:col-span-2">
                {{ state.refundDetails?.casSupplierSite }}
              </div>
              <div v-else class="sm:col-span-2">
                <UInput
                  v-model="state.casSupplierSite"
                  placeholder="CAS Supplier Site"
                  size="lg"
                  class="w-full"
                  :disabled="state.isSubmitted"
                />
                <p class="text-gray-500 text-sm mt-1">
                  This site should be created in CAS before issuing a refund
                </p>
              </div>
            </div>

            <!-- Email -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start">
              <span class="font-bold text-gray-900 pt-2">Entity Email</span>
              <div v-if="state.readOnly" class="sm:col-span-2">
                {{ state.refundDetails?.refundEmail }}
              </div>
              <div v-else class="sm:col-span-2">
                <UInput
                  v-model="state.email"
                  placeholder="Email"
                  type="email"
                  size="lg"
                  class="w-full"
                  :disabled="state.isSubmitted"
                />
                <p v-if="getEmailHint()" class="text-gray-500 text-sm mt-1">
                  {{ getEmailHint() }}
                </p>
              </div>
            </div>

            <!-- Reason for Refund -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-start">
              <span class="font-bold text-gray-900 pt-2">Reason for Refund</span>
              <div v-if="state.readOnly" class="sm:col-span-2">
                {{ state.refundDetails?.comment }}
              </div>
              <div v-else class="sm:col-span-2">
                <UInput
                  v-model="state.staffComment"
                  placeholder="Reason for Refund"
                  size="lg"
                  class="w-full"
                  :disabled="state.isSubmitted"
                />
              </div>
            </div>

            <!-- Read-only details -->
            <template v-if="state.readOnly">
              <!-- Requested By -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <span class="font-bold text-gray-900">Requested By Qualified Receiver</span>
                <span class="sm:col-span-2">
                  {{ state.refundDetails?.createdBy }} {{ formatDate(state.refundDetails?.createdOn) }}
                </span>
              </div>

              <!-- Approved By -->
              <div v-if="isApproved()" class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <span class="font-bold text-gray-900">Approved By Expense Authority</span>
                <span class="sm:col-span-2">
                  {{ state.refundDetails?.decisionBy }} {{ formatDate(state.refundDetails?.updatedOn) }}
                </span>
              </div>

              <!-- Declined By -->
              <div v-if="isDeclined()" class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <span class="font-bold text-gray-900">Declined By Expense Authority</span>
                <span class="sm:col-span-2">
                  {{ state.refundDetails?.decisionBy }} {{ formatDate(state.refundDetails?.updatedOn) }}
                </span>
              </div>

              <!-- Decline Reason -->
              <div v-if="isDeclined()" class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <span class="font-bold text-gray-900">Reason for Declining</span>
                <span class="sm:col-span-2">{{ state.refundDetails?.declineReason }}</span>
              </div>

              <!-- Refund Status -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <span class="font-bold text-gray-900">Refund Status</span>
                <div class="sm:col-span-2 flex items-center gap-4">
                  <UBadge
                    v-if="state.refundDetails?.chequeStatus
                      && [ChequeRefundCode.CHEQUE_UNDELIVERABLE, ChequeRefundCode.CHEQUE_UNCASHED]
                        .includes(state.refundDetails.chequeStatus as ChequeRefundCode)"
                    color="error"
                    size="lg"
                  >
                    {{ getEFTRefundStatusDescription(state.refundDetails)?.toUpperCase() }}
                  </UBadge>
                  <span v-else>{{ getEFTRefundStatusDescription(state.refundDetails) }}</span>

                  <!-- Update Status Menu -->
                  <div v-if="canUpdateChequeStatus()" class="relative">
                    <UButton
                      label="Update Status"
                      color="primary"
                      variant="ghost"
                      size="sm"
                      :trailing-icon="state.statusIsExpanded ? 'i-mdi-menu-up' : 'i-mdi-menu-down'"
                      @click="state.statusIsExpanded = !state.statusIsExpanded"
                    />
                    <div
                      v-if="state.statusIsExpanded"
                      class="absolute top-full left-0 mt-1 bg-white border border-gray-200
                        rounded shadow-lg z-10 min-w-[200px]"
                    >
                      <button
                        v-for="status in chequeStatusList"
                        :key="status.code"
                        class="w-full px-4 py-2 text-left hover:bg-gray-100"
                        @click="updateChequeRefundStatus(status.code)"
                      >
                        {{ status.text }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Actions (edit mode only) -->
          <template v-if="!state.readOnly">
            <div class="border-t border-gray-200" />
            <div class="flex justify-between items-center p-6">
              <UButton
                label="Cancel"
                color="primary"
                variant="outline"
                size="lg"
                :disabled="state.isLoading"
                @click="handleCancelButton"
              />
              <UButton
                :label="buttonText"
                :color="disableSubmission ? 'neutral' : buttonColor"
                :variant="disableSubmission ? 'outline' : 'solid'"
                size="lg"
                :loading="state.isLoading"
                :disabled="disableSubmission"
                @click="submitRefundRequest"
              />
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.text-primary {
  color: var(--color-primary);
}
</style>
