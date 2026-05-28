import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { verify as verifyToken } from "@/lib/cancelToken"
import { formatDateEs } from "@/lib/datetime"
import { InvoiceForm } from "./InvoiceForm"

export const dynamic = "force-dynamic"

export default async function FacturaPage({ params, searchParams }) {
  const { slug } = await params
  const sp = await searchParams
  const id = typeof sp.id === "string" ? sp.id : ""
  const token = typeof sp.token === "string" ? sp.token : ""

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, address: true, phone: true, timezone: true },
  })
  if (!restaurant) notFound()

  if (!id || !token || !verifyToken(id, token)) {
    return (
      <Shell restaurant={restaurant}>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Enlace no válido</h2>
        <p className="text-sm text-gray-600">El enlace ha caducado o no es correcto. Contacta con el restaurante para solicitar tu factura.</p>
      </Shell>
    )
  }

  const reservation = await prisma.reservation.findUnique({ where: { id } })
  if (!reservation || reservation.restaurantId !== restaurant.id) {
    return (
      <Shell restaurant={restaurant}>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Reserva no encontrada</h2>
        <p className="text-sm text-gray-600">No hemos encontrado la reserva asociada a este enlace.</p>
      </Shell>
    )
  }

  const dateStr = new Date(reservation.date).toISOString().slice(0, 10)
  const dateLabel = formatDateEs(dateStr, restaurant.timezone)

  return (
    <Shell restaurant={restaurant}>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Solicitar factura</h2>
      <p className="text-sm text-gray-600 mb-4">Rellena los datos fiscales. El restaurante te enviará la factura por email cuando esté lista.</p>

      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-6 text-sm text-gray-600">
        Reserva del <span className="font-medium text-gray-900">{dateLabel}</span> a las <span className="font-medium text-gray-900">{reservation.time}</span> ({reservation.partySize} pax)
      </div>

      <InvoiceForm
        reservationId={reservation.id}
        token={token}
        defaultName={reservation.customerName}
        defaultEmail={reservation.customerEmail}
      />
    </Shell>
  )
}

const Shell = ({ restaurant, children }) => (
  <div className="min-h-screen bg-gray-50">
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
        {(restaurant.address || restaurant.phone) && (
          <p className="text-sm text-gray-500 mt-1">
            {restaurant.address}
            {restaurant.address && restaurant.phone && " · "}
            {restaurant.phone}
          </p>
        )}
      </div>
    </header>
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {children}
      </div>
    </main>
    <footer className="text-center text-xs text-gray-400 py-6">
      Reservas gestionadas con RestoBook
    </footer>
  </div>
)
