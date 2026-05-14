import { COST_CENTRES } from "@/lib/cost-centres"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
}

const FULFILLMENT_STATUS_LABEL: Record<string, string> = {
  not_fulfilled: "Processing",
  fulfilled: "Fulfillment created",
  partially_fulfilled: "Partially fulfilled",
  shipped: "Shipped",
  partially_shipped: "Partially shipped",
  cancelled: "Cancelled",
  returned: "Returned",
  partially_returned: "Partially returned",
  requires_action: "Requires action",
}

const OrderDetails = ({ order }: OrderDetailsProps) => {
  const createdAt = new Date(order.created_at)
  const costCentreCode = order.metadata?.cost_centre as string | undefined
  const costCentre = COST_CENTRES.find((c) => c.code === costCentreCode)
  const fulfillmentLabel =
    FULFILLMENT_STATUS_LABEL[order.fulfillment_status ?? "not_fulfilled"] ?? "Processing"

  return (
    <>
      <Heading level="h3" className="mb-2">
        Details
      </Heading>

      <div className="text-sm text-ui-fg-subtle overflow-auto">
        <div className="flex justify-between">
          <Text>Order Number</Text>
          <Text>#{order.display_id}</Text>
        </div>

        <div className="flex justify-between mb-2">
          <Text>Order Date</Text>
          <Text>
            {" "}
            {createdAt.getDate()}-{createdAt.getMonth()}-
            {createdAt.getFullYear()}
          </Text>
        </div>

        <div className="flex justify-between mb-2">
          <Text>Order Status</Text>
          <Text>{fulfillmentLabel}</Text>
        </div>

        {costCentre && (
          <div className="flex justify-between mb-2">
            <Text>Cost Centre</Text>
            <Text>
              {costCentre.code} — {costCentre.name}
            </Text>
          </div>
        )}

        <Text>
          We have sent the order confirmation details to{" "}
          <span className="font-semibold">{order.email}</span>.
        </Text>
      </div>
    </>
  )
}

export default OrderDetails
