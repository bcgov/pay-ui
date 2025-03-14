<template>
  <div class="fas-search">
    <v-row
      class="d-flex flex-row align-center"
      :class="isLibraryMode ? 'justify-end' : 'justify-space-between'"
      no-gutters
    >
      <v-col  sm="4" cols="12" v-if="!isLibraryMode">
        <v-btn
          class="font-weight-bold"
          large
          dark
          color="primary"
          @click="addRoutingSlip"
          v-can:fas_create.hide
        >
          <v-icon dark small class="mr-2 font-weight-bold">
            mdi-plus
          </v-icon>
          Add New Routing Slip
        </v-btn>
      </v-col>
      <v-col sm="3" cols="12" align-self="center" v-if="isLibraryMode">
        <v-btn x-large dark outlined color="primary" :href="fasUrl">
          Access Fee Accounting System
          <v-icon dark small class="ml-2 font-weight-bold">
            mdi-open-in-new
          </v-icon>
        </v-btn>
      </v-col>
      <v-col sm="2" cols="12">
        <SearchColumnFilterComponent v-model="headerSearch" hide-details>
        </SearchColumnFilterComponent>
      </v-col>
    </v-row>
    <v-row class="mt-0">
      <v-col>
        <div class="header-bg-color d-flex align-center py-5 mb-0 rounded-t-lg">
          <v-icon color="primary" class="ml-5">
            mdi-view-list
          </v-icon>
          <h4 class="ml-2 mb-0 font-weight-bold">
            {{ isLibraryMode ? 'Recent Routing Slip' : 'Search Routing Slip' }}
          </h4>
        </div>
        <v-form>
          <v-row dense class="row-margin">
            <v-col sm="12" cols="12">
              <transition name="slide-fade">
                <v-data-table
                  :headers="headerSearch"
                  :items="searchRoutingSlipResult"
                  item-key="name"
                  class="elevation-1"
                  sort-by="routingSlipNumber"
                  hide-default-header
                  hide-default-footer
                  fixed-header
                  height="40rem"
                  :loading="isLoading"
                  disable-pagination
                  :mobile-breakpoint="0"
                >
                  <template v-slot:no-data>
                    <div
                      class="py-8 no-data"
                      v-html="
                        $t(
                          !searchParamsExist
                            ? 'searchNoResult'
                            : 'searchStartMessage'
                        )
                      "
                    ></div>
                  </template>
                  <template v-slot:header="{}">
                    <thead class="v-data-table-header">
                      <tr class="header-row-1">
                        <th
                          v-for="(header, i) in displayedHeaderSearch"
                          :scope="i"
                          :key="'find-header-' + i"
                          :class="[
                            header.value !== '' ? 'text-start' : 'text-end',
                            header.className && `header-${header.className}`
                          ]"
                          class="font-weight-bold"
                        >
                          {{ header.text }}
                        </th>
                      </tr>

                      <tr class="header-row-2 mt-2 px-2">
                        <th
                          scope="routingSlipNumber"
                          v-if="canShowColumn('routingSlipNumber')"
                        >
                          <!-- canShowColumn {{canShowColumn('routingSlipNumber')}} -->
                          <v-text-field
                            id="routingSlipNumber"
                            autocomplete="off"
                            class="text-input-style "
                            filled
                            placeholder="Routing Slip Number"
                            v-model.trim="routingSlipNumber"
                            @input="debouncedSearch()"
                            dense
                            hide-details="auto"
                          />
                        </th>

                        <th
                          scope="receiptNumber"
                          v-if="canShowColumn('receiptNumber')"
                        >
                          <v-text-field
                            id="receiptNumber"
                            autocomplete="off"
                            class="text-input-style "
                            filled
                            placeholder="Receipt Number"
                            v-model.trim="receiptNumber"
                            @input="debouncedSearch()"
                            hide-details="auto"
                          />
                        </th>
                        <th
                          scope="accountName"
                          v-if="canShowColumn('accountName')"
                        >
                          <v-text-field
                            id="accountName"
                            autocomplete="off"
                            class="text-input-style "
                            filled
                            placeholder="Entity Number"
                            v-model.trim="accountName"
                            @input="debouncedSearch()"
                            hide-details="auto"
                          />
                        </th>
                        <th
                          scope="createdName"
                          v-if="canShowColumn('createdName')"
                        >
                          <v-text-field
                            id="createdName"
                            autocomplete="off"
                            class="text-input-style "
                            filled
                            placeholder="Created By"
                            v-model.trim="initiator"
                            @input="debouncedSearch()"
                            hide-details="auto"
                          />
                        </th>
                        <th scope="date" v-if="canShowColumn('date')">
                          <DateRangeFilter
                            class="text-input-style "
                            v-model="dateFilter"
                            @applied="searchNow()"
                            hide-details="auto"
                            placeholder="Date"
                          >
                          </DateRangeFilter>
                        </th>
                        <th scope="status" v-if="canShowColumn('status')">
                          <div class="mt-0">
                          <!-- Placeholder work around, until we upgrade Vuetify in sbc-auth -->
                            <status-list
                              column="status"
                              class="text-input-style "
                              v-model="status"
                              @change="searchNow()"
                              hide-details="auto"
                              :placeholder="!status ? 'Status' : ''"
                            ></status-list>
                          </div>
                        </th>
                        <th scope="refundStatus" v-if="canShowColumn('refundStatus')">
                          <div class="mt-0">
                            <status-list
                              column="refundStatus"
                              class="text-input-style "
                              v-model="refundStatus"
                              @change="searchNow()"
                              hide-details="auto"
                              :placeholder="!refundStatus ? 'Refund Status' : ''"
                            ></status-list>
                          </div>
                        </th>
                        <th
                          scope="businessIdentifier"
                          v-if="canShowColumn('businessIdentifier')"
                        >
                          <v-text-field
                            id="businessIdentifier"
                            autocomplete="off"
                            class="text-input-style "
                            filled
                            placeholder="Reference Numbers"
                            v-model.trim="businessIdentifier"
                            @input="debouncedSearch()"
                            hide-details="auto"
                          />
                        </th>
                        <th
                          scope="chequeReceiptNumber"
                          v-if="canShowColumn('chequeReceiptNumber')"
                        >
                          <v-text-field
                            id="chequeReceiptNumber"
                            autocomplete="off"
                            class="text-input-style "
                            filled
                            placeholder="Cheque Number"
                            v-model.trim="chequeReceiptNumber"
                            @input="debouncedSearch()"
                            hide-details="auto"
                          />
                        </th>
                        <th scope="remainingAmount" v-if="canShowColumn('remainingAmount')">
                          <v-text-field
                            id="remainingAmount"
                            autocomplete="off"
                            class="text-input-style "
                            filled
                            placeholder="Balance"
                            v-model.trim="remainingAmount"
                            @input="debouncedSearch()"
                            hide-details="auto"
                          />
                        </th>
                        <th>
                          <v-btn v-if="!searchParamsExist"
                          outlined
                          color="primary"
                          class="action-btn clear-filter-button"
                          @click="clearFilter"
                        >
                          <span class="clear-filter cursor-pointer">
                            Clear Filters
                            <v-icon small color="primary">mdi-close</v-icon>
                          </span>
                        </v-btn>
                        </th>
                      </tr>
                    </thead>
                  </template>

                  <template v-slot:item="{ item }">
                    <transition name="slide-fade">
                      <tr v-if="!isLoading" class="rs-search-result">
                        <td v-if="canShowColumn('routingSlipNumber')">
                          {{ item.number ? item.number : '-' }}
                        </td>
                        <td v-if="canShowColumn('receiptNumber')">
                          <!-- if cash show number else - -->
                          {{
                            item.paymentAccount &&
                            item.paymentAccount.paymentMethod === 'CASH'
                              ? item.payments &&
                                item.payments[0] &&
                                item.payments[0].chequeReceiptNumber
                              : '-'
                          }}
                        </td>
                        <td v-if="canShowColumn('accountName')">
                          {{ item.paymentAccount.accountName ? item.paymentAccount.accountName : '-' }}
                        </td>
                         <td v-if="canShowColumn('createdName')">
                          {{ item.createdName ? item.createdName : '-' }}
                        </td>
                        <td v-if="canShowColumn('date')">
                          {{
                            item.routingSlipDate
                              ? formatDisplayDate(
                                  item.routingSlipDate,
                                  'MMMM DD, YYYY'
                                )
                              : '-'
                          }}
                        </td>
                        <td v-if="canShowColumn('status')">
                          <span
                            :class="colors(item.status)"
                            data-test="label-status"
                            >{{
                              getStatusLabel(item.status)
                                ? getStatusLabel(item.status)
                                : '-'
                            }}</span
                          >
                        </td>
                        <td v-if="canShowColumn('refundStatus')">
                          <span
                            v-if="item.refundStatus !== chequeRefundCodes.CHEQUE_UNDELIVERABLE"
                            data-test="label-refund-status"
                          >
                            {{ item.refundStatus ? getRefundStatusText(item.refundStatus) : '-' }}
                          </span>
                          <v-chip
                            v-else
                            small
                            label
                            class="item-chip"
                            color="error"
                          >
                            {{ getRefundStatusText(item.refundStatus) }}
                          </v-chip>
                        </td>
                        <td v-if="canShowColumn('businessIdentifier')">
                          <span
                            v-if="
                              formatFolioResult(item).length > 0 &&
                                !showExpandedFolio.includes(item.id)
                            "
                            @click="toggleFolio(item.id)"
                            class="cursor-pointer"
                          >
                            {{ formatFolioResult(item)[0] }}
                            <v-icon
                              small
                              v-if="formatFolioResult(item).length > 1"
                              color="primary"
                            >
                              mdi-menu-down</v-icon
                            ></span
                          >
                          <template v-if="showExpandedFolio.includes(item.id)">
                            <div
                              v-for="(folio, index) in formatFolioResult(item)"
                              :key="index"
                              @click="index === 0 ? toggleFolio(item.id) : ''"
                              :class="index === 0 ? 'cursor-pointer' : ''"
                            >
                              <span>
                                {{ folio }}
                                <v-icon
                                  small
                                  v-if="index === 0"
                                  color="primary"
                                >
                                  mdi-menu-up</v-icon
                                ></span
                              >
                            </div>
                          </template>
                        </td>
                        <td v-if="canShowColumn('chequeReceiptNumber')">
                          <template
                            v-if="
                              item.paymentAccount &&
                                item.paymentAccount.paymentMethod ===
                                  PaymentMethods.CHEQUE
                            "
                          >
                            <span
                              v-if="
                                item.payments &&
                                  item.payments.length > 0 &&
                                  !showExpandedCheque.includes(
                                    item.payments[0].chequeReceiptNumber
                                  )
                              "
                              @click="
                                toggleCheque(
                                  item.payments[0].chequeReceiptNumber
                                )
                              "
                              class="cursor-pointer"
                            >
                              {{ item.payments[0].chequeReceiptNumber }}
                              <v-icon
                                small
                                v-if="item.payments.length > 1"
                                color="primary"
                              >
                                mdi-menu-down</v-icon
                              ></span
                            >
                            <template
                              v-if="
                                showExpandedCheque.includes(
                                  item.payments[0].chequeReceiptNumber
                                )
                              "
                            >
                              <div
                                v-for="(payment, index) in item.payments"
                                :key="index"
                                @click="
                                  index === 0
                                    ? toggleCheque(
                                        item.payments[0].chequeReceiptNumber
                                      )
                                    : ''
                                "
                                :class="index === 0 ? 'cursor-pointer' : ''"
                              >
                                <span>
                                  {{ payment.chequeReceiptNumber }}
                                  <v-icon
                                    small
                                    v-if="index === 0"
                                    color="primary"
                                  >
                                    mdi-menu-up</v-icon
                                  ></span
                                >
                              </div>
                            </template>
                          </template>
                          <template v-else>-</template>
                        </td>
                        <td v-if="canShowColumn('remainingAmount')" class="text-right">
                          <span class="font-weight-bold text-end">
                            {{
                              item.remainingAmount
                                ? appendCurrencySymbol(item.remainingAmount.toFixed(2))
                                : '-'
                            }}
                          </span>
                        </td>
                        <td class="action text-right">
                          <v-btn
                            color="primary"
                            class=""
                            @click="navigateTo(item.number)"
                          >
                            Open
                          </v-btn>
                        </td>
                      </tr>
                    </transition>
                  </template>

                  <template #[`body.append`]>
                    <tr v-if="!reachedEnd">
                      <td :colspan="displayedHeaderSearch.length">
                        <TableObserver @intersect="getNext()" />
                      </td>
                    </tr>
                  </template>
                </v-data-table>
              </transition>
            </v-col>
          </v-row>
        </v-form>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import '@/shims-vue-composition-api'
