<script setup lang="ts">
import CommonUtils from '@/utils/common-util'
import ShortNameUtils from '@/utils/short-name-util'
import { useShortNameDetails } from '@/composables/eft/useShortNameDetails'

const route = useRoute()
const { t } = useI18n()
const config = useRuntimeConfig()
const authWebUrl = (config.public as { authWebUrl?: string }).authWebUrl || ''

const shortNameId = computed(() => Number(route.params.id))

const {
  shortNameDetails,
  shortName,
  loading,
  notFound,
  loadShortname,
  refreshShortName
} = useShortNameDetails(shortNameId)

definePageMeta({
  layout: 'connect-auth',
  middleware: ['pay-auth'],
  allowedRoles: [Role.ManageEft],
  hideBreadcrumbs: false
})

useHead({
  title: t('page.eft.shortNameDetails.title')
})

const state = reactive({
  snackbar: false,
  snackbarText: '',
  displayShortNameFinancialDialog: false,
  shortNameFinancialDialogType: ''
})

const unsettledAmount = computed(() => {
  if (shortNameDetails.value?.creditsRemaining !== undefined) {
    return CommonUtils.formatAmount(shortNameDetails.value.creditsRemaining)
  }
  return ''
})

const canEFTRefund = computed(() => CommonUtils.canEFTRefund())

function openShortNameEmailDialog() {
  state.shortNameFinancialDialogType = 'EMAIL'
  state.displayShortNameFinancialDialog = true
}

function openShortNameSupplierNumberDialog() {
  state.shortNameFinancialDialogType = 'CAS_SUPPLIER_NUMBER'
  state.displayShortNameFinancialDialog = true
}

function openShortNameSupplierSiteDialog() {
  state.shortNameFinancialDialogType = 'CAS_SUPPLIER_SITE'
  state.displayShortNameFinancialDialog = true
}

async function _onShortNamePatch() {
  await refreshShortName()
}

async function _onRefund() {
  await loadShortname()
}

async function _onLinkAccount() {
  await loadShortname()
  state.snackbarText = t('page.eft.shortNameDetails.snackbar.linkSuccess', {
    shortName: shortNameDetails.value?.shortName
  })
  state.snackbar = true
}

async function _onPaymentAction() {
  await loadShortname()
}

onMounted(async () => {
  await loadShortname()

  setBreadcrumbs([
    {
      label: t('page.eft.shortNameDetails.breadcrumb.staffDashboard'),
      to: `${authWebUrl}/staff/dashboard`
    },
    {
      label: t('page.eft.shortNameDetails.breadcrumb.eftReceivedPayments'),
      to: '/eft'
    },
    {
      label: shortNameDetails.value?.shortName || ''
    }
  ])
})
</script>

