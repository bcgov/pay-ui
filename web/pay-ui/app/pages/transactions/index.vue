<script setup lang="ts">
import { useTransactionsStore } from '@/stores/transactions-store'
import CommonUtil from '~/utils/common-util'

const { t } = useI18n()

const config = useRuntimeConfig()
const authWebUrl = (config.public as { authWebUrl?: string }).authWebUrl || ''
const transactionStore = useTransactionsStore()

definePageMeta({
  layout: 'connect-auth',
  middleware: ['pay-auth'],
  allowedRoles: [Role.ViewAllTransactions, Role.ProductRefundViewer],
  hideBreadcrumbs: false
})

useHead({
  title: t('page.transactions.title')
})

setBreadcrumbs([
  {
    label: 'Staff Dashboard',
    to: `${authWebUrl}/staff/dashboard`
  },
  {
    label: 'Transaction Records'
  }
])
const pendingRefundsCount = ref(0)
const tab = computed({
  get: () => transactionStore.tabIndex,
  set: (value: number) => transactionStore.setTabIndex(value)
})

function onTabChange() {
  transactionStore.setTabIndex(tab.value)
}

async function fetchRefundCount() {
  const nuxtApp = useNuxtApp()
  const $payApi = nuxtApp.$payApi as typeof nuxtApp.$payApi

  const [refundRes] = await Promise.all([
    $payApi<{ statusTotal: number }>('/refunds?refundStatus=PENDING_APPROVAL&limit=1')
  ])

  pendingRefundsCount.value = refundRes?.statusTotal ?? 0
}

onMounted(() => {
  fetchRefundCount()
})
</script>

<template>
  <div class="w-full bg-white">
    <div class="bg-[var(--color-bg-shade)]">
      <div class="pt-7 pb-4">
        <h1 class="text-gray-900">
          Transaction Records
        </h1>
      </div>

      <div class="tab-container">
        <button
          :class="['tab-button', { active: tab === 0 }]"
          @click="tab = 0; onTabChange()"
        >
          All
        </button>
        <button
          v-if="CommonUtil.isProductRefundViewer()"
          :class="['tab-button', { active: tab === 1 }]"
          @click="tab = 1; onTabChange()"
        >
          Pending Requests
          <span class="tab-count">
            ({{ pendingRefundsCount }})
          </span>
        </button>
      </div>
    </div>

    <div class="tab-content">
      <div v-if="tab === 0">
        <TransactionsDataTable
          :extended="true"
        />
      </div>
      <div v-else>
        <RefundRequestsTable />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.shortname-summary) {
  overflow: visible;
}

.tab-container {
  display: inline-flex;
  background-color: #003366;
  border-radius: 12px;
}

.tab-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  border: none;
  border-radius: 0;

  // Inactive state - solid dark blue
  background-color: #003366;
  color: white;

  // Round outer corners for first and last tabs
  &:first-child {
    border-radius: 12px 0 0 12px;
  }

  &:last-child {
    border-radius: 0 12px 12px 0;
  }

  &:hover:not(.active) {
    background-color: #002244;
  }

  // Active state - white background with thin border, fully rounded
  &.active {
    background-color: white;
    color: #212529;
    border: 2px solid #1a1a1a;
    border-radius: 12px;
    margin: 4px;
  }

  .tab-count {
    font-weight: 400;
  }
}

.tab-content {
  background-color: white;
  padding-bottom: 1.5rem;
}
</style>
