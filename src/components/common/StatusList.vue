<template>
  <v-select
    :items="statusList"
    v-model="currentStatus"
    filled
    item-text="description"
    item-value="code"
    return-object
    data-test="select-status"
    v-bind="$attrs"
    v-on="$listeners"
  ></v-select>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import { useStatusList } from '@/composables/common'
import { ChequeRefundStatus } from '@/util/constants'

/** component for status list.
 * example
 * <status-list v-model="currentStatus" label="Status"></status-list>
 */

export default defineComponent({
  name: 'StatusList',
  props: {
    value: {
      type: String,
      required: false
    },
    column: {
      type: String,
      required: false
    }
  },
  setup (props, context) {
    const { routingSlipStatusList, currentStatus } = useStatusList(props, context)

    const statusList = props.column === 'status' ? routingSlipStatusList : ChequeRefundStatus.map(({ code }) => code)

    return {
      routingSlipStatusList,
      statusList,
      currentStatus
    }
  }
})

</script>
