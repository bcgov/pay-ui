<script setup lang="ts">
import StatusMenu from '~/components/common/StatusMenu.vue'
import { useRoutingSlipInfo } from '~/composables/viewRoutingSlip/useRoutingSlipInfo'

const {
  routingSlip,
  formattedDate,
  statusColor,
  statusLabel,
  entityNumber,
  contactName,
  mailingAddress,
  deliveryInstructions,
  allowedStatuses,
  handleStatusSelect
} = useRoutingSlipInfo()
</script>

<template>
  <UCard>
    <div class="relative">
      <div v-if="allowedStatuses && allowedStatuses.length > 0" class="absolute top-0 right-0">
        <StatusMenu
          :allowed-status-list="allowedStatuses"
          @select="handleStatusSelect"
        />
      </div>
      <div>
        <div class="flex flex-col sm:flex-row sm:items-start gap-2">
          <div class="w-full sm:w-1/4 font-semibold p-4">
            {{ $t('label.routingSlipUniqueID') }}
          </div>
          <div class="w-full sm:w-3/4 p-4">
            {{ routingSlip?.number || '-' }}
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start gap-2">
          <div class="w-full sm:w-1/4 font-semibold p-4">
            {{ $t('label.date') }}
          </div>
          <div class="w-full sm:w-3/4 p-4">
            {{ formattedDate }}
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start gap-2">
          <div class="w-full sm:w-1/4 font-semibold p-4">
            {{ $t('label.status') }}
          </div>
          <div class="w-full sm:w-3/4 p-4">
            <span :class="statusColor">
              {{ statusLabel }}
            </span>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start gap-2">
          <div class="w-full sm:w-1/4 font-semibold p-4">
            {{ $t('label.entityNumber') }}
          </div>
          <div class="w-full sm:w-3/4 p-4">
            {{ entityNumber || '-' }}
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start gap-2">
          <div class="w-full sm:w-1/4 font-semibold p-4">
            {{ $t('label.nameOfPersonOrOrgAndAddress') }}
          </div>
          <div class="w-full sm:w-3/4 p-4">
            <div v-if="contactName || mailingAddress" class="flex flex-col gap-1">
              <span v-if="contactName">{{ contactName }}</span>
              <ConnectAddressDisplay
                v-if="mailingAddress"
                :address="mailingAddress"
                text-decor
              />
              <span v-if="deliveryInstructions" class="italic text-gray-600">
                {{ deliveryInstructions }}
              </span>
            </div>
            <span v-else>-</span>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
