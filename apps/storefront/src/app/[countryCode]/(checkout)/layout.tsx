import LocalizedClientLink from "@/modules/common/components/localized-client-link"
import Image from "next/image"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mb-2 w-full bg-white relative small:min-h-screen">
      <div className="h-16 bg-white">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink className="hover:text-ui-fg-base" href="/">
            <Image
              src="/logo.png"
              alt="Precision"
              width={140}
              height={33}
              priority
              className="h-7 small:h-8 w-auto"
            />
          </LocalizedClientLink>
        </nav>
      </div>
      <div className="relative bg-neutral-100" data-testid="checkout-container">
        {children}
      </div>
    </div>
  )
}
