<template>
  <v-form ref="refundRequestForm">
    <v-row>
      <v-col
        data-test="rsDetail"
        class="col-3 font-weight-bold pb-0"
        v-if="canEdit || name"
      >
        Client Name
      </v-col>
      <v-col class="col-9 pb-0">
        <v-text-field
        filled
        label="Name of Person or Organization"
        persistent-hint
        v-model.trim="name"
        data-test="txtName"
        :rules="nameRules"
        v-if="canEdit"
        >
        </v-text-field>
        <span v-else>{{ name }}</span>
      </v-col>
      <v-col
        data-test="rsDetail"
        class="col-3 font-weight-bold pb-0"
        v-if="showAddress"
      >
        Name of Person or Organization & Address
      </v-col>
      <v-col class="col-9 pb-0">
        <AddressForm
          ref="addressForm"
          :editing="canEdit"
          :schema="baseAddressSchema"
          :address="address"
          @update:address="updateAddress"
          @valid="addressValidity"
        >
        </AddressForm>
      </v-col>
      <v-col class="col-12">
      <v-divider v-if="!canEdit" class="mb-1 mt-2" />
      </v-col>
      <v-col
        class="col-3 font-weight-bold pt-0 pb-0"
        v-if="!canEdit"
      >
        Refund Status
      </v-col>
      <v-col
        class="col-9 pt-0"
        v-if="!canEdit"
      >
        <v-chip
          small
          label
          class="item-chip"
          :color="currentRefundStatus === RoutingSlipRefundCodes.CHEQUE_UNDELIVERABLE ? 'error' : 'default'"
        >
          {{ currentRefundStatusLabel }}
        </v-chip>
        <v-menu
          close-on-content-click
          offset-y
          v-model="isExpanded"
          v-if="!canEdit && currentRefundStatusLabel && currentRefundStatusLabel !== RoutingSlipRefundCodes.PROCESSING"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              text
              v-bind="attrs"
              v-on="on"
              small
              class="hover-btn ml-2"
              color="primary"
              @click="expendStatus"
            >
              Update Status
              <v-icon dense>{{ isExpanded ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon>
            </v-btn>
          </template>
          <v-list
           class="status-list m-0 p-0"
          >
            <v-list-item
                v-for="status in filteredStatuses"
                :key="status.code"
                @click="updateRefundStatus(status.code)"
              >
              <v-list-item-title>{{ status.text }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-col>
      <v-col
        class="col-3 font-weight-bold"
        :class="canEdit ? 'pt-0' : ''"
        v-if="isEditing || chequeAdvice"
      >
        Cheque Advice
      </v-col>
      <v-col
        class="col-9"
        :class="canEdit ? 'pt-0' : ''">
        <v-text-field
          filled
          label="Additional Information"
          persistent-hint
          v-model.trim="chequeAdvice"
          data-test="txtChequeAdvice"
          :rules="chequeAdviceRules"
          maxLength=40
          placeholder="There is a 40 character limit. Include the entity name, entity number and what the refund is for."
          v-if="isEditing"
        >
        </v-text-field>
        <span v-else>{{ chequeAdvice }}</span>
      </v-col>
    </v-row>
  </v-form>
</template>
<script lang="ts">
import { computed, defineComponent, reactive, toRefs } from '@vue/composition-api'
import { useRefundRequestForm, useRoutingSlipInfo } from '@/composables/ViewRoutingSlip'
import AddressForm from '@/components/common/AddressForm.vue'
import { GetRoutingSlipRequestPayload, RefundRequestDetails } from '@/models/RoutingSlip'
import { RoutingSlipRefundCodes, ChequeRefundStatus, SlipStatus } from '@/util/constants'
import { useRoutingSlip } from '@/composables/useRoutingSlip'
import { useSearch } from '@/composables/Dashboard/useSearch'

export default defineComponent({
  name: 'RefundRequestForm',
  components: {
    AddressForm
  },
  props: {
    inputRefundRequestDetails: {
      type: Object as () => RefundRequestDetails,
      default: () => null
    },
    isEditing: {
      type: Boolean,
      default: false
    },
    isApprovalFlow: {
      type: Boolean,
      default: false
    }
  },
  setup (props, context) {
    const refundRequestFormState = useRefundRequestForm(props, context)
    const searchState = useSearch(props, context)
    const { routingSlipDetails } = useRoutingSlipInfo(props)
    const routingSlipOperations = useRoutingSlip()

    const state = reactive({
      currentRefundStatus: routingSlipDetails.value?.refundStatus,
      currentStatus: routingSlipDetails.value?.status,
      isExpanded: false,
      ...refundRequestFormState
    })

    const currentRefundStatusLabel = computed(() => {
      const statusMap = {
        [SlipStatus.REFUNDAUTHORIZED]: RoutingSlipRefundCodes.PROCESSING,
        [SlipStatus.REFUNDREQUEST]: RoutingSlipRefundCodes.PROCESSING,
        [SlipStatus.REFUNDUPLOADED]: RoutingSlipRefundCodes.PROCESSING,
        [SlipStatus.REFUNDPROCESSED]: searchState.getRefundStatusText(state.currentRefundStatus)
      }
      return statusMap[state.currentStatus] || null
    })

    const expendStatus = () => {
      state.isExpanded = !state.isExpanded
    }

    const filteredStatuses = computed(() =>
      ChequeRefundStatus.filter(s => s.code !== state.currentRefundStatus && s.display)
    )

    async function updateRefundStatus (status: string) {
      await routingSlipOperations.updateRoutingSlipRefundStatus(status)
      const comment = `Refund status updated from ${searchState.getRefundStatusText(state.currentRefundStatus)} to ${searchState.getRefundStatusText(status)}`
      await routingSlipOperations.updateRoutingSlipComments(comment)
      context.emit('commentsUpdated')
      state.currentRefundStatus = status
      if (routingSlipOperations.routingSlip.value?.number) {
        const getRoutingSlipRequestPayload: GetRoutingSlipRequestPayload = { routingSlipNumber: routingSlipOperations.routingSlip.value?.number }
        await routingSlipOperations.getRoutingSlip(getRoutingSlipRequestPayload)
      }
    }

    return {
      ...toRefs(state),
      currentRefundStatusLabel,
      filteredStatuses,
      expendStatus,
      updateRefundStatus,
      ChequeRefundStatus,
      RoutingSlipRefundCodes
    }
  }

})
</script>

<style lang="scss" scoped>
.hover-btn {
  font-size: 16px !important;
  text-transform: none;
}

.hover-btn:before {
  background-color: transparent !important;
}

.status-list .v-list-item__title {
  color: #1669BB !important;
  font-size: 16px !important;
  padding: 8px 16px !important;
}
</style>
