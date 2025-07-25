<template>
  <div>
    <v-snackbar
      id="linked-account-snackbar"
      v-model="snackbar"
      :timeout="4000"
      transition="fade"
    >
      {{ snackbarText }}
    </v-snackbar>
    <ShortNameLinkingDialog
      :isShortNameLinkingDialogOpen="isShortNameLinkingDialogOpen"
      :selectedShortName="selectedShortName"
      @close-short-name-linking-dialog="closeShortNameLinkingDialog"
      @on-link-account="onLinkAccount"
    />
    <DatePicker
      v-show="showDatePicker"
      ref="datePicker"
      :reset="dateRangeReset"
      class="date-picker"
      :setEndDate="endDate"
      :setStartDate="startDate"
      @submit="updateDateRange($event)"
    />
    <BaseVDataTable
      id="short-name-summaries"
      :clearFiltersTrigger="clearFiltersTrigger"
      itemKey="id"
      :loading="loading"
      loadingText="Loading Short names..."
      noDataText="No records to show."
      :setItems="results"
      :setHeaders="headers"
      :setTableDataOptions="options"
      :hasTitleSlot="true"
      :totalItems="totalResults"
      :pageHide="true"
      :filters="filters"
      :updateFilter="updateFilter"
      :useObserver="true"
      :observerCallback="() => infiniteScrollCallback(true)"
      :highlight-index="highlightIndex"
      highlight-class="base-table__item-row-green"
      @update-table-options="options = $event"
    >
      <template #header-title>
        <h2 class="ml-4 py-6">
          All Short Names
          <span class="font-weight-regular">
            ({{ totalResults }})
          </span>
        </h2>
      </template>
      <template #item-slot-shortName="{ item }">
        <span>{{ item.shortName }}</span>
      </template>
      <template #header-filter-slot-lastPaymentReceivedDate>
        <div @click="clickDatePicker()">
          <v-text-field
            v-model="dateRangeText"
            class="base-table__header__filter__textbox date-filter"
            :append-icon="'mdi-calendar'"
            clearable
            dense
            filled
            hide-details
            :placeholder="'Last Payment Received Date'"
            :value="dateRangeSelected ? 'Custom' : ''"
            @click:clear="dateRangeReset++"
          />
        </div>
      </template>
      <template #header-filter-slot-actions>
        <v-btn
          v-if="filters.isActive"
          class="clear-btn mx-auto mt-auto"
          color="primary"
          outlined
          @click="clearFilters()"
        >
          Clear Filters
          <v-icon class="ml-1 mt-1">
            mdi-close
          </v-icon>
        </v-btn>
      </template>
      <template #item-slot-lastPaymentReceivedDate="{ item }">
        <span>{{ formatDate(item.lastPaymentReceivedDate, dateDisplayFormat) }}</span>
      </template>
      <template #item-slot-shortNameType="{ item }">
        <span>{{ getShortNameTypeDescription(item.shortNameType) }}</span>
      </template>
      <template #item-slot-creditsRemaining="{ item }">
        <span class="pr-2">{{ formatAmount(item.creditsRemaining) }}</span>
        <v-chip
          v-if="item.refundStatus === ShortNameRefundStatus.PENDING_APPROVAL"
          small
          label
          text-color="white"
          class="primary pl-2 pr-2"
        >
          {{ ShortNameRefundLabel.PENDING_APPROVAL }}
        </v-chip>
      </template>
      <template #item-slot-linkedAccountsCount="{ item }">
        <span>{{ item.linkedAccountsCount }}</span>
      </template>
      <template #item-slot-actions="{ item, index }">
        <div
          :id="`action-menu-${index}`"
          class="new-actions mx-auto"
        >
          <v-btn
            small
            color="primary"
            min-width="5rem"
            min-height="2rem"
            class="open-action-btn"
            @click="viewDetails(index)"
          >
            View Details
          </v-btn>
          <span class="more-actions">
            <v-menu
              v-model="actionDropdown[index]"
              :attach="`#action-menu-${index}`"
              offset-y
              nudge-left="130"
            >
              <template #activator="{ on }">
                <v-btn
                  small
                  color="primary"
                  min-height="2rem"
                  class="more-actions-btn"
                  v-on="on"
                >
                  <v-icon>{{ actionDropdown[index] ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  class="actions-dropdown_item"
                  data-test="link-account-button"
                >
                  <v-list-item-subtitle
                    @click="openAccountLinkingDialog(item)"
                  >
                    <v-icon small>mdi-plus</v-icon>
                    <span class="pl-1 cursor-pointer">{{ item.linkedAccountsCount > 0 ? 'Add Linkage' : 'Link to Account' }}</span>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-menu>
          </span>
        </div>
      </template>
    </BaseVDataTable>
  </div>
</template>
<script lang="ts">
import { BaseVDataTable, DatePicker } from '@/components/datatable'
import { Ref, defineComponent, onMounted, reactive, ref, toRefs, watch } from '@vue/composition-api'
import {
  RouteNames,
  SessionStorageKeys,
  ShortNameRefundLabel,
  ShortNameRefundStatus
} from '@/util/constants'
import CommonUtils from '@/util/common-util'
import ConfigHelper from '@/util/config-helper'
import { DEFAULT_DATA_OPTIONS } from '../datatable/resources'
import { EFTShortnameResponse } from '@/models/eft-transaction'
import ModalDialog from '@/components/common/ModalDialog.vue'
import ShortNameLinkingDialog from '@/components/eft/ShortNameLinkingDialog.vue'
import { ShortNameSummaryState } from '@/models/short-name'
import ShortNameUtils from '@/util/short-name-util'
import _ from 'lodash'
import { useShortNameTable } from '@/composables/eft/short-name-table-factory'
import moment from 'moment-timezone'

export default defineComponent({
  name: 'ShortNameSummaryTable',
  components: { BaseVDataTable, DatePicker, ShortNameLinkingDialog },
  props: {
    linkedAccount: { default: {} },
    currentTab: { default: 0 }
  },
  emits: ['on-link-account'],
  setup (props, { emit, root }) {
    const dateDisplayFormat = 'MMMM DD, YYYY'
    const dateRangeFormat = 'YYYY-MM-DD'
    const datePicker = ref(null)
    const accountLinkingDialog: Ref<InstanceType<typeof ModalDialog>> = ref(null)
    const accountLinkingErrorDialog: Ref<InstanceType<typeof ModalDialog>> = ref(null)
    const state = reactive<ShortNameSummaryState>({
      results: [],
      totalResults: 1,
      filters: {
        isActive: false,
        pageNumber: 1,
        pageLimit: 20,
        filterPayload: defaultFilterPayload()
      },
      loading: false,
      actionDropdown: [],
      options: _.cloneDeep(DEFAULT_DATA_OPTIONS),
      shortNameLookupKey: 0,
      dateRangeReset: 0,
      clearFiltersTrigger: 0,
      selectedShortName: {},
      showDatePicker: false,
      dateRangeSelected: false,
      dateRangeText: '',
      accountLinkingErrorDialogTitle: '',
      accountLinkingErrorDialogText: '',
      isShortNameLinkingDialogOpen: false,
      startDate: '',
      endDate: '',
      highlightIndex: -1,
      snackbar: false,
      snackbarText: ''
    })
    const {
      infiniteScrollCallback, loadTableSummaryData, updateFilter
    } = useShortNameTable(state, emit)
    const createHeader = (col, label, type, value, filterValue = '', hasFilter = true, minWidth = '125px',
      width = '125px', filterItems = []) => ({
      col,
      customFilter: {
        filterApiFn: hasFilter ? (val: any) => loadTableSummaryData(col, val || '') : null,
        clearable: true,
        items: filterItems.length > 0 ? filterItems : undefined,
        label,
        type,
        value: filterValue
      },
      hasFilter,
      minWidth,
      width,
      value
    })

    const {
      shortName = '',
      shortNameType = '',
      lastPaymentReceivedDate = '',
      creditsRemaining = '',
      linkedAccountsCount = ''
    } = JSON.parse(ConfigHelper.getFromSession(SessionStorageKeys.ShortNamesSummaryFilter) || '{}')

    const headers = [
      createHeader(
        'shortName',
        'Bank Short Name',
        'text',
        'Short Name',
        shortName,
        true,
        '200px',
        '200px'
      ),
      createHeader(
        'shortNameType',
        'Type',
        'select',
        'Type',
        shortNameType,
        true,
        '200px',
        '200px',
        ShortNameUtils.ShortNameTypeItems
      ),
      createHeader(
        'lastPaymentReceivedDate',
        'Last Payment Received Date',
        'text',
        'Last Payment Received Date',
        lastPaymentReceivedDate,
        false,
        '275px',
        '275px'
      ),
      createHeader(
        'creditsRemaining',
        'Unsettled Amount',
        'text',
        'Unsettled Amount <i class="v-icon notranslate mdi mdi-arrow-down theme--light"></i>',
        creditsRemaining,
        true,
        '215px',
        '215px'
      ),
      createHeader(
        'linkedAccountsCount',
        'Linked Accounts',
        'text',
        'Linked Accounts',
        linkedAccountsCount,
        true,
        '175px',
        '175px'
      ),
      {
        col: 'actions',
        hasFilter: false,
        value: 'Actions',
        minWidth: '200px'
      }
    ]

    function defaultFilterPayload () {
      return {
        shortName: '',
        shortNameType: '',
        creditsRemaining: '',
        linkedAccountsCount: '',
        paymentReceivedStartDate: '',
        paymentReceivedEndDate: ''
      }
    }

    function formatAmount (amount: number) {
      return amount !== undefined ? CommonUtils.formatAmount(amount) : ''
    }

    function openAccountLinkingDialog (item: EFTShortnameResponse) {
      state.selectedShortName = item
      state.isShortNameLinkingDialogOpen = true
    }

    function closeShortNameLinkingDialog () {
      state.selectedShortName = {}
      state.isShortNameLinkingDialogOpen = false
    }

    function resetAccountLinkingDialog () {
      state.shortNameLookupKey++
    }

    function cancelAndResetAccountLinkingDialog () {
      accountLinkingDialog.value.close()
      resetAccountLinkingDialog()
    }

    function closeAccountAlreadyLinkedDialog () {
      accountLinkingErrorDialog.value.close()
    }

    function viewDetails (index) {
      root.$router?.push({
        name: RouteNames.SHORTNAME_DETAILS,
        params: {
          shortNameId: state.results[index].id.toString()
        }
      })
    }

    function setDateRangeText (startDate: string, endDate: string) {
      if (!startDate || !endDate) {
        return
      }
      state.startDate = moment(startDate).format(dateRangeFormat)
      state.endDate = moment(endDate).format(dateRangeFormat)
      return `${state.startDate} - ${state.endDate}`
    }

    async function onLinkAccount (account: any) {
      emit('on-link-account', account)
      await loadTableSummaryData('page', 1)
    }

    async function updateDateRange ({ endDate, startDate }: { endDate?: string, startDate?: string }): void {
      state.showDatePicker = false
      state.dateRangeSelected = !!(endDate && startDate)
      if (!state.dateRangeSelected) { endDate = ''; startDate = '' }
      const startDateString = getTimezoneDateString(startDate, 'start')
      const endDateString = getTimezoneDateString(endDate, 'end')
      state.dateRangeText = state.dateRangeSelected ? setDateRangeText(startDateString, endDateString) : ''
      state.filters.filterPayload.paymentReceivedStartDate = startDateString
      state.filters.filterPayload.paymentReceivedEndDate = endDateString
      ConfigHelper.addToSession(SessionStorageKeys.ShortNamesSummaryFilter, JSON.stringify(state.filters.filterPayload))
      await loadTableSummaryData('page', 1)
    }

    async function clickDatePicker () {
      state.showDatePicker = true
    }

    function getTimezoneDateString (dateString: string, type: string): string {
      const clientTimezone = moment.tz.guess()
      if (type === 'start') {
        return moment.tz(dateString, clientTimezone).startOf('day').toISOString()
      } else if (type === 'end') {
        return moment.tz(dateString, clientTimezone).endOf('day').toISOString()
      } else {
        return ''
      }
    }

    async function clearFilters () {
      state.clearFiltersTrigger++
      state.dateRangeReset++
      state.filters.filterPayload = defaultFilterPayload()
      state.filters.isActive = false
      await loadTableSummaryData()
    }

    async function onLinkedAccount (account: EFTShortnameResponse) {
      if (!account) return

      const { results } = state
      const shortName = results.find(result => result.id === account.shortNameId)

      if (!shortName) return

      state.snackbarText = `Bank short name ${shortName.shortName} was successfully linked.`
      state.highlightIndex = results.indexOf(shortName)
      state.snackbar = true

      setTimeout(() => {
        state.highlightIndex = -1
      }, 4000)
    }

    watch(() => props.linkedAccount, (account: EFTShortnameResponse) => {
      onLinkedAccount(account)
    })

    watch(() => props.currentTab, () => {
      loadData()
    })

    onMounted(async () => {
      await loadData()
    })

    async function loadData () {
      const orgSearchFilter = ConfigHelper.getFromSession(SessionStorageKeys.ShortNamesSummaryFilter)
      if (orgSearchFilter) {
        try {
          const payload = JSON.parse(orgSearchFilter)
          state.filters.filterPayload = payload
          if (payload.paymentReceivedStartDate) {
            state.dateRangeText = setDateRangeText(payload.paymentReceivedStartDate, payload.paymentReceivedEndDate)
          }
        } catch {
          // Silent catch
        }
      }
      await loadTableSummaryData()
    }

    watch(() => state.filters, (filters: any) => {
      ConfigHelper.addToSession(SessionStorageKeys.ShortNamesSummaryFilter, JSON.stringify(filters.filterPayload))
    }, { deep: true })

    return {
      ...toRefs(state),
      clearFilters,
      infiniteScrollCallback,
      headers,
      updateFilter,
      formatAmount,
      formatDate: CommonUtils.formatUtcToPacificDate,
      dateDisplayFormat,
      updateDateRange,
      onLinkAccount,
      clickDatePicker,
      accountLinkingDialog,
      accountLinkingErrorDialog,
      openAccountLinkingDialog,
      closeShortNameLinkingDialog,
      resetAccountLinkingDialog,
      cancelAndResetAccountLinkingDialog,
      closeAccountAlreadyLinkedDialog,
      datePicker,
      viewDetails,
      ShortNameRefundStatus,
      ShortNameRefundLabel,
      getShortNameTypeDescription: ShortNameUtils.getShortNameTypeDescription
    }
  }
})
</script>

<style lang="scss" scoped>
@import '$assets/scss/theme.scss';
@import '$assets/scss/actions.scss';
@import '$assets/scss/ShortnameTables.scss';

#short-name-summaries {
  border: 1px solid $gray2;
}
.new-actions {
  display: flex;
  .v-list {
    width:180px
  }
}
</style>
