"use client"

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArchiveBox } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  StatusBadge,
  Text,
  Toaster,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/client"
import { CARRIERS_METADATA_KEY, useCarriers } from "../carriers/page"

type WmsStatus = "pending_pick" | "picking" | "packed" | "dispatched"

const WMS_STAGES: {
  key: WmsStatus
  label: string
  color: "grey" | "orange" | "blue" | "green"
}[] = [
  { key: "pending_pick", label: "Pending Pick", color: "grey" },
  { key: "picking", label: "Picking", color: "orange" },
  { key: "packed", label: "Packed", color: "blue" },
  { key: "dispatched", label: "Dispatched", color: "green" },
]

const NEXT_STAGE: Record<WmsStatus, WmsStatus | null> = {
  pending_pick: "picking",
  picking: "packed",
  packed: "dispatched",
  dispatched: null,
}

const NEXT_ACTION: Record<WmsStatus, string> = {
  pending_pick: "Start Picking",
  picking: "Mark Packed",
  packed: "Dispatch",
  dispatched: "",
}

const useOrders = () =>
  useQuery({
    queryKey: ["wms-orders"],
    queryFn: async () => {
      const res = await sdk.admin.order.list({
        limit: 50,
        fields:
          "id,display_id,status,metadata,items,customer,created_at,shipping_address",
      } as any)
      return (res as any).orders as any[]
    },
    refetchInterval: 10_000,
  })

const useLocations = () =>
  useQuery({
    queryKey: ["stock-locations"],
    queryFn: async () => {
      const res = await sdk.client.fetch<any>("/admin/stock-locations", {
        method: "GET",
      })
      return res.stock_locations as any[]
    },
  })

// ── Dispatch Modal ────────────────────────────────────────────────────────────

type DispatchModalProps = {
  order: any
  onClose: () => void
  onConfirm: (data: {
    locationId: string
    carrier: string
    tracking: string
  }) => void
  isLoading: boolean
}