import { defineComponent } from '@vue/composition-api'
import { useSearch } from '@/composables/Dashboard/useSearch'
import DateRangeFilter from '@/components/common/DateRangeFilter.vue'
import SearchColumnFilterComponent from '@/components/common/SearchColumnFilterComponent.vue'
import statusListComponent from '@/components/common/StatusList.vue'
import TableObserver from '@/components/common/TableObserver.vue'
import commonUtil from '@/util/common-util'
import { useDashboard } from '@/composables/Dashboard'
import can from '@/directives/can'
import { PaymentMethods, chequeRefundCodes, ChequeRefundStatus } from '@/util/constants'

export default defineComponent({
  props: {
    isLibraryMode: {
      type: Boolean,
      default: false
    }
  },
  setup (props, context) {
    const { addRoutingSlip } = useDashboard(props, context)
    const {
      headerSearch,
      displayedHeaderSearch,
      status,
      refundStatus,
      routingSlipNumber,
      receiptNumber,
      dateFilter,
      businessIdentifier,
      accountName,
      remainingAmount,
      chequeReceiptNumber,
      searchRoutingSlipResult,
      applyDateFilter,
      searchNow,
      debouncedSearch,
      canShowColumn,
      getStatusLabel,
      searchParamsExist,
      clearFilter,
      formatFolioResult,
      showExpandedFolio,
      showExpandedCheque,
      toggleFolio,
      toggleCheque,
      isLoading,
      navigateTo,
      fasUrl,
      initiator,
      reachedEnd,
      getNext,
      getRefundStatusText
    } = useSearch(props, context)

    const colors = commonUtil.statusListColor
    const appendCurrencySymbol = commonUtil.appendCurrencySymbol
    const formatDisplayDate = commonUtil.formatDisplayDate

    return {
      headerSearch,
      displayedHeaderSearch,
      status,
      refundStatus,
      routingSlipNumber,
      receiptNumber,
      dateFilter,
      businessIdentifier,
      accountName,
      remainingAmount,
      chequeReceiptNumber,
      searchRoutingSlipResult,
      applyDateFilter,
      searchNow,
      debouncedSearch,
      canShowColumn,
      getStatusLabel,
      addRoutingSlip,
      searchParamsExist,
      clearFilter,
      formatFolioResult,
      showExpandedFolio,
      showExpandedCheque,
      toggleFolio,
      toggleCheque,
      isLoading,
      navigateTo,
      fasUrl,
      initiator,
      reachedEnd,
      getNext,
      colors,
      appendCurrencySymbol,
      formatDisplayDate,
      PaymentMethods,
      ChequeRefundStatus,
      getRefundStatusText,
      chequeRefundCodes
    }
  },
  components: {
    DateRangeFilter,
    SearchColumnFilterComponent,
    statusList: statusListComponent,
    TableObserver
  },
  directives: {
    can
  }
})
</script>

<style lang="scss">
@import '$assets/scss/theme.scss';
@import '$assets/scss/search.scss';
</style>
