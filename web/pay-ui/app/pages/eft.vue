<script setup lang="ts">
import type { EFTShortnameResponse } from '@/interfaces/eft-short-name'
import { useEftStore } from '@/stores/eft-store'

const config = useRuntimeConfig()
const authWebUrl = (config.public as { authWebUrl?: string }).authWebUrl || ''
const eftStore = useEftStore()

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

const summaries = ref(0)
const linked = ref(0)
const linkedAccount = ref<EFTShortnameResponse | undefined>(undefined)

function onLinkAccount(account: unknown) {
  tab.value = 0
  linkedAccount.value = account as EFTShortnameResponse
}

function onTabChange() {
  eftStore.setTabIndex(tab.value)
}
</script>

<template>
  <div class="w-full bg-white">
    <div class="bg-[#f1f3f5]">
      <div class="px-4 pt-7">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          Electronic Funds Transfer Received Payments
        </h1>
      </div>
      <div class="px-4 pt-2 pb-6">
        <p class="text-gray-800">
          Manage received Electronic Funds Transfers
        </p>
      </div>

      <div class="w-full flex">
        <button
          :class="[
            'flex-1 px-6 py-3 font-semibold text-base transition-colors rounded-t-lg',
            tab === 0
              ? 'text-gray-900 bg-white'
              : 'text-white bg-blue-800 hover:bg-blue-900'
          ]"
          @click="tab = 0; onTabChange()"
        >
          All Short Names
          <span class="font-normal">
            ({{ summaries }})
          </span>
        </button>
        <button
          :class="[
            'flex-1 px-6 py-3 font-semibold text-base transition-colors rounded-t-lg',
            tab === 1
              ? 'text-gray-900 bg-white'
              : 'text-white bg-blue-800 hover:bg-blue-900'
          ]"
          @click="tab = 1; onTabChange()"
        >
          EFT Enabled Accounts
          <span class="font-normal">
            ({{ linked }})
          </span>
        </button>
      </div>
    </div>

    <div class="bg-white pt-4 pb-6">
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
</style>
