<template>
  <div>
    <div
      class="section-heading pa-4"
    >
      <h3>
        <v-icon
          color="primary"
          style="margin-top: -2px;"
        >
          mdi-format-list-bulleted
        </v-icon>
        {{ tableTitle }}
                  <span class="font-weight-regular">
                    ({{ total }})
                  </span>
        <v-progress-circular
          v-if="loading"
          color="primary"
          indeterminate
          size="20"
        />
      </h3>
    </div>
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
      class="refund-requests-list"
      id="refund-requests-table"
      :clearFiltersTrigger="clearFiltersTrigger"
      itemKey="id"
      :loading="loading"
      loadingText="Loading Refund Requests..."
      noDataText="No refund request pending"
      :setItems="items"
      :setHeaders="headers"
      :setTableDataOptions="tableDataOptions"
      :totalItems="total"
      :filters="filters"
      :updateFilter="updateFilter"
      @update-table-options="tableDataOptions = $event"
    >
      <template #header-filter-slot-requestedDate>
        <div @click="clickDatePicker()">
          <v-text-field
            v-model="dateRangeText"
            class="base-table__header__filter__textbox date-filter"
            :append-icon="'mdi-calendar'"
            clearable
            dense
            filled
            hide-details
            :placeholder="'Request Date'"
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
      <template #item-slot-requestedDate="{ item }">
        <span>{{ formatDate(item.requestedDate, dateDisplayFormat) }}</span>
      </template>
      <template #item-slot-paymentMethod="{ item }">
        <span>{{ getPaymentTypeDisplayName(item.paymentMethod) }}</span>
      </template>
      <template #item-slot-transactionAmount="{ item }">
        <span>{{ formatAmount(item.transactionAmount) }}</span>
      </template>
      <template #item-slot-refundAmount="{ item }">
        <span>{{ formatAmount(item.refundAmount) }}</span>
      </template>
      <template #item-slot-actions="{ index }">
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
            View Detail
          </v-btn>
        </div>
      </template>
    </BaseVDataTable>
  </div>
</template>
<script lang="ts">
import {
  RefundStatus, RouteNames
} from '@/util/constants'
import { defineComponent, onMounted, reactive, ref, toRefs, watch } from '@vue/composition-api'
import { BaseVDataTable, DatePicker } from '../datatable'
import CommonUtils from '@/util/common-util'
import { DEFAULT_DATA_OPTIONS } from '../datatable/resources/index'
import _ from 'lodash'
import { useRefundRequestTable } from '@/composables/refund/refund-request-table-factory'
import { RefundRequestState } from '@/models/refund-request'
import { getPaymentTypeDisplayName, PaymentMethodSelectItems } from '@/util/payment-type-display'
import moment from 'moment-timezone'
import { DataOptions } from 'vuetify'

