<template>
  <v-card v-if="shortNameDetails.shortName">
    <ShortNameLinkingDialog
      :isShortNameLinkingDialogOpen="isShortNameLinkingDialogOpen"
      :selectedShortName="eftShortNameSummary"
      @close-short-name-linking-dialog="closeShortNameLinkingDialog"
      @on-link-account="onLinkAccount"
    />
    <ModalDialog
      ref="confirmationDialog"
      max-width="720"
      :show-icon="false"
      :showCloseIcon="true"
      dialog-class="confirmation-dialog"
      :title="`${confirmDialogTitle}`"
    >
      <template #text>
        <p class="pt-4">
          {{ confirmDialogText }}
        </p>
      </template>
      <template #actions>
        <div class="d-flex justify-center dialog-button-container">
          <v-btn
            outlined
            large
            depressed
            class="mr-3"
            color="primary"
            data-test="btn-cancel-confirmation-dialog"
            @click="dialogConfirmClose"
          >
            Cancel
          </v-btn>
          <v-btn
            large
            depressed
            class="font-weight-bold btn-dialog"
            data-test="btn-confirm-confirmation-dialog"
            color="primary"
            @click="dialogConfirm"
          >
            Confirm
          </v-btn>
        </div>
      </template>
    </ModalDialog>
    <v-card-title class="card-title">
      <v-icon
        class="pr-5"
        color="link"
        left
      >
        mdi-bank-transfer
      </v-icon>
      Accounts Linked to {{ shortNameDetails.shortName }}
    </v-card-title>

    <v-card-text
      v-if="isLinked"
      class="pa-0 linked-text"
    >
      <v-btn
        id="link-shortname-btn"
        color="primary"
        outlined
        dark
        large
        class="mt-4 ml-4 font-weight-regular"
        @click="openAccountLinkingDialog()"
      >
        + Link a New Account
      </v-btn>
      <BaseVDataTable
        id="eft-account-linking-table"
        class="eft-account-links-list pt-2"
        itemKey="id"
        :loading="loading"
        loadingText="Loading Records..."
        noDataText="No Records."
        :setItems="results"
        :setHeaders="headers"
        :setTableDataOptions="options"
        :totalItems="totalResults"
        :filters="filters"
        :pageHide="true"
        :hideFilters="true"
        :hasTitleSlot="false"
        :highlight-index="highlightIndex"
        highlight-class="base-table__item-row-green"
        :setExpanded="expanded"
        @update-table-options="options = $event"
      >
        <template #item-slot-linkedAccount="{ item }">
          <div v-if="item.isParentRow"
               @click="toggleStatementsView(item)"
          >
            <span
              :class="{'child-statement-row': !item.isParentRow}">
              <span v-if="item.statementsOwing.length > 1"
                data-test="multiple-statements-toggle-icon"
              >
                <v-icon class='expansion-icon mr-2' v-if="isStatementsExpanded(item)">mdi-chevron-up</v-icon>
                <v-icon class='expansion-icon mr-2' v-else>mdi-chevron-down</v-icon>
              </span>
              {{ formatAccountDisplayName(item) }}
            </span>
          </div>
        </template>
        <template #item-slot-accountBranch="{ item }">
          <span
            v-if="item.isParentRow"
            :class="{'child-statement-row': !item.isParentRow}">
            {{ item.accountBranch }}
          </span>
        </template>
        <template #item-slot-unpaidStatementIds="{ item }">
          <span
            :class="{'child-statement-row': !item.isParentRow}"
          >{{ item.unpaidStatementIds }}</span>
          <div
            v-if="item.isParentRow && item.hasMultipleStatements"
            class="statement-view-link pt-2"
            data-test="multiple-statements-toggle-link"
            @click="toggleStatementsView(item)">
            <u>{{ isStatementsExpanded(item) ? 'View less' : 'View All statements' }}</u>
          </div>
        </template>
        <template #item-slot-amountOwing="{ item }">
          {{ formatCurrency(item.amountOwing) }}
          <v-tooltip top
            v-if="item.insufficientFundMessage">
            <template #activator="{ on }">
             <span v-on="on"
               :class="{'child-statement-row': !item.isParentRow}"
             >
              <v-icon
                v-if="item.isParentRow"
                data-test="insufficient-funds-icon"
                class='red-warning-icon ml-1'>mdi-information-outline</v-icon>
            </span>
            </template>
           <span class="top-tooltip" v-sanitize="item.insufficientFundMessage"></span>
          </v-tooltip>
        </template>
        <template #expanded-item="{ item }">
          <tr
            v-if="item.hasPendingPayment"
            class="expanded-item-row"
          >
            <td
              :colspan="headers.length"
              class="pb-5 pl-4"
            >
              <span class="expanded-item scheduled-item">
                <v-icon>mdi-clock-outline</v-icon>
                {{ formatCurrency(item.pendingPaymentAmountTotal) }} will be applied to this account today at 5:00 p.m. PST or 6:00 p.m. PDT.
              </span>
            </td>
          </tr>
        </template>

        <!-- Action Buttons -->
        <template #item-slot-actions="{ item, index }">
          <div
            :id="`action-menu-${index}`"
            class="new-actions mx-auto"
          >
            <!-- Statement Parent Row Actions -->
            <!-- Unlink Account Button -->
            <template v-if="showUnlinkAccountButton(item)">
              <v-btn
                v-if="item.isParentRow"
                small
                color="primary"
                min-width="5rem"
                min-height="2rem"
                class="open-action-btn single-action-btn"
                :loading="loading"
                @click="showConfirmUnlinkAccountModal(item)"
              >
                Unlink Account
              </v-btn>
            </template>
            <!-- Apply Payments / More actions Unlink Account-->
            <template v-else-if="showApplyPaymentButton(item)">
              <v-btn
                small
                color="primary"
                min-width="5rem"
                min-height="2rem"
                :class="['open-action-btn', { 'single-action-btn': !item.isParentRow, 'disabled-action': item.hasInsufficientFunds }]"
                :loading="loading"
                @click="applyPayment(item)"
              >
                {{  item.hasMultipleStatements && item.isParentRow ? 'Apply All' : 'Apply Payment' }}
              </v-btn>
              <span class="more-actions"
                v-if="item.isParentRow"
              >
                <v-menu
                  v-model="actionDropdown[index]"
                  :attach="`#action-menu-${index}`"
                  offset-y
                  nudge-left="156"
                >
                  <template #activator="{ on }">
                    <v-btn
                      small
                      color="primary"
                      class="more-actions-btn pa-0"
                      :loading="loading"
                      v-on="on"
                    >
                      <v-icon>{{ actionDropdown[index] ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon>
                    </v-btn>
                  </template>
                  <v-list>
                    <v-list-item
                      class="actions-dropdown_item pl-6 pt-1 pb-1 ma-0"
                    >
                      <v-list-item-subtitle
                        @click="showConfirmUnlinkAccountModal(item)"
                      >
                        <span class="pl-1 cursor-pointer">Unlink Account</span>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </span>
            </template>
            <!-- Cancel Payment-->
            <template v-else-if="showCancelPaymentButton(item)">
              <v-btn
                small
                color="primary"
                min-width="5rem"
                min-height="2rem"
                class="open-action-btn single-action-btn"
                :loading="loading"
                @click="showConfirmCancelPaymentModal(item)"
              >
                Cancel Payment
              </v-btn>
            </template>
          </div>
        </template>
      </BaseVDataTable>
    </v-card-text>

    <v-card-text
      v-else
      class="d-flex justify-space-between pa-5 unlinked-text"
    >
      <span class="pt-1">
        This short name is not linked with an account.
      </span>
      <v-btn
        id="link-shortname-btn"
        color="primary"
        @click="openAccountLinkingDialog()"
      >
        Link to Account
      </v-btn>
    </v-card-text>
  </v-card>
</template>
<script lang="ts">

import {
  Ref,
  computed,
  defineComponent,
  nextTick,
  reactive,
  ref,
  toRefs,
  watch
} from '@vue/composition-api'
import { ConfirmationType, ShortNameLinkStatus, ShortNamePaymentActions } from '@/util/constants'
import { BaseVDataTable } from '@/components/datatable'
import CommonUtils from '@/util/common-util'
import { DEFAULT_DATA_OPTIONS } from '@/components/datatable/resources'
import ModalDialog from '@/components/common/ModalDialog.vue'
import PaymentService from '@/services/payment.services'
import ShortNameLinkingDialog from '@/components/eft/ShortNameLinkingDialog.vue'
import _ from 'lodash'

export default defineComponent({
  name: 'ShortNameAccountLinkage',
  components: { ModalDialog, BaseVDataTable, ShortNameLinkingDialog },
  props: {
    shortNameDetails: {
      type: Object,
      default: () => ({})
    },
    highlightIndex: {
      type: Number,
      default: -1
    }
  },
  emits: ['on-link-account', 'on-payment-action'],
  setup (props, { emit }) {
    const confirmationDialog: Ref<InstanceType<typeof ModalDialog>> = ref(null)
    const headers = [
      {
        col: 'linkedAccount',
        hasFilter: false,
        width: '200px',
        value: 'Linked Account'
      },
      {
        col: 'accountBranch',
        hasFilter: false,
        width: '210px',
        value: 'Branch'
      },
      {
        col: 'unpaidStatementIds',
        hasFilter: false,
        width: '260px',
        value: 'Unpaid Statement Number'
      },
      {
        col: 'amountOwing',
        hasFilter: false,
        width: '175px',
        value: 'Amount Owing'
      },
      {
        col: 'actions',
        hasFilter: false,
        value: 'Actions',
        width: '150px'
      }
    ]

    const state = reactive({
      actionDropdown: [],
      isShortNameLinkingDialogOpen: false,
      eftShortNameSummary: {},
      confirmDialogTitle: '',
      confirmDialogText: '',
      confirmObject: undefined,
      results: [],
      totalResults: 0,
      filters: {
        pageNumber: 1,
        pageLimit: 5
      },
      loading: false,
      options: _.cloneDeep(DEFAULT_DATA_OPTIONS),
      expanded: [],
      expandedStatements: []
    })

    const isLinked = computed<boolean>(() => {
      return state.totalResults > 0 || state.loading
    })

    function getUnpaidStatementsString (statementsOwing: []): string {
      const statementIds = statementsOwing.map(statement => statement.statementId)
      if (statementIds.length <= 2) {
        return statementIds.join(', ')
      } else {
        return statementIds.slice(0, 2).join(', ') + ',...'
      }
    }

    function isStatementsExpanded (item: any): boolean {
      return state.expandedStatements.indexOf(item.accountId) > -1
    }

    function toggleStatementsView (item: any): void {
      const accountIndex = state.expandedStatements.indexOf(item.accountId)
      if (accountIndex > -1) {
        state.expandedStatements.splice(accountIndex, 1)
      } else {
        state.expandedStatements.push(item.accountId)
      }
      processStatements()
    }

    function evaluateParentInsufficientFunds (statement) {
      const hasOutstandingStatements = statement.statementsOwing.some(statement => statement.pendingPaymentsCount === 0)
      statement.insufficientFundMessage = undefined
      if (statement.amountOwing > state.eftShortNameSummary.creditsRemaining && hasOutstandingStatements) {
        statement.hasInsufficientFunds = true
        statement.insufficientFundMessage = 'Insufficient funds to settle all statements.'
        if (statement.hasMultipleStatements && statement.hasPayableStatement) {
          statement.insufficientFundMessage += '<br/>Review each statement to settle.'
        }
      }
    }

    async function processStatements () {
      const statements = []
      state.results.forEach(statement => {
        if (statement.isParentRow) {
          statements.push(statement)
          statement.pendingPaymentAmountTotal = 0
          statement.amountOwing = 0
          statement.hasMultipleStatements = statement.statementsOwing.length > 1
          statement.statementsOwing.forEach((statementOwing: any) => {
            const childStatementRow = {
              hasPendingPayment: statementOwing.pendingPaymentsCount > 0,
              isParentRow: false,
              unpaidStatementIds: statementOwing.statementId,
              shortNameId: statement.shortNameId,
              amountOwing: statementOwing.amountOwing,
              pendingPaymentAmount: statementOwing.pendingPaymentsAmount,
              statementId: statementOwing.statementId,
              accountId: statement.accountId,
              hasInsufficientFunds: statementOwing.amountOwing > state.eftShortNameSummary.creditsRemaining
            }
            statement.pendingPaymentAmountTotal += statementOwing.pendingPaymentsAmount
            statement.amountOwing += statementOwing.amountOwing
            if (!childStatementRow.hasInsufficientFunds) {
              statement.hasPayableStatement = true
            }
            if (state.expandedStatements.indexOf(statement.accountId) > -1) {
              statements.push(childStatementRow)
            }
          })
          statement.unpaidStatementIds = getUnpaidStatementsString(statement.statementsOwing)
          evaluateParentInsufficientFunds(statement)
        }
      })
      await nextTick()
      state.results = [...statements]
    }

    async function evaluateLinks () {
      const pending = state.results.filter(result =>
        result.statusCode === ShortNameLinkStatus.PENDING && result.amountOwing > 0
      )

      await nextTick()
      state.expanded = [...pending]
    }

    function openAccountLinkingDialog () {
      state.isShortNameLinkingDialogOpen = true
    }

    function closeShortNameLinkingDialog () {
      state.isShortNameLinkingDialogOpen = false
    }

    async function onLinkAccount (account: any) {
      await loadShortNameLinks()
      emit('on-link-account', account, state.results)
      emit('on-payment-action')
    }

    function dialogConfirm () {
      confirmationDialog.value.close()
      const confirmationType = state.confirmObject.type
      if (confirmationType === ConfirmationType.CANCEL_PAYMENT) {
        cancelPayment(state.confirmObject.item)
      } else if (confirmationType === ConfirmationType.UNLINK_ACCOUNT) {
        unlinkAccount(state.confirmObject.item)
      }
      resetConfirmationDialog()
    }

    function dialogConfirmClose () {
      confirmationDialog.value.close()
    }

    async function applyPayment (item) {
      state.loading = true
      try {
        const params = {
          action: ShortNamePaymentActions.APPLY_CREDITS,
          accountId: item.accountId,
          statementId: !item.isParentRow ? item.statementId : undefined
        }

        await PaymentService.postShortnamePaymentAction(props.shortNameDetails.id, params)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('An errored occurred applying payments.', error)
      }
      emit('on-payment-action')
      state.loading = false
    }

    function resetConfirmationDialog () {
      state.confirmDialogTitle = ''
      state.confirmDialogText = ''
      state.confirmObject = undefined
    }

    function showApplyPaymentButton (item): boolean {
      return !item.hasPendingPayment && item.amountOwing > 0
    }

    function showCancelPaymentButton (item): boolean {
      return item.hasPendingPayment && !item.hasMultipleStatements
    }

    function showUnlinkAccountButton (item): boolean {
      if (!item.isParentRow || item.statementsOwing.length > 1 ||
        item.hasPendingPayment) return false

      return (!item.hasPayableStatement || item.amountOwing === 0)
    }

    function showConfirmCancelPaymentModal (item) {
      state.confirmDialogTitle = 'Cancel Payment'
      state.confirmDialogText = 'The applied amount will be returned to the short name.'
      state.confirmObject = { item: item, type: ConfirmationType.CANCEL_PAYMENT }
      confirmationDialog.value.open()
    }

    function showConfirmUnlinkAccountModal (item) {
      state.confirmDialogTitle = 'Unlink Account'
      state.confirmDialogText = 'The link with this account will be removed.'
      state.confirmObject = { item: item, type: ConfirmationType.UNLINK_ACCOUNT }
      confirmationDialog.value.open()
    }

    async function cancelPayment (item) {
      state.loading = true
      try {
        const params = {
          action: ShortNamePaymentActions.CANCEL,
          accountId: item.accountId,
          statementId: !item.isParentRow ? item.statementId : undefined
        }
        await PaymentService.postShortnamePaymentAction(props.shortNameDetails.id, params)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('An errored occurred cancelling payments pending.', error)
      }
      emit('on-payment-action')
      state.loading = false
    }

    async function unlinkAccount (item) {
      const response = await PaymentService.unlinkShortNameAccount(props.shortNameDetails.id, item.id)
      if (!response) {
        throw new Error('No response from delete short name link')
      }
      await loadShortNameLinks()
    }

    async function getEFTShortNameSummaries () {
      const filters = {
        filterPayload: {
          shortNameId: props.shortNameDetails.id
        }
      }
      const EFTShortNameSummaries = await PaymentService.getEFTShortNameSummaries(filters)
      if (EFTShortNameSummaries.data && EFTShortNameSummaries.data.items.length > 0) {
        state.eftShortNameSummary = EFTShortNameSummaries.data.items[0]
      }
    }

    async function loadShortNameLinks () {
      try {
        state.loading = true
        const response = await PaymentService.getEFTShortNameLinks(props.shortNameDetails.id)
        if (response?.data) {
          /* We use appendToResults for infinite scroll, so we keep the existing results. */
          state.results = response.data.items
          state.totalResults = response.data.items.length
          state.results = state.results.map(statement => {
            statement.isParentRow = true
            return statement
          })
          await processStatements()
          await evaluateLinks()
        } else {
          throw new Error('No response from loadShortNameLinks')
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to loadShortNameLinks list.', error)
      }
      state.loading = false
    }

    watch(() => props.shortNameDetails, () => {
      getEFTShortNameSummaries()
      loadShortNameLinks()
    })

    return {
      ...toRefs(state),
      state,
      headers,
      isLinked,
      confirmationDialog,
      openAccountLinkingDialog,
      closeShortNameLinkingDialog,
      dialogConfirm,
      dialogConfirmClose,
      showConfirmCancelPaymentModal,
      showConfirmUnlinkAccountModal,
      onLinkAccount,
      applyPayment,
      showApplyPaymentButton,
      showCancelPaymentButton,
      showUnlinkAccountButton,
      getEFTShortNameSummaries,
      formatCurrency: CommonUtils.formatAmount,
      formatAccountDisplayName: CommonUtils.formatAccountDisplayName,
      toggleStatementsView,
      isStatementsExpanded,
      processStatements
    }
  }
})
</script>

<style lang="scss" scoped>
@import '$assets/scss/tooltips.scss';
@import '$assets/scss/theme.scss';
@import '$assets/scss/actions.scss';
@import '$assets/scss/ShortnameTables.scss';

  .dialog-button-container {
    width: 100%;
    .v-btn {
      width: 106px
    }
  }
  .card-title {
    background-color: $app-lt-blue;
    justify-content: left;
    height: 75px;
    font-weight: bold;
    font-size: 1.125rem;

    .v-icon {
      font-size: 36px;
    }
  }

  .base-table__item-row-green {
    background-color: $table-green !important;
  }
  .v-card {
    > div:first-of-type {
      padding: 0!important;
    }
  }

  ::v-deep {
    .base-table__item-cell {
      vertical-align: top;
    }
    .base-table__header__title{
      padding: 16px
    }
    .new-actions {
      .v-list {
        width:206px
      }
    }

    // Remove border for rows that are expanded with additional information
    tr:has(+ tr.expanded-item-row) td {
      border-bottom: none !important;
    }
  }

  .single-action-btn {
    border-radius: 4px !important;
  }

  .expanded-item-row {
    td {
      .expanded-item {
        display: grid;
        max-width: 80%;
        font-size: 16px;
        grid-template-columns: 35px 1fr;
        align-items: start;
        color: $gray7;

        .v-icon {
          justify-content: left;
          grid-column: 1;
          padding-right: 4px !important;
          margin-right: 0px !important;
        }
      }

      .alert-item {
        .v-icon{
          color: $app-alert-orange;
        }
      }
    }
  }

  .child-statement-row {
    font-weight: normal;
  }

  .statement-view-link {
    color: $app-blue;
    font-weight: normal;
  }

  .expansion-icon {
    background-color: $app-blue;
    border-radius: 50%;
    color: white !important;
    transform: translateY(-1px);
  }

  .red-warning-icon {
    color: $app-red !important;
    transform: translateY(-1px);
  }

  .disabled-action {
    pointer-events: none;
    opacity: 0.4;
  }
</style>
