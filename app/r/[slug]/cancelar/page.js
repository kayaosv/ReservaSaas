import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { verify as verifyToken } from "@/lib/cancelToken"
import { formatDateEs, isPastInTZ } from "@/lib/datetime"
import { CancelConfirm } from "./CancelConfirm"

export const dynamic = "force-dynamic"

export default async function CancelarPage({ params, searchParams }) {
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
        <p className="text-sm text-gray-600">El enlace ha caducado o no es correcto. Contacta con el restaurante si necesitas cancelar tu reserva.</p>
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

  if (reservation.status === "cancelled") {
    return (
      <Shell restaurant={restaurant}>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Reserva ya cancelada</h2>
        <p className="text-sm text-gray-600">Esta reserva ya estaba cancelada. No tienes que hacer nada más.</p>
      </Shell>
    )
  }

  const dateStr = new Date(reservation.date).toISOString().slice(0, 10)
  const past = isPastInTZ(dateStr, reservation.time, restaurant.timezone)
  if (past) {
    return (
      <Shell restaurant={restaurant}>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Reserva pasada</h2>
        <p className="text-sm text-gray-600">Esta reserva ya ha pasado. No se puede cancelar.</p>
      </Shell>
    )
  }

  const dateLabel = formatDateEs(dateStr, restaurant.timezone)

  return (
    <Shell restaurant={restaurant}>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Cancelar reserva</h2>
      <p className="text-sm text-gray-600 mb-6">Confirma que quieres cancelar la siguiente reserva. Esta acción no se puede deshacer.</p>

      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6 space-y-2">
        <Row label="Cliente" value={reservation.customerName} />
        <Row label="Fecha" value={dateLabel} />
        <Row label="Hora" value={reservation.time} />
        <Row label="Comensales" value={String(reservation.partySize)} />
      </div>

      <CancelConfirm id={reservation.id} token={token} />
    </Shell>
  )
}

const Row = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900">{value}</span>
  </div>
)

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
