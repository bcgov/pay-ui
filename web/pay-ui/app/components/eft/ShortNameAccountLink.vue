<script setup lang="ts">
import type { ShortNameDetails, EftShortName } from '@/composables/eft/useShortNameDetails'
import type { EFTShortnameResponse } from '@/interfaces/eft-short-name'
import type { AccountLinkRow } from '@/composables/eft/useShortNameAccountLink'
import { useShortNameAccountLink } from '@/composables/eft/useShortNameAccountLink'
import { ConfirmationType } from '@/utils/constants'
import CommonUtils from '@/utils/common-util'

interface Props {
  shortNameDetails: ShortNameDetails | null
  shortName: EftShortName | null
  highlightIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  highlightIndex: -1
})

const emit = defineEmits<{
  'on-link-account': [account: unknown, results: AccountLinkRow[]]
  'on-payment-action': []
}>()

const { t } = useI18n()

const shortNameId = computed(() => props.shortNameDetails?.id || 0)
const creditsRemaining = computed(() => props.shortNameDetails?.creditsRemaining || 0)

const {
  loading,
  processedRows,
  isLinked,
  loadShortNameLinks,
  unlinkAccount,
  applyPayment,
  cancelPayment,
  isStatementsExpanded,
  toggleStatementsView,
  showUnlinkAccountButton,
  showApplyPaymentButton,
  showCancelPaymentButton
} = useShortNameAccountLink(shortNameId, creditsRemaining)

const state = reactive({
  isShortNameLinkingDialogOpen: false,
  showConfirmDialog: false,
  confirmDialogTitle: '',
  confirmDialogText: '',
  confirmObject: null as { item: AccountLinkRow, type: string } | null,
  actionDropdown: [] as boolean[]
})

const eftShortNameSummary = computed<EFTShortnameResponse | null>(() => {
  if (!props.shortNameDetails) { return null }
  return {
    id: props.shortNameDetails.id,
    shortName: props.shortNameDetails.shortName,
    shortNameType: props.shortNameDetails.shortNameType!,
    creditsRemaining: props.shortNameDetails.creditsRemaining || 0,
    linkedAccountsCount: props.shortNameDetails.linkedAccountsCount || 0
  }
})

const headers = [
  { accessorKey: 'linkedAccount', header: 'Linked Account' },
  { accessorKey: 'accountBranch', header: 'Branch' },
  { accessorKey: 'unpaidStatementIds', header: 'Unpaid Statement Number' },
  { accessorKey: 'amountOwing', header: 'Amount Owing' },
  { accessorKey: 'actions', header: 'Actions', meta: { class: { th: 'text-right', td: 'text-right' } } }
]

function openAccountLinkingDialog() {
  state.isShortNameLinkingDialogOpen = true
}

async function onLinkAccount(account: unknown) {
  await loadShortNameLinks()
  emit('on-link-account', account, processedRows.value)
  emit('on-payment-action')
}

function showConfirmUnlinkAccountModal(item: AccountLinkRow) {
  state.confirmDialogTitle = 'Unlink Account'
  state.confirmDialogText = 'The link with this account will be removed.'
  state.confirmObject = { item, type: ConfirmationType.UNLINK_ACCOUNT }
  state.showConfirmDialog = true
}

function showConfirmCancelPaymentModal(item: AccountLinkRow) {
  state.confirmDialogTitle = 'Cancel Payment'
  state.confirmDialogText = 'The applied amount will be returned to the short name.'
  state.confirmObject = { item, type: ConfirmationType.CANCEL_PAYMENT }
  state.showConfirmDialog = true
}

async function dialogConfirm() {
  if (!state.confirmObject) { return }

  const { item, type } = state.confirmObject

  if (type === ConfirmationType.CANCEL_PAYMENT) {
    const success = await cancelPayment(item.accountId, item.isParentRow ? undefined : item.statementId)
    if (success) {
      emit('on-payment-action')
    }
  } else if (type === ConfirmationType.UNLINK_ACCOUNT) {
    await unlinkAccount(item.id)
  }

  resetConfirmationDialog()
}

function dialogConfirmClose() {
  state.showConfirmDialog = false
}

