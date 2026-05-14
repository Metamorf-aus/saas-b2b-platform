"use server"

import { type SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa"
import { IPaymentModuleService } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
} from "@medusajs/framework/utils"

export default async function autoCaptureSystemPayment({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = event.data.id

  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "payment_collections.*",
      "payment_collections.payments.*",
    ],
    filters: { id: orderId },
  })

  const order = orders?.[0]
  if (!order) return

  const paymentService: IPaymentModuleService = container.resolve(
    ModuleRegistrationName.PAYMENT
  )

  for (const collection of order.payment_collections ?? []) {
    for (const payment of (collection as any).payments ?? []) {
      if (
        payment.provider_id === "pp_system_default" &&
        !payment.captured_at
      ) {
        await paymentService.capturePayment({ payment_id: payment.id })
      }
    }
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
