<template>
  <v-container
    id="shortname-refund-selection"
    class="view-container"
  >
    <div class="view-header flex-column">
      <h1 class="view-header__title">
        Refund Information
      </h1>
    </div>
    <v-card class="pl-5 py-2 mt-5 pr-5 pt-10">
      <v-form
        v-model="isFormValid"
        ref="refundSelectionForm"
      >
        <v-card-text>
          <v-row>
            <v-col class="col-6 col-sm-3 font-weight-bold">
              <span
                data-test="select-refund-type-text"
                :class="{ 'error-text': formSubmitted && !isFormValid }">
                Select Refund Method
              </span>
            </v-col>
            <v-col class="pl-0">
              <v-radio-group
              class="align-start mt-0 ml-2"
              :rules="[Boolean]"
              v-model="refundType"
              >
                <v-radio
                  class="mb-8"
                  label="Direct Deposit (using CAS information)"
                  :value="EFTRefundSelectionType.DIRECT_DEPOSIT"
                  data-test="radio-eft-refund-direct-deposit"
                ></v-radio>
                <v-radio
                  label="Issue a cheque"
                  :value="EFTRefundSelectionType.CHEQUE"
                  data-test="radio-eft-refund-cheque"
                ></v-radio>
              </v-radio-group>
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider class="mb-8"></v-divider>
        <v-card-actions
          class="pr-4 d-flex justify-space-between pa-3 pb-5"
        >
          <v-btn
            large
            outlined
            class="px-7"
            color="primary"
            data-test="btn-refund-selection-cancel"
            @click="cancelRefundSelection"
          >
            <span>Cancel</span>
          </v-btn>
          <v-btn
            large
            color="primary"
            class="px-8 font-weight-bold"
            data-test="btn-refund-selection-next"
            @click="gotoRefundForm"
          >
            <span class="pr-4">Next</span>
            <span>
              <v-icon color="white" class="mx-n2">mdi-chevron-right</v-icon>
            </span>
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, reactive, toRefs } from '@vue/composition-api'
import { EFTRefundSelectionType } from '@/util/constants'

export default defineComponent({
  name: 'ShortNameRefundSelection',
  props: {
    shortNameId: {
      type: Number,
      default: undefined
    }
  },
  setup (props, { root }) {
    const state = reactive({
      refundType: '',
      isFormValid: false,
      formSubmitted: false
    })

    function cancelRefundSelection () {
      root.$router?.push({
        name: 'shortnamedetails',
        params: {
          shortNameId: props.shortNameId
        }
      })
    }

    function gotoRefundForm () {
      state.formSubmitted = true
      if (state.isFormValid) {
        const routeName = state.refundType === EFTRefundSelectionType.CHEQUE ? 'shortnamerefundcheque' : 'shortnamerefund'
        root.$router?.push({
          name: routeName,
          params: {
            shortNameId: props.shortNameId
          }
        })
      }
    }

    return {
      ...toRefs(state),
      EFTRefundSelectionType,
      cancelRefundSelection,
      gotoRefundForm
    }
  }
})
</script>

<style lang="scss" scoped>
@import '@/assets/scss/theme.scss';

.error-text {
  color: $app-red;
}

</style>