<template>
  <div class="w-full bg-white min-h-screen">
    <div v-if="loading" class="flex justify-center items-center min-h-[400px]">
      <UIcon name="i-mdi-loading" class="animate-spin text-4xl text-primary" />
    </div>

    <div v-else-if="notFound" class="flex flex-col items-center justify-center min-h-[400px] px-6">
      <UIcon name="i-mdi-alert-circle-outline" class="text-6xl text-gray-400 mb-4" />
      <h2 class="text-xl font-semibold text-gray-700 mb-2">
        {{ t('page.eft.shortNameDetails.notFound.title') }}
      </h2>
      <p class="text-gray-500 mb-6">
        {{ t('page.eft.shortNameDetails.notFound.message') }}
      </p>
      <UButton
        :label="t('page.eft.shortNameDetails.notFound.backButton')"
        color="primary"
        @click="navigateTo('/eft')"
      />
    </div>

    <div v-else class="shortname-details-container">
      <!-- Snackbar for notifications -->
      <div
        v-if="state.snackbar"
        class="fixed top-4 right-4 bg-gray-800 text-white px-4 py-3 rounded shadow-lg z-50"
      >
        {{ state.snackbarText }}
      </div>

      <!-- Header Section -->
      <div class="header-section bg-white px-6 py-8">
        <div class="flex flex-col lg:flex-row lg:justify-between gap-6">
          <!-- Left: Short Name Title -->
          <div class="shortname-title">
            <h1 class="text-2xl font-bold text-gray-900">
              {{ shortNameDetails?.shortName }}
            </h1>
            <p class="mt-3 text-lg">
              <span class="font-bold">{{ t('page.eft.shortNameDetails.label.unsettledAmount') }}: </span>
              {{ unsettledAmount }}
            </p>
          </div>

          <!-- Right: Short Name Info -->
          <div class="shortname-info text-lg">
            <div class="mb-2">
              <span class="font-bold">{{ t('page.eft.shortNameDetails.label.type') }}: </span>
              {{ ShortNameUtils.getShortNameTypeDescription(shortName?.shortNameType || '') }}
            </div>
            <div class="mb-2">
              <span class="font-bold">{{ t('page.eft.shortNameDetails.label.casSupplierNumber') }}: </span>
              {{ shortName?.casSupplierNumber || t('page.eft.shortNameDetails.label.na') }}
              <button
                class="pl-4 text-primary cursor-pointer inline-flex items-center gap-1"
                @click="openShortNameSupplierNumberDialog()"
              >
                <UIcon name="i-mdi-pencil-outline" class="text-xl" />
                {{ t('page.eft.shortNameDetails.label.edit') }}
              </button>
            </div>
            <div class="mb-2">
              <span class="font-bold">{{ t('page.eft.shortNameDetails.label.casSupplierSite') }}: </span>
              {{ shortName?.casSupplierSite || t('page.eft.shortNameDetails.label.na') }}
              <button
                class="pl-4 text-primary cursor-pointer inline-flex items-center gap-1"
                @click="openShortNameSupplierSiteDialog()"
              >
                <UIcon name="i-mdi-pencil-outline" class="text-xl" />
                {{ t('page.eft.shortNameDetails.label.edit') }}
              </button>
            </div>
            <div class="break-all">
              <span class="font-bold">{{ t('page.eft.shortNameDetails.label.email') }}: </span>
              <span>{{ shortName?.email || t('page.eft.shortNameDetails.label.na') }}</span>
              <button
                class="pl-4 text-primary cursor-pointer inline-flex items-center gap-1"
                @click="openShortNameEmailDialog()"
              >
                <UIcon name="i-mdi-pencil-outline" class="text-xl" />
                {{ t('page.eft.shortNameDetails.label.edit') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Caution Alert -->
      <div v-if="canEFTRefund" class="px-6">
        <div class="caution-alert">
          <UIcon name="i-mdi-alert" class="caution-icon" />
          <p class="text-gray-700">
            <strong>Caution:</strong> {{ t('page.eft.shortNameDetails.caution.message', { amount: unsettledAmount }) }}
          </p>
        </div>
      </div>

      <!-- Content Sections -->
      <div class="px-6 py-8 space-y-12">
        <!-- Placeholder for ShortNameRefund component -->
        <div v-if="canEFTRefund" class="bg-white rounded shadow-sm border border-gray-200 p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UIcon name="i-mdi-cash-refund" class="text-primary" />
            {{ t('page.eft.shortNameDetails.label.refund') }}
          </h2>
          <p class="text-gray-600">
            {{ t('page.eft.shortNameDetails.label.refundPlaceholder') }}
          </p>
        </div>

        <!-- Placeholder for ShortNameAccountLink component -->
        <div class="bg-white rounded shadow-sm border border-gray-200 p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UIcon name="i-mdi-bank-transfer" class="text-primary" />
            {{ t('page.eft.shortNameDetails.label.accountsLinkedTo', { shortName: shortNameDetails?.shortName }) }}
          </h2>
          <p class="text-gray-600">
            {{ t('page.eft.shortNameDetails.label.linkedAccounts') }}: {{ shortNameDetails?.linkedAccountsCount || 0 }}
          </p>
          <p class="text-gray-500 mt-2">
            {{ t('page.eft.shortNameDetails.label.accountLinkPlaceholder') }}
          </p>
        </div>

        <!-- Placeholder for ShortNamePaymentHistory component -->
        <div class="bg-white rounded shadow-sm border border-gray-200 p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UIcon name="i-mdi-format-list-bulleted" class="text-primary" />
            {{ t('page.eft.shortNameDetails.label.paymentHistory') }}
          </h2>
          <p class="text-gray-600">
            {{ t('page.eft.shortNameDetails.label.paymentHistoryPlaceholder') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/scss/colors.scss';

.text-primary {
  color: var(--color-primary);
}

.header-section {
  position: relative;

  &::after {
    content: '';
    display: block;
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 0;
    background-color: var(--color-white);
  }

  > div {
    position: relative;
    z-index: 1;
  }
}

.caution-alert {
  background-color: var(--color-caution-bg);
  border: 1px solid var(--color-caution-border);
  border-radius: 0.25rem;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.caution-icon {
  color: var(--color-caution-icon);
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}
</style>