const DispatchModal = ({
  order,
  onClose,
  onConfirm,
  isLoading,
}: DispatchModalProps) => {
  const { data: locations } = useLocations()
  const { data: carriersData } = useCarriers()
  const [locationId, setLocationId] = useState("")
  const [carrier, setCarrier] = useState("")
  const [tracking, setTracking] = useState("")

  const addr = order.shipping_address
  const shippingTo = addr
    ? [
        [addr.first_name, addr.last_name].filter(Boolean).join(" "),
        addr.address_1,
        [addr.city, addr.province, addr.postal_code].filter(Boolean).join(" "),
        addr.country_code?.toUpperCase(),
      ]
        .filter(Boolean)
        .join(", ")
    : "—"

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl flex flex-col gap-5">
        <Heading level="h2">Dispatch Order #{order.display_id}</Heading>

        {/* Items */}
        <div className="flex flex-col gap-1">
          <Label size="xsmall">Items</Label>
          <div className="border border-ui-border-base rounded-md p-3 bg-ui-bg-subtle flex flex-col gap-1">
            {order.items?.map((item: any) => (
              <Text key={item.id} className="text-sm">
                {item.quantity}× {item.title ?? item.product_title}
              </Text>
            ))}
          </div>
        </div>

        {/* Shipping From */}
        <div className="flex flex-col gap-1">
          <Label size="xsmall">Shipping From *</Label>
          <select
            className="w-full border border-ui-border-base rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ui-border-interactive"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
          >
            <option value="">Select location…</option>
            {(locations ?? []).map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Shipping To */}
        <div className="flex flex-col gap-1">
          <Label size="xsmall">Shipping To</Label>
          <div className="border border-ui-border-base rounded-md p-3 bg-ui-bg-subtle">
            <Text className="text-sm">{shippingTo}</Text>
          </div>
        </div>

        {/* Carrier */}
        <div className="flex flex-col gap-1">
          <Label size="xsmall">Carrier *</Label>
          <select
            className="w-full border border-ui-border-base rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ui-border-interactive"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
          >
            <option value="">Select carrier…</option>
            {(carriersData?.carriers ?? []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Tracking */}
        <div className="flex flex-col gap-1">
          <Label size="xsmall">Tracking / Consignment No.</Label>
          <Input
            placeholder="Optional"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-ui-border-base">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm({ locationId, carrier, tracking })}
            isLoading={isLoading}
            disabled={!locationId || !carrier}
          >
            Confirm Dispatch
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Order Card ────────────────────────────────────────────────────────────────

const OrderCard = ({ order }: { order: any }) => {
  const wmsStatus: WmsStatus =
    (order.metadata?.wms_status as WmsStatus) ?? "pending_pick"
  const next = NEXT_STAGE[wmsStatus]
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const costCentre = order.metadata?.cost_centre as string | undefined

  const advanceMutation = useMutation({
    mutationFn: async ({
      next,
      dispatchData,
    }: {
      next: WmsStatus
      dispatchData?: { locationId: string; carrier: string; tracking: string }
    }) => {
      await (sdk.admin.order as any).update(order.id, {
        metadata: { wms_status: next },
      })

      if (next === "dispatched" && dispatchData) {
        const items = (order.items ?? []).map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
        }))

        const fulfillmentRes = await sdk.client.fetch<any>(
          `/admin/orders/${order.id}/fulfillments`,
          {
            method: "POST",
            body: {
              location_id: dispatchData.locationId,
              items,
              metadata: { carrier: dispatchData.carrier },
            },
          }
        )

        const fulfillmentId =
          fulfillmentRes?.order?.fulfillments?.slice(-1)[0]?.id

        if (fulfillmentId) {
          await sdk.client.fetch(
            `/admin/fulfillments/${fulfillmentId}/shipments`,
            {
              method: "POST",
              body: dispatchData.tracking
                ? { tracking_numbers: [dispatchData.tracking] }
                : {},
            }
          )
        }
      }
    },
    onSuccess: (_, { next }) => {
      qc.invalidateQueries({ queryKey: ["wms-orders"] })
      setShowModal(false)
      toast.success(
        `Order moved to ${WMS_STAGES.find((s) => s.key === next)?.label}`
      )
    },
    onError: () => {
      setShowModal(false)
      toast.error("Failed to update order status")
    },
  })

  const handleButtonClick = () => {
    if (next === "dispatched") {
      setShowModal(true)
    } else if (next) {
      advanceMutation.mutate({ next })
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2 rounded-lg border border-ui-border-base bg-ui-bg-base p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <Text className="font-semibold text-sm">Order #{order.display_id}</Text>
          <StatusBadge
            color={WMS_STAGES.find((s) => s.key === wmsStatus)?.color ?? "grey"}
          >
            {WMS_STAGES.find((s) => s.key === wmsStatus)?.label}
          </StatusBadge>
        </div>

        {order.items?.length > 0 && (
          <ul className="text-xs text-ui-fg-subtle space-y-0.5">
            {order.items.slice(0, 4).map((item: any) => (
              <li key={item.id} className="flex justify-between">
                <span className="truncate max-w-[160px]">
                  {item.title ?? item.product_title}
                </span>
                <span className="ml-2 shrink-0">× {item.quantity}</span>
              </li>
            ))}
            {order.items.length > 4 && (
              <li className="text-ui-fg-muted">
                +{order.items.length - 4} more items
              </li>
            )}
          </ul>
        )}

        {costCentre && (
          <Badge size="xsmall" color="purple" className="self-start">
            {costCentre}
          </Badge>
        )}

        {next && (
          <Button
            size="small"
            variant="secondary"
            isLoading={advanceMutation.isPending}
            onClick={handleButtonClick}
          >
            {NEXT_ACTION[wmsStatus]}
          </Button>
        )}

        {!next && (
          <Text className="text-xs text-ui-fg-muted italic">Completed</Text>
        )}
      </div>

      {showModal && (
        <DispatchModal
          order={order}
          onClose={() => setShowModal(false)}
          onConfirm={(data) =>
            advanceMutation.mutate({ next: "dispatched", dispatchData: data })
          }
          isLoading={advanceMutation.isPending}
        />
      )}
    </>
  )
}

// ── Board ─────────────────────────────────────────────────────────────────────

const FulfillmentBoard = ({ orders }: { orders: any[] }) => (
  <div className="grid grid-cols-4 gap-4">
    {WMS_STAGES.map((stage) => {
      const stageOrders = orders.filter(
        (o) =>
          ((o.metadata?.wms_status as WmsStatus) ?? "pending_pick") === stage.key
      )
      return (
        <div key={stage.key} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Text className="text-sm font-medium text-ui-fg-base">
              {stage.label}
            </Text>
            <Badge size="xsmall" color={stage.color}>
              {stageOrders.length}
            </Badge>
          </div>
          <div className="flex flex-col gap-3 min-h-[120px]">
            {stageOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
            {stageOrders.length === 0 && (
              <div className="flex items-center justify-center h-20 rounded-lg border border-dashed border-ui-border-base">
                <Text className="text-xs text-ui-fg-muted">No orders</Text>
              </div>
            )}
          </div>
        </div>
      )
    })}
  </div>
)

// ── Page ──────────────────────────────────────────────────────────────────────

const FulfillmentPage = () => {
  const { data: orders, isPending } = useOrders()

  return (
    <>
      <Container className="flex flex-col gap-y-4 p-6">
        <div>
          <Heading className="font-sans font-medium h1-core">
            Fulfillment Flow
          </Heading>
          <Text className="text-ui-fg-subtle text-sm mt-1">
            Track and advance orders through the pick, pack, and dispatch
            pipeline.
          </Text>
        </div>
        {isPending ? (
          <Text className="text-ui-fg-muted">Loading orders…</Text>
        ) : (
          <FulfillmentBoard orders={orders ?? []} />
        )}
      </Container>
      <Toaster />
    </>
  )
}

export const config = defineRouteConfig({
  label: "Fulfillment",
  icon: ArchiveBox,
})

export default FulfillmentPage
