import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { FacturasClient } from "./FacturasClient"

export const dynamic = "force-dynamic"

export default async function FacturasPage() {
  const session = await auth()

  const invoices = await prisma.invoiceRequest.findMany({
    where: { restaurantId: session.user.restaurantId },
    orderBy: { createdAt: "desc" },
  })

  // Serialize Dates so they survive the boundary cleanly.
  const serialized = invoices.map((i) => ({
    ...i,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }))

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Solicitudes de factura</h1>
      </div>
      <FacturasClient invoices={serialized} />
    </div>
  )
}
