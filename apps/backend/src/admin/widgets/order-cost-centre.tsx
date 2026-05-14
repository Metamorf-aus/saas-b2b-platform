import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"

const COST_CENTRES = [
  { code: "CC-101", name: "Executive & Administration" },
  { code: "CC-210", name: "Sales & Business Development" },
  { code: "CC-320", name: "Marketing & Communications" },
  { code: "CC-430", name: "Procurement & Warehouse" },
  { code: "CC-540", name: "Finance & Compliance" },
]

const OrderDepartmentWidget = ({ data }: { data: Record<string, any> }) => {
  const costCentreCode = data?.metadata?.cost_centre as string | undefined
  const costCentre = COST_CENTRES.find((c) => c.code === costCentreCode)

  if (!costCentre) {
    return null
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Cost Centre</Heading>
      </div>

      {costCentre && (
        <div className="flex items-center justify-between px-6 py-4">
          <Text className="text-ui-fg-subtle">Cost Centre</Text>
          <Text>{costCentre.code} — {costCentre.name}</Text>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
})

export default OrderDepartmentWidget
