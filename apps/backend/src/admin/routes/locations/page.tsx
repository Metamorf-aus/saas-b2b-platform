"use client"

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { BuildingStorefront } from "@medusajs/icons"
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

const LocationsPage = () => {
  const { data: locations, isPending } = useLocations()
  const qc = useQueryClient()
  const [name, setName] = useState("")
  const [address1, setAddress1] = useState("")
  const [city, setCity] = useState("")

  const createMutation = useMutation({
    mutationFn: async () => {
      await sdk.client.fetch("/admin/stock-locations", {
        method: "POST",
        body: {
          name,
          address: { address_1: address1, city, country_code: "AU" },
        },
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-locations"] })
      setName("")
      setAddress1("")
      setCity("")
      toast.success("Location created")
    },
    onError: () => toast.error("Failed to create location"),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await sdk.client.fetch(`/admin/stock-locations/${id}`, {
        method: "DELETE",
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-locations"] })
      toast.success("Location deleted")
    },
    onError: () => toast.error("Failed to delete location"),
  })

  return (
    <>
      <Container className="flex flex-col gap-y-6 p-6">
        <div>
          <Heading className="font-sans font-medium h1-core">Locations</Heading>
          <Text className="text-ui-fg-subtle text-sm mt-1">
            Manage warehouse and dispatch locations orders are fulfilled from.
          </Text>
        </div>

        <div className="flex flex-col gap-4 border border-ui-border-base rounded-lg p-4">
          <Heading level="h2" className="text-sm font-medium">
            Add Location
          </Heading>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <Label size="xsmall">Name *</Label>
              <Input
                placeholder="e.g. Sydney Warehouse"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label size="xsmall">Street Address</Label>
              <Input
                placeholder="e.g. 123 Warehouse Rd"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label size="xsmall">City</Label>
              <Input
                placeholder="e.g. Sydney"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Button
              size="small"
              onClick={() => createMutation.mutate()}
              isLoading={createMutation.isPending}
              disabled={!name}
            >
              Add Location
            </Button>
          </div>
        </div>

        {isPending ? (
          <Text className="text-ui-fg-muted">Loading…</Text>
        ) : (
          <div className="flex flex-col gap-3">
            {(locations ?? []).map((loc) => (
              <div
                key={loc.id}
                className="flex items-center justify-between border border-ui-border-base rounded-lg p-4"
              >
                <div>
                  <Text className="font-medium text-sm">{loc.name}</Text>
                  {loc.address && (
                    <Text className="text-xs text-ui-fg-subtle">
                      {[loc.address.address_1, loc.address.city]
                        .filter(Boolean)
                        .join(", ")}
                    </Text>
                  )}
                </div>
                <Button
                  size="small"
                  variant="danger"
                  onClick={() => deleteMutation.mutate(loc.id)}
                  isLoading={deleteMutation.isPending}
                >
                  Delete
                </Button>
              </div>
            ))}
            {locations?.length === 0 && (
              <Text className="text-ui-fg-muted text-sm">
                No locations yet. Add one above.
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
  label: "Locations",
  icon: BuildingStorefront,
})

export default LocationsPage