function resetConfirmationDialog() {
  state.showConfirmDialog = false
  state.confirmDialogTitle = ''
  state.confirmDialogText = ''
  state.confirmObject = null
}

async function handleApplyPayment(item: AccountLinkRow) {
  const success = await applyPayment(
    item.accountId,
    item.isParentRow ? undefined : item.statementId
  )
  if (success) {
    emit('on-payment-action')
  }
}

function formatCurrency(amount: number): string {
  return CommonUtils.formatAmount(amount)
}

function formatAccountDisplayName(item: AccountLinkRow): string {
  return CommonUtils.formatAccountDisplayName(item)
}

function handleRowToggle(item: AccountLinkRow) {
  if (item.isParentRow && item.statementsOwing.length > 1) {
    toggleStatementsView(item.accountId)
  }
}

watch(
  () => props.shortNameDetails?.id,
  (newId) => {
    if (newId) {
      loadShortNameLinks()
    }
  },
  { immediate: true }
)
</script>

<template>
  <div v-if="shortNameDetails?.shortName" class="bg-gray-50 border-y border-gray-200">
    <ShortNameLinkingDialog
      v-model:open="state.isShortNameLinkingDialogOpen"
      :short-name="eftShortNameSummary"
      @link-account="onLinkAccount"
    />

    <UModal v-model:open="state.showConfirmDialog" :ui="{ content: 'sm:max-w-[720px]' }">
      <template #header>
        <div class="flex items-center justify-between w-full pr-2">
          <h2 class="text-xl font-bold text-gray-900">
            {{ state.confirmDialogTitle }}
          </h2>
          <UButton
            icon="i-mdi-close"
            color="primary"
            variant="ghost"
            size="lg"
            @click.stop="dialogConfirmClose"
          />
        </div>
      </template>

      <template #body>
        <p class="py-4 text-gray-700">
          {{ state.confirmDialogText }}
        </p>
      </template>

      <template #footer>
        <div class="flex items-center justify-center gap-3 w-full py-2">
          <UButton
            label="Cancel"
            color="primary"
            variant="outline"
            size="lg"
            class="min-w-[100px]"
            @click.stop="dialogConfirmClose"
          />
          <UButton
            label="Confirm"
            color="primary"
            size="lg"
            class="min-w-[100px]"
            :loading="loading"
            @click="dialogConfirm"
          />
        </div>
      </template>
    </UModal>

    <div class="card-title flex items-center px-6 py-5 bg-bcgov-lightblue">
      <UIcon name="i-mdi-bank-transfer" class="text-primary text-3xl mr-4" />
      <h2 class="text-lg font-bold text-gray-900">
        {{ t('page.eft.shortNameDetails.label.accountsLinkedTo', { shortName: shortNameDetails?.shortName }) }}
      </h2>
    </div>

    <div v-if="isLinked || loading" class="px-0">
      <div class="py-4 px-6">
        <UButton
          label="+ Link a New Account"
          color="primary"
          variant="outline"
          class="h-[38px]"
          @click="openAccountLinkingDialog"
        />
      </div>

      <UTable
        :data="processedRows"
        :columns="headers"
        :loading="loading"
        class="account-link-table w-full"
      >
        <template #linkedAccount-cell="{ row }">
          <div v-if="row.original.isParentRow">
            <div
              class="flex items-center cursor-pointer"
              @click="handleRowToggle(row.original)"
            >
              <template v-if="row.original.statementsOwing.length > 1">
                <UIcon
                  :name="isStatementsExpanded(row.original.accountId) ? 'i-mdi-chevron-up' : 'i-mdi-chevron-down'"
                  class="expansion-icon mr-2"
                />
              </template>
              <span>{{ formatAccountDisplayName(row.original) }}</span>
            </div>
            <div
              v-if="row.original.hasPendingPayment"
              class="flex items-start gap-2 text-gray-700 mt-2"
            >
              <UIcon name="i-mdi-clock-outline" class="mt-0.5 shrink-0" />
              <span class="text-sm">
                {{ formatCurrency(row.original.pendingPaymentAmountTotal) }}
                will be applied to this account today at 5:00 p.m. PST or 6:00 p.m. PDT.
              </span>
            </div>
          </div>
        </template>

        <template #accountBranch-cell="{ row }">
          <span v-if="row.original.isParentRow">
            {{ row.original.accountBranch }}
          </span>
        </template>

        <template #unpaidStatementIds-cell="{ row }">
          <div :class="{ 'child-statement-row': !row.original.isParentRow }">
            <span>{{ row.original.unpaidStatementIds }}</span>
            <div
              v-if="row.original.isParentRow && row.original.hasMultipleStatements"
              class="statement-view-link pt-2"
              @click="toggleStatementsView(row.original.accountId)"
            >
              <u>{{ isStatementsExpanded(row.original.accountId) ? 'View less' : 'View All statements' }}</u>
            </div>
          </div>
        </template>

        <template #amountOwing-cell="{ row }">
          <div class="flex items-center gap-1">
            <span :class="{ 'child-statement-row': !row.original.isParentRow }">
              {{ formatCurrency(row.original.amountOwing) }}
            </span>
            <UTooltip
              v-if="row.original.isParentRow && row.original.insufficientFundMessage"
              :text="row.original.insufficientFundMessage.replace('<br/>', ' ')"
            >
              <UIcon
                name="i-mdi-information-outline"
                class="text-red-500 cursor-help"
              />
            </UTooltip>
          </div>
        </template>

        <template #actions-cell="{ row, index }">
          <div class="flex items-center justify-end gap-2">
            <template v-if="showUnlinkAccountButton(row.original)">
              <UButton
                v-if="row.original.isParentRow"
                label="Unlink Account"
                color="primary"
                class="btn-table font-normal"
                :loading="loading"
                @click="showConfirmUnlinkAccountModal(row.original)"
              />
            </template>

            <template v-else-if="showApplyPaymentButton(row.original)">
              <UButton
                :label="row.original.hasMultipleStatements && row.original.isParentRow ? 'Apply All' : 'Apply Payment'"
                color="primary"
                class="btn-table font-normal"
                :loading="loading"
                :disabled="row.original.hasInsufficientFunds"
                :class="{ 'opacity-40 pointer-events-none': row.original.hasInsufficientFunds }"
                @click="handleApplyPayment(row.original)"
              />
              <UDropdownMenu
                v-if="row.original.isParentRow"
                v-model:open="state.actionDropdown[index]"
                :items="[
                  [
                    {
                      label: 'Unlink Account',
                      onSelect: () => showConfirmUnlinkAccountModal(row.original)
                    }
                  ]
                ]"
              >
                <UButton
                  color="primary"
                  size="sm"
                  :loading="loading"
                  class="more-actions-btn px-1"
                >
                  <UIcon :name="state.actionDropdown[index] ? 'i-mdi-menu-up' : 'i-mdi-menu-down'" />
                </UButton>
              </UDropdownMenu>
            </template>

            <template v-else-if="showCancelPaymentButton(row.original)">
              <UButton
                label="Cancel Payment"
                color="primary"
                class="btn-table font-normal"
                :loading="loading"
                @click="showConfirmCancelPaymentModal(row.original)"
              />
            </template>
          </div>
        </template>

        <template #loading>
          <div class="text-center py-8">
            Loading linked accounts...
          </div>
        </template>

        <template #empty>
          <div class="text-center py-8 text-gray-600">
            No linked accounts.
          </div>
        </template>
      </UTable>
    </div>

    <div
      v-else
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 py-6"
    >
      <span class="text-gray-700">
        This short name is not linked with an account.
      </span>
      <UButton
        label="Link to Account"
        color="primary"
        size="lg"
        @click="openAccountLinkingDialog"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/scss/basic-table.scss';

.card-title {
  background-color: var(--color-bg-light-blue);
}

.text-primary {
  color: var(--color-primary);
}

.expansion-icon {
  background-color: var(--color-primary);
  border-radius: 50%;
  color: white;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.child-statement-row {
  font-weight: normal;
  padding-left: 28px;
}

.statement-view-link {
  color: var(--color-primary);
  font-weight: normal;
  cursor: pointer;
}

.more-actions-btn {
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
  margin-left: -1px;
}
</style>
