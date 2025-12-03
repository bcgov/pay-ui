<script setup lang="ts">
import commonUtil from '@/utils/common-util'

const props = withDefaults(
  defineProps<{
    siNumber?: number
    routingSlipNumber?: string
    createdDate?: Date | string
    parentRoutingSlipNumber?: string
  }>(),
  {
    siNumber: undefined,
    routingSlipNumber: '',
    createdDate: ''
  }
)

function goTo() {
  return props.parentRoutingSlipNumber
    ? `/view-routing-slip/${props.parentRoutingSlipNumber}/${props.routingSlipNumber}`
    : `/view-routing-slip/${props.routingSlipNumber}`
}

const formatDisplayDate = commonUtil.formatDisplayDate
</script>

<template>
  <div class="mt-4 mb-2">
    <span v-if="props.siNumber" class="font-bold">
      {{ props.siNumber }}.
    </span>

    <NuxtLink
      :to="goTo()"
      class="font-bold"
    >
      {{ props.routingSlipNumber }}
    </NuxtLink>
    <span>
      - Routing slip created date:
      <span data-test="text-created-date" class="font-bold">
        {{ formatDisplayDate(props.createdDate) }}
      </span>
    </span>
  </div>
</template>

<style lang="scss" scoped>
  a {
    color: #1a73e8;
    text-decoration: underline;
  }
</style>
