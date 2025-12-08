import type { z } from 'zod'

export type RoutingSlipPaymentItem = {
  uuid: string
  amountCAD: string
  amountUSD: string
  identifier: string
  date: string
}

export type RoutingSlipPaymentSchema = z.output<ReturnType<typeof getRoutingSlipPaymentSchema>>
export type RoutingSlipDetailsSchema = z.output<ReturnType<typeof getRoutingSlipDetailsSchema>>
export type RoutingSlipAddressSchema = z.output<ReturnType<typeof getRoutingSlipAddressSchema>>
export type RoutingSlipSchema = z.output<ReturnType<typeof getRoutingSlipSchema>>
