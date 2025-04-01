<template>
  <v-container
    id="shortname-details"
    class="view-container"
  >
    <v-overlay :value="isInitialLoading">
      <v-progress-circular
        indeterminate
        size="24"
      ></v-progress-circular>
    </v-overlay>
    <div class="view-header flex-column">
      <h1 class="view-header__title">
        Refund Information
      </h1>
    </div>
    <v-card class="pl-5 py-2 mt-5 pr-5">
      <v-form
        ref="refundForm"
        v-model="isFormValid"
      >
        <v-card-text>
          <v-row no-gutters>
            <v-col class="col-12 col-sm-12 ">
              <!-- Short Name-->
              <v-row>
                <v-col class="col-6 col-sm-3 font-weight-bold">
                  Refund Method
                </v-col>
                <v-col class="pl-0">
                  {{ EFTRefundMethodDescription[refundDetails.refundMethod || refundMethod]}}
                </v-col>
              </v-row>

              <v-row>
                <v-col class="col-6 col-sm-3 font-weight-bold">
                  Short Name
                </v-col>
                <v-col class="pl-0">
                  {{ shortNameDetails.shortName }}
                </v-col>
              </v-row>

              <!-- Short name type -->
              <v-row>
                <v-col class="col-6 col-sm-3 font-weight-bold">
                  Type
                </v-col>
                <v-col class="pl-0">
                  {{ getShortNameTypeDescription(shortNameDetails.shortNameType) }}
                </v-col>
              </v-row>

              <!-- Unsettled short name amount -->
              <v-row v-if="!readOnly">
                <v-col class="col-6 col-sm-3 font-weight-bold">
                  Unsettled Amount on Short Name
                </v-col>
                <v-col class="pl-0">
                  {{ formatCurrency(Number(shortNameDetails.creditsRemaining)) }}
                </v-col>
              </v-row>

              <!-- Refund amount -->
              <v-row :class="!readOnly ? 'pt-4' : ''">
                <v-col
                  class="col-6 col-sm-3 font-weight-bold"
                  :class="!readOnly ? 'pt-0' : ''"
                >
                  Refund Amount
                </v-col>
                <v-col
                  v-if="readOnly"
                  data-test="refundAmountReadOnly"
                  class="pl-0"
                >
                  {{ formatCurrency(Number(refundDetails.refundAmount)) }}
                </v-col>
                <v-text-field
                  v-else
                  v-model.trim="refundAmount"
                  filled
                  label="Refund Amount"
                  persistent-hint
                  data-test="refundAmount"
                  :rules="refundAmountRules"
                  :disabled="isFormDisabled"
                />
              </v-row>

              <!-- Supplier Number -->
              <v-row
                v-if="refundMethod == EFTRefundMethod.CHEQUE">
                <v-col
                  class="col-6 col-sm-3 font-weight-bold"
                  :class="!readOnly ? 'pt-0' : ''"
                >
                  Entity Name
                </v-col>
                <v-col
                  v-if="readOnly"
                  data-test="entityNameReadOnly"
                  class="pl-0"
                >
                  {{ refundDetails.entityName }}
                </v-col>
                <v-text-field
                  v-else
                  v-model.trim="entityName"
                  hint="Name of the individual or organization receiving the cheque"
                  filled
                  label="Entity Name"
                  persistent-hint
                  data-test="entityName"
                  :rules="entityNameRules"
                  :disabled="isFormDisabled"
                />
              </v-row>

              <!-- Address Form -->
              <v-row
              v-if="refundMethod == EFTRefundMethod.CHEQUE">
                <v-col
                  class="col-6 col-sm-3 font-weight-bold"
                  :class="!readOnly ? 'pt-0' : ''"
                >
                  Entity Address
                </v-col>
                <v-col class="px-0 mx-0">
                  <AddressForm
                    ref="addressForm"
                    :editing="!readOnly"
                    :schema="baseAddressSchema"
                    :address="address"
                    @update:address="updateAddress"
                    @valid="addressValidity"
                    data-test="entityAddress"
                  >
                  </AddressForm>
                </v-col>
              </v-row>

              <!-- Supplier Number -->
              <v-row
                v-if="refundMethod == EFTRefundMethod.EFT">
                <v-col
                  class="col-6 col-sm-3 font-weight-bold"
                  :class="!readOnly ? 'pt-0' : ''"
                >
                  CAS Supplier Number
                </v-col>
                <v-col
                  v-if="readOnly"
                  data-test="casSupplierNumberReadOnly"
                  class="pl-0"
                >
                  {{ refundDetails.casSupplierNumber }}
                </v-col>
                <v-text-field
                  v-else
                  v-model.trim="casSupplierNumber"
                  hint="This number should be created in CAS before issuing a refund"
                  filled
                  label="CAS Supplier Number"
                  persistent-hint
                  data-test="casSupplierNumber"
                  :rules="casSupplierNumRules"
                  :disabled="isFormDisabled"
                />
              </v-row>

              <!-- Supplier Site -->
              <v-row
                v-if="refundMethod == EFTRefundMethod.EFT">
                <v-col
                  class="col-6 col-sm-3 font-weight-bold"
                  :class="!readOnly ? 'pt-0' : ''"
                >
                  CAS Supplier Site
                </v-col>
                <v-col
                  v-if="readOnly"
                  data-test="casSupplierSiteReadOnly"
                  class="pl-0"
                >
                  {{ refundDetails.casSupplierSite }}
                </v-col>
                <v-text-field
                  v-else
                  v-model.trim="casSupplierSite"
                  hint="This site should be created in CAS before issuing a refund"
                  filled
                  label="CAS Supplier Site"
                  persistent-hint
                  data-test="casSupplierSite"
                  :rules="casSupplierSiteRules"
                  :disabled="isFormDisabled"
                />
              </v-row>

              <!-- Email -->
              <v-row>
                <v-col
                  class="col-6 col-sm-3 font-weight-bold"
                  :class="!readOnly ? 'pt-0' : ''"
                >
                  Entity Email
                </v-col>
                <v-col
                  v-if="readOnly"
                  data-test="emailReadOnly"
                  class="pl-0"
                >
                  {{ refundDetails.refundEmail }}
                </v-col>
                <v-text-field
                  v-else
                  v-model.trim="email"
                  :hint="getEmailHint()"
                  filled
                  label="Email"
                  persistent-hint
                  data-test="email"
                  :rules="emailRules"
                  :disabled="isFormDisabled"
                />
              </v-row>

              <!-- Refund Reason -->
              <v-row>
                <v-col
                  class="col-6 col-sm-3 font-weight-bold"
                  :class="!readOnly ? 'pt-0' : ''"
                >
                  Reason for Refund
                </v-col>
                <v-col
                  v-if="readOnly"
                  data-test="staffCommentReadOnly"
                  class="pl-0"
                >
                  {{ refundDetails.comment }}
                </v-col>
                <v-text-field
                  v-else
                  v-model.trim="staffComment"
                  filled
                  label="Reason for Refund"
                  persistent-hint
                  data-test="staffComment"
                  :rules="staffCommentRules"
                  :disabled="isFormDisabled"
                />
              </v-row>
            </v-col>
          </v-row>

          <!-- Qualified Receiver -->
          <v-row v-if="readOnly">
            <v-col
              data-test="qualifiedReceiverReadOnly"
              class="col-6 col-sm-3 font-weight-bold">
              Requested By Qualified Receiver
            </v-col>
            <v-col class="pl-0">
              {{ refundDetails.createdBy }} {{ formatDate(refundDetails.createdOn, dateDisplayFormat) }}
            </v-col>
          </v-row>

          <!-- Approved By Expense Authority -->
          <v-row v-if="readOnly && isApproved()">
            <v-col
              data-test="expenseAuthorityApprovalReadOnly"
              class="col-6 col-sm-3 font-weight-bold">
              Approved By Expense Authority
            </v-col>
            <v-col class="pl-0">
              {{ refundDetails.updatedBy }} {{ formatDate(refundDetails.updatedOn, dateDisplayFormat) }}
            </v-col>
          </v-row>

          <!-- Declined by Expense Authority -->
          <v-row v-if="readOnly && isDeclined()">
            <v-col
              data-test="expenseAuthorityDeclinedReadOnly"
              class="col-6 col-sm-3 font-weight-bold">
              Declined By Expense Authority
            </v-col>
            <v-col class="pl-0">
              {{ refundDetails.updatedBy }} {{ formatDate(refundDetails.updatedOn, dateDisplayFormat) }}
            </v-col>
          </v-row>

          <!-- Decline Reason -->
          <v-row v-if="readOnly && isDeclined()">
            <v-col class="col-6 col-sm-3 font-weight-bold">
              Reason for Declining
            </v-col>
            <v-col
              data-test="expenseAuthorityDeclineReasonReadOnly"
              class="pl-0">
              {{ refundDetails.declineReason }}
            </v-col>
          </v-row>

          <!-- Refund Status -->
          <v-row v-if="readOnly">
            <v-col class="col-6 col-sm-3 font-weight-bold">
              Refund Status
            </v-col>
            <v-col class="pl-0 d-flex">
              <v-chip
                small
                label
                class="item-chip"
                data-test="chequeStatusChipReadOnly"
                v-if="refundDetails.chequeStatus === chequeRefundCodes.CHEQUE_UNDELIVERABLE"
                color='error'
              >
                {{ getEFTRefundStatusDescription(refundDetails)?.toUpperCase() }}
              </v-chip>
              <span v-else>{{ getEFTRefundStatusDescription(refundDetails) }}</span>
              <v-menu
                data-test="updateChequeStatusMenu"
                close-on-content-click
                offset-y
                v-model="statusIsExpanded"
                v-if="canUpdateChequeStatus()"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-btn
                    text
                    v-bind="attrs"
                    v-on="on"
                    small
                    class="hover-btn ml-4"
                    color="primary"
                    @click="expendStatus"
                    style="align-items: flex-start;"
                  >
                    Update Status
                    <v-icon dense>{{ statusIsExpanded ? 'mdi-menu-up' : 'mdi-menu-down' }}</v-icon>
                  </v-btn>
                </template>
                <v-list
                class="status-list m-0 p-0"
                >
                  <v-list-item
                      v-for="status in chequeStatusList"
                      :key="status.code"
                      @click="updateChequeRefundStatus(status.code)"
                    >
                    <v-list-item-title>{{ status.text }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions
          v-if="!readOnly"
          class="pr-4 justify-end pa-3 pb-5"
        >
          <v-btn
            large
            outlined
            class="px-7"
            color="primary"
            data-test="btn-edit-cancel"
            :disabled="isLoading"
            @click="handleCancelButton"
          >
            <span>Cancel</span>
          </v-btn>
          <v-btn
            large
            :color="buttonColor"
            class="px-8 font-weight-bold"
            data-test="btn-edit-done"
            :disabled="disableSubmission"
            @click="submitRefundRequest"
          >
            <span v-if="!isLoading">{{ buttonText }}</span>
            <v-progress-circular
              v-else
              indeterminate
              color="white"
              size="24"
            />
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { EFTRefund, ShortNameDetails } from '@/models/short-name'
import { computed, defineComponent, onMounted, reactive, ref, toRefs, watch } from '@vue/composition-api'
import {
  EFTRefundMethod,
  EFTRefundStatus,
  ChequeRefundStatus,
  chequeRefundCodes,
  EFTRefundMethodDescription, RouteNames
} from '@/util/constants'
import CommonUtils from '@/util/common-util'
import { EftRefundRequest } from '@/models/refund'
import PaymentService from '@/services/payment.services'
import ShortNameUtils from '@/util/short-name-util'
import { useOrgStore } from '@/store/org'
import { useShortNameTable } from '@/composables/eft/short-name-table-factory'
import AddressForm from '@/components/common/AddressForm.vue'
import { useEFTRefundAddress } from '@/composables/eft/useEFTRefundAddress'
import { Address } from '@/models/Address'

export default defineComponent({
  name: 'ShortNameRefundView',
  components: { AddressForm },
  props: {
    shortNameId: {
      type: Number,
      default: undefined
    },
    eftRefundId: {
      type: Number,
      default: undefined
    },
    paramRefundMethod: {
      type: String,
      default: undefined
    }
  },
  setup (props, { emit, root }) {
    const dateDisplayFormat = 'MMM DD, YYYY h:mm A [Pacific Time]'
    const eftRefundAddressState = useEFTRefundAddress()
    const state = reactive({
      ...eftRefundAddressState,
      isInitialLoading: true,
      entityName: undefined as string,
      shortNameDetails: {} as ShortNameDetails,
      refundDetails: {} as EFTRefund,
      refundAmount: undefined,
      refundMethod: undefined as string,
      refundAddress: {},
      casSupplierNumber: '',
      casSupplierSite: '',
      email: '',
      staffComment: '',
      isLoading: false,
      readOnly: false,
      statusIsExpanded: false,
      refundAmountRules: [
        v => !!v || 'Refund Amount is required',
        v => parseFloat(v) > 0 || 'Refund Amount must be greater than zero',
        v => parseFloat(v) <= parseFloat(state.shortNameDetails?.creditsRemaining) || 'Amount must be less than unsettled amount on short name',
        v => /^\d+(\.\d{1,2})?$/.test(v) || 'Amounts must be less than 2 decimal places'
      ],
      casSupplierNumRules: [
        v => !!v || 'CAS Supplier Number is required'
      ],
      casSupplierSiteRules: [
        v => !!v || 'CAS Supplier Site is required'
      ],
      emailRules: [
        v => !!v || 'Email is required',
        v => {
          const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          return pattern.test(v) || 'Valid email is required'
        }
      ],
      entityNameRules: [
        v => !!v || 'A Name of an Individual or Organization is required'
      ],
      staffCommentRules: [
        v => !!v || 'Reason for Refund is required',
        v => (v.length < 500) || 'Cannot exceed 500 characters'
      ],
      isSubmitted: false
    })
    const orgStore = useOrgStore()
    const { updateEFTRefundChequeStatus } = useShortNameTable(state, emit)
    function isApproved () {
      return state.refundDetails?.status === EFTRefundStatus.APPROVED
    }

    const expendStatus = () => {
      state.statusIsExpanded = !state.statusIsExpanded
    }

    function getEmailHint () {
      if (state.refundMethod === EFTRefundMethod.EFT) {
        return "The email provided in the client's Direct Deposit Application form"
      }
      return ''
    }

    function isDeclined () {
      return state.refundDetails?.status === EFTRefundStatus.DECLINED
    }

    function canUpdateChequeStatus () {
      return state.refundDetails.refundMethod === EFTRefundMethod.CHEQUE && state.refundDetails.status === EFTRefundStatus.APPROVED
    }

    const updateAddress = (address: Address) => {
      state.refundAddress = address
    }

    onMounted(async () => {
      state.isInitialLoading = true
      await loadShortnameDetails()
      if (props.shortNameId && props.eftRefundId) {
        state.readOnly = true
        await loadShortnameRefund()
      } else {
        state.refundMethod = props.paramRefundMethod
        prepopulateRefund()
      }
      state.isInitialLoading = false
    })

    function prepopulateRefund () {
      state.email = state.shortNameDetails.email
      if (state.refundMethod === EFTRefundMethod.EFT) {
        state.casSupplierNumber = state.shortNameDetails.casSupplierNumber
        state.casSupplierSite = state.shortNameDetails.casSupplierSite
      }
    }

    async function loadShortnameDetails (): Promise<void> {
      try {
        const response = await PaymentService.getEFTShortnameSummary(props.shortNameId)
        if (response?.data) {
          state.shortNameDetails = response.data.items[0]
        } else {
          throw new Error('No response from getEFTShortname')
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to getEFTShortname.', error)
      }
    }

    async function loadShortnameRefund (): Promise<void> {
      try {
        const response = await PaymentService.getEFTRefund(props.eftRefundId)
        if (response?.data) {
          const refundDetails = response.data
          state.refundDetails = refundDetails
          state.refundMethod = state.refundDetails.refundMethod
          if (state.refundMethod === EFTRefundMethod.CHEQUE) {
            state.address = {
              city: refundDetails.city,
              country: refundDetails.country,
              region: refundDetails.region,
              deliveryInstructions: refundDetails.deliveryInstructions,
              postalCode: refundDetails.postalCode,
              street: refundDetails.street,
              streetAdditional: refundDetails.streetAdditional
            }
          }
        } else {
          throw new Error('No response from getEFTRefund')
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to getEFTRefund.', error)
      }
    }

    const refundForm = ref(null)
    const isFormValid = ref(false)
    const buttonText = ref('Submit Refund Request')
    const buttonColor = ref('primary')

    function handleCancelButton () {
      root.$router?.push({
        name: RouteNames.SHORTNAME_DETAILS
      })
    }

    function getEFTRefundChequePayload () {
      const refundPayload: EftRefundRequest = {
        shortNameId: state.shortNameDetails.id,
        refundMethod: EFTRefundMethod.CHEQUE,
        refundAmount: state.refundAmount,
        refundEmail: state.email,
        comment: state.staffComment,
        entityName: state.entityName,
        ...state.refundAddress
      }

      return refundPayload
    }

    function getEFTRefundDirectDepositPayload () {
      const refundPayload: EftRefundRequest = {
        shortNameId: state.shortNameDetails.id,
        refundAmount: state.refundAmount,
        refundMethod: EFTRefundMethod.EFT,
        casSupplierNumber: state.casSupplierNumber,
        casSupplierSite: state.casSupplierSite,
        refundEmail: state.email,
        comment: state.staffComment
      }
      return refundPayload
    }

    function getEFTRefundPayload () {
      if (state.refundMethod === EFTRefundMethod.CHEQUE) {
        return getEFTRefundChequePayload()
      } else if (state.refundMethod === EFTRefundMethod.EFT) {
        return getEFTRefundDirectDepositPayload()
      }
    }

    async function submitRefundRequest () {
      state.isLoading = true
      let validForm = false
      if (state.refundMethod === EFTRefundMethod.CHEQUE) {
        validForm = refundForm.value.validate() && state.isAddressValid
      } else {
        validForm = refundForm.value.validate()
      }

      if (validForm) {
        const refundPayload = getEFTRefundPayload()
        try {
          await orgStore.refundEFT(refundPayload)
          state.isSubmitted = true
          buttonText.value = 'Approved'
          buttonColor.value = 'green'
          state.isLoading = false
          // 2-second delay before navigating away
          await new Promise(resolve => setTimeout(resolve, 2000)) // 2-second delay
          handleCancelButton()
        } catch (error) {
          state.isSubmitted = false
          buttonText.value = 'Failed'
          buttonColor.value = 'red'
        } finally {
          state.isLoading = false
        }
      } else {
        state.isLoading = false
      }
    }

    const disableSubmission = computed(() => {
      if (state.refundMethod === EFTRefundMethod.CHEQUE) {
        return !isFormValid.value || !state.isAddressValid || isFormDisabled.value
      }
      return !isFormValid.value || isFormDisabled.value
    })

    const isFormDisabled = computed(() => {
      return state.isSubmitted || state.isLoading
    })

    const chequeStatusList = computed(() =>
      ChequeRefundStatus.filter(s => s.code !== state.refundDetails.chequeStatus && s.display)
    )

    watch(() => state.isSubmitted, (newVal) => {
      if (newVal) {
        buttonText.value = 'Approved'
        buttonColor.value = 'green'
      } else {
        buttonText.value = 'Submit Refund Request'
        buttonColor.value = 'primary'
      }
    })

    async function updateChequeRefundStatus (status: string) {
      try {
        const response = await updateEFTRefundChequeStatus(state.refundDetails.id, status)
        if (response?.data) {
          await loadShortnameRefund()
        }
      } catch (error) {
        console.error('Update EFT short name refund cheque status failed', error)
        throw error
      }
    }

    return {
      ...toRefs(state),
      isApproved,
      isDeclined,
      refundForm,
      isFormDisabled,
      isFormValid,
      submitRefundRequest,
      buttonText,
      buttonColor,
      expendStatus,
      handleCancelButton,
      getEmailHint,
      getShortNameTypeDescription: ShortNameUtils.getShortNameTypeDescription,
      getEFTRefundStatusDescription: ShortNameUtils.getEFTRefundStatusDescription,
      formatCurrency: CommonUtils.formatAmount,
      formatDate: CommonUtils.formatUtcToPacificDate,
      dateDisplayFormat,
      chequeStatusList,
      chequeRefundCodes,
      updateChequeRefundStatus,
      EFTRefundMethod,
      EFTRefundMethodDescription,
      updateAddress,
      canUpdateChequeStatus,
      disableSubmission
    }
  }
})
</script>

<style lang="scss" scoped>
@import '@/assets/scss/theme.scss';
.account-alert-inner {
  .v-icon {
    color: $app-alert-orange;
  }
  background-color: $BCgovGold0 !important;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}
.account-alert__info {
  flex: 1 1 auto;
}
.hover-btn {
  height: fit-content;
  font-size: 16px !important;
}
.item-chip {
  font-size: 16px !important;
}
.v-overlay {
  z-index: 10;
}
</style>
