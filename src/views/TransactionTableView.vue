<template>
  <v-app>
    <v-container
      class="container mt-7"
    >
      <v-row no-gutters>
        <v-col>
          <h1>Transaction Records</h1>
        </v-col>
      </v-row>
      <v-tabs
        v-model="tab"
        class="mt-6"
      >
        <v-tab
          id="all-transactions-tab"
          :class="['tab-item-default', tab === 0 ? 'tab-item-active' : 'tab-item-inactive']"
          :ripple="false"
        >
          <b>All</b>
        </v-tab>
        <v-tab
          id="pending-refund-requests-tab"
          :class="['tab-item-default', tab === 1 ? 'tab-item-active' : 'tab-item-inactive']"
          :ripple="false"
        >
          <b>Pending Requests</b>
                    <span class="font-weight-regular">
                    &nbsp;({{ pendingRefundRequests }})</span>
        </v-tab>
      </v-tabs>
      <v-window v-model="tab">
        <v-window-item class="ma-0">
          <v-card
            class="window-item-card"
            flat
          >
            <Transactions v-show="!appStore.loading"
                          class="mt-5 pa-0 pr-2"
                          :extended="true"
                          :showCredit="false"
                          :showExport="false"
            />
          </v-card>
        </v-window-item>
        <v-window-item eager>
          <v-card
            class="pt-2"
            flat
          >
            <v-card
              class="window-item-card"
              flat
            >
              <RefundRequestsTable
                :current-tab="tab"
                :table-title="'Pending Requests'"
                @refund-status-total="pendingRefundRequests = $event"
              />
            </v-card>
          </v-card>
        </v-window-item>
      </v-window>
    </v-container>
  </v-app>
</template>

<script lang="ts">
import Transactions from '@/components/Transaction/Transactions.vue'
import { useAppStore } from '@/store/app'
import { defineComponent, reactive, ref, toRefs } from '@vue/composition-api'
import RefundRequestsTable from '@/components/refund/RefundRequestsTable.vue'

export default defineComponent({
  name: 'TransactionTableView',
  components: { RefundRequestsTable, Transactions },
  setup () {
    const tab = ref(null)
    const state = reactive({
      pendingRefundRequests: 0
    })
    const appStore = useAppStore()
    return {
      appStore,
      tab,
      ...toRefs(state)
    }
  }
})
</script>

<style lang="scss" scoped>
  @import '$assets/scss/theme.scss';
  .window-item-card {
    padding: 12px 30px 40px 30px;
  }

  .v-window {
    overflow: visible;
  }
</style>