export default defineComponent({
  name: 'RefundRequestsTable',
  components: { DatePicker, BaseVDataTable },
  props: {
    currentTab: { default: 0 },
    tableTitle: { default: '' }
  },
  setup (props, { emit, root }) {
    const dateDisplayFormat = 'MMMM DD, YYYY'
    const dateRangeFormat = 'YYYY-MM-DD'
    const datePicker = ref(null)
    const state = reactive<RefundRequestState>({
      items: [],
      statusTotal: 0,
      total: 0,
      filters: {
        pageNumber: 1,
        pageLimit: 5,
        filterPayload: defaultFilterPayload()
      },
      loading: false,
      actionDropdown: [],
      tableDataOptions: _.cloneDeep(DEFAULT_DATA_OPTIONS),
      clearFiltersTrigger: 0,
      dateRangeReset: 0,
      showDatePicker: false,
      dateRangeSelected: false,
      dateRangeText: '',
      startDate: '',
      endDate: ''
    })

    const { loadTableData, updateFilter } = useRefundRequestTable(state, emit)
    const createHeader = (col, label, type, value, hasFilter = true, minWidth = '125px',
      width = '125px', filterItems = []) => ({
      col,
      customFilter: {
        filterApiFn: hasFilter ? (val: any) => loadTableData(col, val || '') : null,
        clearable: true,
        items: filterItems.length > 0 ? filterItems : undefined,
        label,
        type
      },
      hasFilter,
      minWidth,
      width,
      value
    })

    const headers = [
      createHeader(
        'requestedBy',
        'Requested By',
        'text',
        'Requested By',
        true,
        '180px'
      ),
      createHeader(
        'requestedDate',
        'Request Date',
        'text',
        'Request Date',
        false,
        '180px'
      ),
      createHeader(
        'refundReason',
        'Reason for Refund',
        'text',
        'Reason for Refund',
        true,
        '200px',
        '200px'
      ),
      createHeader(
        'transactionAmount',
        'Transaction Amount',
        'text',
        'Transaction Amount',
        true,
        '200px'
      ),
      createHeader(
        'refundAmount',
        'Refund Amount',
        'text',
        'Refund Amount',
        true,
        '200px'
      ),
      createHeader(
        'paymentMethod',
        'Payment Method',
        'select',
        'Payment Method',
        true,
        '200px',
        '200px',
        PaymentMethodSelectItems
      ),
      {
        col: 'actions',
        hasFilter: false,
        minWidth: '164px',
        value: 'Actions',
        width: '130px',
        class: 'fixed-action-column',
        itemClass: 'fixed-action-column'
      }
    ]

    async function clearFilters (): Promise<void> {
      state.clearFiltersTrigger++
      state.filters.filterPayload = defaultFilterPayload()
      state.filters.isActive = false
      await loadTableData()
    }

    function defaultFilterPayload () {
      return { refundStatus: RefundStatus.PENDING_APPROVAL }
    }

    function formatAmount (amount: number) {
      return amount !== undefined ? CommonUtils.formatAmount(amount) : ''
    }

    function viewDetails (index) {
      root.$router?.push({
        name: RouteNames.TRANSACTION_VIEW,
        params: {
          mode: 'refund-request',
          invoiceId: state.items[index].invoiceId?.toString(),
          refundId: state.items[index].refundId?.toString()
        }
      })
    }

    async function loadData () {
      await loadTableData()
    }

    async function clickDatePicker () {
      state.showDatePicker = true
    }

    function setDateRangeText (startDate: string, endDate: string) {
      if (!startDate || !endDate) {
        return
      }
      state.startDate = moment(startDate).format(dateRangeFormat)
      state.endDate = moment(endDate).format(dateRangeFormat)
      return `${state.startDate} - ${state.endDate}`
    }

    async function updateDateRange ({ endDate, startDate }: { endDate?: string, startDate?: string }) {
      state.showDatePicker = false
      state.dateRangeSelected = !!(endDate && startDate)
      if (!state.dateRangeSelected) { endDate = ''; startDate = '' }
      const startDateString = CommonUtils.getTimezoneDateString(startDate, 'start')
      const endDateString = CommonUtils.getTimezoneDateString(endDate, 'end')
      state.dateRangeText = state.dateRangeSelected ? setDateRangeText(startDateString, endDateString) : ''
      state.filters.filterPayload.requestedStartDate = startDateString
      state.filters.filterPayload.requestedEndDate = endDateString

      await loadTableData()
    }

    watch(() => props.currentTab, () => {
      loadData()
    })

    onMounted(async () => {
      await loadData()
    })

    watch(() => state.tableDataOptions, (val: DataOptions) => {
      const newPage = val?.page || DEFAULT_DATA_OPTIONS.page
      const newLimit = val?.itemsPerPage || DEFAULT_DATA_OPTIONS.itemsPerPage
      if (state.filters.pageNumber !== newPage || state.filters.pageLimit !== newLimit) {
        state.filters.pageNumber = val?.page || DEFAULT_DATA_OPTIONS.page
        state.filters.pageLimit = val?.itemsPerPage || DEFAULT_DATA_OPTIONS.itemsPerPage
        loadTableData()
      }
    })

    return {
      ...toRefs(state),
      clearFilters,
      headers,
      state,
      updateFilter,
      viewDetails,
      formatAmount,
      getPaymentTypeDisplayName,
      dateDisplayFormat,
      datePicker,
      clickDatePicker,
      updateDateRange,
      formatDate: CommonUtils.formatUtcToPacificDate
    }
  }
})
</script>

<style lang="scss" scoped>
  @import '$assets/scss/theme.scss';
  @import '$assets/scss/actions.scss';

  ::v-deep {
    h2 {
      font-size: 1.125rem;
      letter-spacing: 0.25px;
    }

    .base-table__header__title {
      padding-top: 16px;
    }

    .base-table__header__filter {
      padding-left: 16px;
      padding-right: 4px;
      .v-input {
        font-size: 14px;
        color: #495057;
      }
    }
    .base-table__item-row {
      color: #495057;
      font-weight: bold;
    }
    .base-table__item-cell {
      padding: 16px 0 16px 16px !important;
      vertical-align: middle;
    }
  }

  .section-heading {
    background-color: $app-background-blue;
    border-radius: 5px 5px 0 0;
  }

  .v-btn {
    border-radius: 4px !important;
    height: 40px !important;
    padding: 0 24px 0 24px !important;
    top: -5px;
  }

  .refund-requests-list {
    overflow: visible;
  }
</style>
