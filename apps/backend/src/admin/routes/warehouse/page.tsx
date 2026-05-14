"use client"

import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ArchiveBox } from "@medusajs/icons";
import {
  Badge,
  Button,
  Container,
  Heading,
  StatusBadge,
  Text,
  Toaster,
  toast,
} from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sdk } from "../../lib/client";

type WmsStatus = "pending_pick" | "picking" | "packed" | "dispatched";

const WMS_STAGES: { key: WmsStatus; label: string; color: "grey" | "orange" | "blue" | "green" }[] = [
  { key: "pending_pick", label: "Pending Pick", color: "grey" },
  { key: "picking", label: "Picking", color: "orange" },
  { key: "packed", label: "Packed", color: "blue" },
  { key: "dispatched", label: "Dispatched", color: "green" },
];

const NEXT_STAGE: Record<WmsStatus, WmsStatus | null> = {
  pending_pick: "picking",
  picking: "packed",
  packed: "dispatched",
  dispatched: null,
};

const NEXT_ACTION: Record<WmsStatus, string> = {
  pending_pick: "Start Picking",
  picking: "Mark Packed",
  packed: "Dispatch",
  dispatched: "",
};

const useOrders = () => {
  return useQuery({
    queryKey: ["wms-orders"],
    queryFn: async () => {
      const res = await sdk.admin.order.list({
        limit: 50,
        fields: "id,display_id,status,metadata,items,customer,created_at",
      } as any);
      return (res as any).orders as any[];
    },
    refetchInterval: 10_000,
  });
};

const useAdvanceWmsStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, next }: { orderId: string; next: WmsStatus }) => {
      await (sdk.admin.order as any).update(orderId, {
        metadata: { wms_status: next },
      });
    },
    onSuccess: (_, { next }) => {
      qc.invalidateQueries({ queryKey: ["wms-orders"] });
      toast.success(`Order moved to ${WMS_STAGES.find((s) => s.key === next)?.label}`);
    },
    onError: () => toast.error("Failed to update order status"),
  });
};

const OrderCard = ({ order }: { order: any }) => {
  const wmsStatus: WmsStatus = (order.metadata?.wms_status as WmsStatus) ?? "pending_pick";
  const next = NEXT_STAGE[wmsStatus];
  const { mutate, isPending } = useAdvanceWmsStatus();
  const costCentre = order.metadata?.cost_centre as string | undefined;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-ui-border-base bg-ui-bg-base p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <Text className="font-semibold text-sm">Order #{order.display_id}</Text>
        <StatusBadge color={WMS_STAGES.find((s) => s.key === wmsStatus)?.color ?? "grey"}>
          {WMS_STAGES.find((s) => s.key === wmsStatus)?.label}
        </StatusBadge>
      </div>

      {order.items && order.items.length > 0 && (
        <ul className="text-xs text-ui-fg-subtle space-y-0.5">
          {order.items.slice(0, 4).map((item: any) => (
            <li key={item.id} className="flex justify-between">
              <span className="truncate max-w-[160px]">{item.title ?? item.product_title}</span>
              <span className="ml-2 shrink-0">× {item.quantity}</span>
            </li>
          ))}
          {order.items.length > 4 && (
            <li className="text-ui-fg-muted">+{order.items.length - 4} more items</li>
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
          isLoading={isPending}
          onClick={() => mutate({ orderId: order.id, next })}
        >
          {NEXT_ACTION[wmsStatus]}
        </Button>
      )}

      {!next && (
        <Text className="text-xs text-ui-fg-muted italic">Completed</Text>
      )}
    </div>
  );
};

const WmsBoard = ({ orders }: { orders: any[] }) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      {WMS_STAGES.map((stage) => {
        const stageOrders = orders.filter(
          (o) => ((o.metadata?.wms_status as WmsStatus) ?? "pending_pick") === stage.key
        );
        return (
          <div key={stage.key} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Text className="text-sm font-medium text-ui-fg-base">{stage.label}</Text>
              <Badge size="xsmall" color={stage.color}>{stageOrders.length}</Badge>
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
        );
      })}
    </div>
  );
};

const WarehousePage = () => {
  const { data: orders, isPending } = useOrders();

  return (
    <>
      <Container className="flex flex-col gap-y-4 p-6">
        <div>
          <Heading className="font-sans font-medium h1-core">Warehouse Pick Flow</Heading>
          <Text className="text-ui-fg-subtle text-sm mt-1">
            Track and advance orders through the pick, pack, and dispatch pipeline.
          </Text>
        </div>

        {isPending ? (
          <Text className="text-ui-fg-muted">Loading orders…</Text>
        ) : (
          <WmsBoard orders={orders ?? []} />
        )}
      </Container>
      <Toaster />
    </>
  );
};

export const config = defineRouteConfig({
  label: "Warehouse",
  icon: ArchiveBox,
});

export default WarehousePage;
