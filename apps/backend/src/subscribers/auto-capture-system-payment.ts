import { type SubscriberArgs, type SubscriberConfig } from "@medusajs/medusa"
import { IPaymentModuleService, IOrderModuleService } from "@medusajs/framework/types"
import { ModuleRegistrationName } from "@medusajs/framework/utils"

export default async function autoCapureSystemPayment({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = event.data.id

  const orderService: IOrderModuleService = container.resolve(
    ModuleRegistrationName.ORDER
  )

  const paymentService: IPaymentModuleService = container.resolve(
    ModuleRegistrationName.PAYMENT
  )

  const [order] = await orderService.listOrders(
    { id: [orderId] },
    { relations: ["payment_collections", "payment_collections.payments"] }
  )

  if (!order) return

  for (const collection of order.payment_collections ?? []) {
    for (const payment of (collection as any).payments ?? []) {
      if (payment.provider_id === "pp_system_default" && payment.captured_at === null) {
        await paymentService.capturePayment({ payment_id: payment.id })
      }
    }
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
