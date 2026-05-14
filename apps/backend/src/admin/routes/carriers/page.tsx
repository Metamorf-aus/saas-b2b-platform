"use client"

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { DocumentText } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  Toaster,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/client"

export const CARRIERS_METADATA_KEY = "pg_carriers"

export const useCarriers = () =>
  useQuery({
    queryKey: ["pg-carriers"],
    queryFn: async () => {
      const res = await sdk.client.fetch<any>("/admin/stores", { method: "GET" })
      const store = res.stores?.[0] ?? res.store
      const carriers =
        (store?.metadata?.[CARRIERS_METADATA_KEY] as string[] | undefined) ?? []
      return { store, carriers }
    },
  })

const CarriersPage = () => {
  const { data, isPending } = useCarriers()
  const qc = useQueryClient()
  const [name, setName] = useState("")

  const saveCarriers = async (carriers: string[]) => {
    const store = data?.store
    if (!store) return
    await sdk.client.fetch(`/admin/stores/${store.id}`, {
      method: "POST",
      body: {
        metadata: { ...store.metadata, [CARRIERS_METADATA_KEY]: carriers },
      },
    })
    qc.invalidateQueries({ queryKey: ["pg-carriers"] })
  }

  const addMutation = useMutation({
    mutationFn: async () => {
      const current = data?.carriers ?? []
      if (current.includes(name)) throw new Error("Carrier already exists")
      await saveCarriers([...current, name])
    },
    onSuccess: () => {
      setName("")
      toast.success("Carrier added")
    },
    onError: (err: any) => toast.error(err.message ?? "Failed to add carrier"),
  })

  const deleteMutation = useMutation({
    mutationFn: async (carrier: string) => {
      const current = data?.carriers ?? []
      await saveCarriers(current.filter((c) => c !== carrier))
    },
    onSuccess: () => toast.success("Carrier removed"),
    onError: () => toast.error("Failed to remove carrier"),
  })

  return (
    <>
      <Container className="flex flex-col gap-y-6 p-6">
        <div>
          <Heading className="font-sans font-medium h1-core">Carriers</Heading>
          <Text className="text-ui-fg-subtle text-sm mt-1">
            Manage shipping carriers available at dispatch.
          </Text>
        </div>

        <div className="flex flex-col gap-4 border border-ui-border-base rounded-lg p-4">
          <Heading level="h2" className="text-sm font-medium">
            Add Carrier
          </Heading>
          <div className="flex gap-3 items-end">
            <div className="flex flex-col gap-1 flex-1">
              <Label size="xsmall">Carrier Name *</Label>
              <Input
                placeholder="e.g. Australia Post"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && name && addMutation.mutate()}
              />
            </div>
            <Button
              size="small"
              onClick={() => addMutation.mutate()}
              isLoading={addMutation.isPending}
              disabled={!name}
            >
              Add Carrier
            </Button>
          </div>
        </div>

        {isPending ? (
          <Text className="text-ui-fg-muted">Loading…</Text>
        ) : (
          <div className="flex flex-col gap-3">
            {(data?.carriers ?? []).map((carrier) => (
              <div
                key={carrier}
                className="flex items-center justify-between border border-ui-border-base rounded-lg p-4"
              >
                <Text className="text-sm font-medium">{carrier}</Text>
                <Button
                  size="small"
                  variant="danger"
                  onClick={() => deleteMutation.mutate(carrier)}
                  isLoading={deleteMutation.isPending}
                >
                  Remove
                </Button>
              </div>
            ))}
            {data?.carriers.length === 0 && (
              <Text className="text-ui-fg-muted text-sm">
                No carriers yet. Add one above.
              </Text>
            )}
          </div>
        )}
      </Container>
      <Toaster />
    </>
  )
}

export const config = defineRouteConfig({
  label: "Carriers",
  icon: DocumentText,
})

export default CarriersPage
