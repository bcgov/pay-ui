<template>
  <div class="d-flex justify-start">
    <v-col cols="2">
      <p data-test="title" class="text-center font-weight-bold mt-4">Routing slip</p>
    </v-col>
    <v-col cols="10" class="pl-0 pr-md-16">
      <v-form ref="createRoutingSlipDetailsForm" class="mt-4">
        <v-row class="d-flex pa-0 ma-0 justify-between">
          <v-col cols="12" class="py-0">
            <v-text-field
              filled
              label="Routing Slip - Unique ID"
              persistent-hint
              data-test="txtNumberId"
              v-model.trim="number"
              :rules="numberRules"
              @change="checkRoutingNumberAvailable"
              :error-messages="errorMessage"
            >
            </v-text-field>
          </v-col>
          <v-col cols="6" class="py-0">
            <date-picker
              v-model="routingSlipDate"
              :rules="routingSlipDateRules"
              data-test="txtRoutingSlipDate"
            ></date-picker>
          </v-col>
          <v-col cols="6" class="py-0">
            <v-text-field
              filled
              label="Entity Number"
              :rules="entityNumberRules"
              data-test="txtEntityNumber"
              v-model.trim="accountName"
              hint="Example: BC1234567, CP1234567, FM1234567 or 123456"
              persistent-hint
            >
            </v-text-field>
          </v-col>
        </v-row>
      </v-form>
    </v-col>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import DatePicker from '@/components/common/DatePicker.vue'
import { useCreateRoutingSlipDetails } from '@/composables/RoutingSlip'

@Component({
  components: {
    DatePicker
  },
  setup () {
    const {
      createRoutingSlipDetailsForm,
      number,
      routingSlipDate,
      accountName,
      numberRules,
      routingSlipDateRules,
      entityNumberRules,
      isValid,
      checkRoutingNumberAvailable,
      routingSlipDetails,
      errorMessage
    } = useCreateRoutingSlipDetails()
    return {
      createRoutingSlipDetailsForm,
      number,
      routingSlipDate,
      accountName,
      numberRules,
      routingSlipDateRules,
      entityNumberRules,
      isValid,
      checkRoutingNumberAvailable,
      routingSlipDetails,
      errorMessage
    }
  }
})
export default class CreateRoutingSlipDetails extends Vue {}
</script>
<style lang="scss" scoped>
@import '$assets/scss/theme.scss';

.text-center {
  text-align: center;
}
</style>
