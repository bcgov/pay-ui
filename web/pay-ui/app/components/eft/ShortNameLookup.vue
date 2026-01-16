<script setup lang="ts">
import { ShortNameStatus, LookupStates } from '@/utils/constants'
import CommonUtils from '@/utils/common-util'
import { useDebounceFn } from '@vueuse/core'
import { useShortNameLinking } from '@/composables/eft/useShortNameLinking'
import type { EftAccount } from '@/composables/eft/useShortNameLinking'

const emit = defineEmits<{
  account: [account: EftAccount | null]
  reset: []
}>()

const { searchEftAccounts, getAccountLinkDetails } = useShortNameLinking()

const state = ref<string>(LookupStates.INITIAL)
const searchTerm = ref('')
const searchResults = ref<EftAccount[]>([])
const selectedAccount = ref<EftAccount | null>(null)
const detailsLoaded = ref(false)

const isSearching = computed(() => state.value === LookupStates.SEARCHING)
const showResults = computed(() => state.value === LookupStates.SHOW_RESULTS || state.value === LookupStates.NO_RESULTS)

const debouncedSearch = useDebounceFn(async () => {
  if (!searchTerm.value || searchTerm.value.length <= 2) {
    state.value = LookupStates.TYPING
    return
  }

  state.value = LookupStates.SEARCHING
  try {
    const accounts = await searchEftAccounts(searchTerm.value)

    if (!accounts.length) {
      searchResults.value = []
      state.value = LookupStates.NO_RESULTS
      return
    }

    searchResults.value = accounts
    detailsLoaded.value = false
    state.value = LookupStates.SHOW_RESULTS

    const accountIds = accounts.map(a => a.accountId)
    const detailsMap = await getAccountLinkDetails(accountIds)

    searchResults.value = accounts.map((account) => {
      const details = detailsMap.get(account.accountId)
      return {
        ...account,
        statusCode: details?.statusCode,
        totalDue: details?.totalDue ?? 0
      }
    })
    detailsLoaded.value = true
  } catch {
    searchResults.value = []
    state.value = LookupStates.NO_RESULTS
  }
}, 600)

watch(searchTerm, (newVal) => {
  if (state.value === LookupStates.SUMMARY) {
    return
  }

  if (!newVal) {
    emit('account', null)
    searchResults.value = []
    state.value = LookupStates.INITIAL
    return
  }

  debouncedSearch()
})

function selectAccount(account: EftAccount) {
  if (account.statusCode === ShortNameStatus.LINKED || account.statusCode === ShortNameStatus.PENDING) {
    return
  }
  selectedAccount.value = account
  searchTerm.value = `${account.accountId} ${account.accountName}`
  state.value = LookupStates.SUMMARY
  searchResults.value = []
  emit('account', account)
}

function clearSelection(emitReset = true) {
  selectedAccount.value = null
  searchTerm.value = ''
  searchResults.value = []
  state.value = LookupStates.INITIAL
  emit('account', null)
  if (emitReset) {
    emit('reset')
  }
}

function clearSelectionSilent() {
  clearSelection(false)
}

function isAccountDisabled(account: EftAccount): boolean {
  return account.statusCode === ShortNameStatus.LINKED || account.statusCode === ShortNameStatus.PENDING
}

defineExpose({ clearSelection: clearSelectionSilent })
</script>

<template>
  <div class="short-name-lookup relative">
    <div class="relative">
      <UInput
        v-model="searchTerm"
        placeholder="Account ID or Account Name"
        size="lg"
        class="w-full"
        :readonly="state === LookupStates.SUMMARY"
        :trailing-icon="isSearching ? undefined : 'i-mdi-magnify'"
      >
        <template #trailing>
          <div class="flex items-center gap-2">
            <UIcon
              v-if="isSearching"
              name="i-mdi-loading"
              class="animate-spin size-5 text-primary"
            />
            <button
              v-if="searchTerm && !isSearching"
              type="button"
              class="text-gray-600 hover:text-gray-700"
              @click="clearSelection"
            >
              <UIcon name="i-mdi-close" class="size-5" />
            </button>
          </div>
        </template>
      </UInput>
    </div>

    <div
      v-if="showResults"
      class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg
        max-h-80 overflow-y-auto overscroll-contain"
    >
      <div
        class="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2 flex justify-between
          text-sm font-medium text-gray-600"
      >
        <span class="flex-1">Accounts with EFT Payment Method Selected</span>
        <span v-if="detailsLoaded" class="w-32 text-right">Amount Owing</span>
      </div>

      <div v-if="state === LookupStates.NO_RESULTS" class="px-4 py-3 text-gray-500">
        No accounts found
      </div>

      <div
        v-for="account in searchResults"
        :key="account.accountId"
        class="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer
          border-b border-gray-100 last:border-b-0"
        :class="{ 'opacity-50 cursor-not-allowed': isAccountDisabled(account) }"
        @click="selectAccount(account)"
      >
        <div class="flex-1 flex items-center gap-4">
          <span class="font-medium min-w-[100px]">{{ account.accountId }}</span>
          <span class="text-gray-700 truncate">{{ account.accountName }}</span>
        </div>
        <div v-if="detailsLoaded" class="flex items-center gap-4">
          <span class="w-28 text-right">{{ CommonUtils.formatAmount(account.totalDue) }}</span>
          <span
            v-if="isAccountDisabled(account)"
            class="text-green-600 text-sm w-16 text-right"
          >
            Linked
          </span>
          <span
            v-else
            class="text-primary text-sm w-16 text-right"
          >
            Select
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.short-name-lookup {
  width: 100%;
}
</style>
