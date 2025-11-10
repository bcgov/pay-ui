<script setup lang="ts">
import useLinkRoutingSlip from '@/composables/viewRoutingSlip/useLinkRoutingSlip'
import AutoComplete from './AutoComplete.vue'
import LinkedRoutingSlipDetails from '@/components/RoutingSlip/LinkedRoutingSlipDetails.vue'

const { slipId } = defineProps<{
  slipId: string
}>()

const {
  showSearch,
  toggleSearch,
  isRoutingSlipLinked,
  isRoutingSlipAChild,
  isRoutingSlipVoid,
  childRoutingSlipDetails,
  parentRoutingSlipDetails,
  routingSlip,
  invoiceCount
} = useLinkRoutingSlip()
</script>

<template>
  <div>
    <UCard variant="outline">
      <div v-if="isRoutingSlipLinked">
        <div v-if="isRoutingSlipAChild">
          <span class="font-bold">
            {{ $t('text.linkRoutingSlipSearchTitleChild') }}
          </span>
          <linked-routing-slip-details
            :created-date="parentRoutingSlipDetails.createdOn || ''"
            :routing-slip-number="parentRoutingSlipDetails.number || ''"
          />
          <div class="linked-rs-info mt-6">
            <h4 class="mb-3 font-bold">
              {{ $t('text.linkedRoutingSlip') }}
            </h4>
            <p>{{ $t('text.linkedRSChildInfoP1') }}</p>
            <p>{{ $t('text.linkedRSChildInfoP2') }}</p>
          </div>
        </div>
        <div v-else>
          <span class="font-bold">
            {{ $t('text.linkRoutingSlipSearchTitleParent') }}
          </span>
          <linked-routing-slip-details
            v-for="(routinSlip, i) in childRoutingSlipDetails"
            :key="routinSlip.number"
            :si-number="i + 1"
            :created-date="routinSlip.createdOn"
            :routing-slip-number="routinSlip.number"
            :parent-routing-slip-number="routingSlip.number"
          />
        </div>
      </div>
      <div v-else>
        <div v-if="invoiceCount && invoiceCount > 0">
          <div class="flex">
            <UIcon name="mdi-information-outline" class="size-6 mt-1" />
            <p class="ml-3">
              <span v-if="isRoutingSlipVoid">
                {{ $t('text.cantLinkBecauseVoided') }}
              </span>
              <span v-else>
                {{ $t('text.cantLinkSinceInvoicesExistP1') }}
                <br>
                {{ $t('text.cantLinkSinceInvoicesExistP2') }}
              </span>
            </p>
          </div>
        </div>
        <div v-else class="flex justify-between flex-wrap mb-4 gap-4">
          <p class="font-bold">
            <span v-if="isRoutingSlipVoid">
              {{ $t('text.cantLinkBecauseVoided') }}
            </span>
            <span v-else>
              {{ $t('text.routingSlipNoLinkedRoutingSlips') }}
            </span>
          </p>
          <UButton
            v-can:fas_edit.hide
            v-can:fas_link.hide
            size="lg"
            label="Link Routing Slip"
            :disabled="showSearch || isRoutingSlipVoid"
            class=""
            @click="toggleSearch"
          />
        </div>
        <div v-if="showSearch" class="mb-4">
          <AutoComplete
            :parent-routing-slip-number="slipId"
            @cancel="toggleSearch()"
          />
        </div>
      </div>
    </UCard>
  </div>
</template>

<style>
.linked-rs-info {
  background-color: #f1f3f5;
  padding: 13px 19px;
  border-left: 8px solid #38598a;
  border-radius: 6px;
}
</style>
