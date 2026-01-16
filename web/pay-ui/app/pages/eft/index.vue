<script setup lang="ts">
import type { EFTShortnameResponse } from '@/interfaces/eft-short-name'
import { useEftStore } from '@/stores/eft-store'
import { useEftTabCounts } from '@/composables/eft/useEftTabCounts'

const config = useRuntimeConfig()
const authWebUrl = (config.public as { authWebUrl?: string }).authWebUrl || ''
const eftStore = useEftStore()
const { summaries, linked, fetchTabCounts } = useEftTabCounts()

definePageMeta({
  layout: 'connect-auth',
  middleware: ['pay-auth'],
  allowedRoles: [Role.ManageEft],
  hideBreadcrumbs: false
})

useHead({
  title: 'BC Business Registry EFT'
})

setBreadcrumbs([
  {
    label: 'Staff Dashboard',
    to: `${authWebUrl}/staff/dashboard`
  },
  {
    label: 'EFT Received Payments'
  }
])

const tab = computed({
  get: () => eftStore.tabIndex,
  set: (value: number) => eftStore.setTabIndex(value)
})

const linkedAccount = ref<EFTShortnameResponse | undefined>(undefined)

function onLinkAccount(account: unknown) {
  tab.value = 0
  linkedAccount.value = account as EFTShortnameResponse
}

function onTabChange() {
  eftStore.setTabIndex(tab.value)
}

onMounted(() => {
  fetchTabCounts()
})
</script>

<template>
  <div class="w-full bg-white">
    <div class="bg-[var(--color-bg-shade)]">
      <div class="pt-7 pb-4">
        <h1 class="text-gray-900">
          Electronic Funds Transfer Received Payments
        </h1>
        <p class="text-lg text-[var(--color-text-secondary)]">
          Manage received Electronic Funds Transfers
        </p>
      </div>

      <div class="tab-container">
        <button
          :class="['tab-button', { active: tab === 0 }]"
          @click="tab = 0; onTabChange()"
        >
          All Short Names
          <span class="tab-count">
            ({{ summaries }})
          </span>
        </button>
        <button
          :class="['tab-button', { active: tab === 1 }]"
          @click="tab = 1; onTabChange()"
        >
          EFT Enabled Accounts
          <span class="tab-count">
            ({{ linked }})
          </span>
        </button>
      </div>
    </div>

    <div class="tab-content">
      <div v-if="tab === 0">
        <ShortNameSummaryTable
          :linked-account="linkedAccount"
          :current-tab="tab"
          @on-link-account="onLinkAccount"
          @shortname-state-total="summaries = $event"
        />
      </div>
      <div v-else>
        <LinkedShortNameTable
          :current-tab="tab"
          @shortname-state-total="linked = $event"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.shortname-summary) {
  overflow: visible;
}

.tab-container {
  display: flex;
  width: 100%;
  background-color: #003366;
  border-radius: 12px;
}

.tab-button {
  flex: 1;
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
