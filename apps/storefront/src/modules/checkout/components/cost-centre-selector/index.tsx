"use client"

import { updateCart } from "@/lib/data/cart"
import { B2BCart } from "@/types"
import { clx } from "@medusajs/ui"
import { useEffect, useState } from "react"

export const COST_CENTRES = [
  { code: "CC-101", name: "Executive & Administration", requires_approval: false },
  { code: "CC-210", name: "Sales & Business Development", requires_approval: false },
  { code: "CC-320", name: "Marketing & Communications", requires_approval: false },
  { code: "CC-430", name: "Procurement & Warehouse", requires_approval: true },
  { code: "CC-540", name: "Finance & Compliance", requires_approval: true },
]

const CostCentreSelector = ({ cart }: { cart: B2BCart }) => {
  const saved = (cart.metadata?.cost_centre as string) ?? ""
  const [selected, setSelected] = useState(saved)
  const [saving, setSaving] = useState(false)

  const current = COST_CENTRES.find((c) => c.code === selected)

  useEffect(() => {
    if (!selected || selected === saved) return
    setSaving(true)
    updateCart({ metadata: { ...cart.metadata, cost_centre: selected } }).finally(
      () => setSaving(false)
    )
  }, [selected])

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex flex-col gap-y-1">
        <label
          htmlFor="cost-centre"
          className="text-sm font-medium text-neutral-700"
        >
          Cost Centre
        </label>
        <select
          id="cost-centre"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-400"
        >
          <option value="" disabled>
            Select a cost centre…
          </option>
          {COST_CENTRES.map((cc) => (
            <option key={cc.code} value={cc.code}>
              {cc.code} — {cc.name}
              {cc.requires_approval ? " (Approval required)" : ""}
            </option>
          ))}
        </select>
      </div>

      {current && (
        <div
          className={clx(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
            current.requires_approval
              ? "bg-amber-50 border border-amber-300 text-amber-800"
              : "bg-green-50 border border-green-300 text-green-800"
          )}
        >
          <span>{current.requires_approval ? "⏳" : "✓"}</span>
          <span>
            {current.requires_approval
              ? "This cost centre requires manager approval before the order proceeds."
              : "This cost centre does not require approval."}
          </span>
        </div>
      )}

      {saving && (
        <p className="text-xs text-neutral-400">Saving…</p>
      )}
    </div>
  )
}

export default CostCentreSelector
