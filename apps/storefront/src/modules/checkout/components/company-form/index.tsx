"use client"

import { updateCart } from "@/lib/data/cart"
import { getCartApprovalStatus } from "@/lib/util/get-cart-approval-status"
import Divider from "@/modules/common/components/divider"
import Radio from "@/modules/common/components/radio"
import { B2BCart } from "@/types"
import { RadioGroup } from "@headlessui/react"
import { clx } from "@medusajs/ui"
import { useState } from "react"

const CompanyForm = ({ cart }: { cart: B2BCart }) => {
  const saved = (cart.metadata?.checkout_type as string) ?? "company"
  const [selectedOption, setSelectedOption] = useState(saved)

  const handleChange = (value: string) => {
    if (isPendingApproval) return
    setSelectedOption(value)
    updateCart({ metadata: { ...cart.metadata, checkout_type: value } })
  }

  const { isPendingAdminApproval, isPendingSalesManagerApproval } =
    getCartApprovalStatus(cart)

  const isPendingApproval =
    isPendingAdminApproval || isPendingSalesManagerApproval

  if (!cart?.company) {
    return null
  }

  return (
    <div>
      <RadioGroup
        value={selectedOption}
        onChange={handleChange}
        className="flex flex-col gap-y-2"
      >
        <RadioGroup.Option value="company">
          <div
            className={clx(
              "flex items-center gap-x-4 text-sm text-neutral-600 cursor-pointer",
              isPendingApproval && "opacity-50 cursor-default"
            )}
          >
            <Radio
              checked={selectedOption === "company"}
              data-testid="company-form-company-radio"
              disabled={isPendingApproval}
            />
            <span>Order on behalf of {cart?.company.name}</span>
          </div>
        </RadioGroup.Option>
        <Divider />
        <RadioGroup.Option value="custom">
          <div
            className={clx(
              "flex items-center gap-x-4 text-sm text-neutral-600 cursor-pointer",
              isPendingApproval && "opacity-50 cursor-default"
            )}
          >
            <Radio
              checked={selectedOption === "custom"}
              data-testid="company-form-custom-radio"
              disabled={isPendingApproval}
            />
            <span>Custom checkout</span>
          </div>
        </RadioGroup.Option>
      </RadioGroup>
    </div>
  )
}

export default CompanyForm
