import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ReservationRow } from "@/components/ReservationRow"
import { ReservasFilters } from "./ReservasFilters"
import { dateAtMidnightUTC, todayStrInTZ } from "@/lib/datetime"

const PAGE_SIZE = 50

export default async function ReservasPage({ searchParams }) {
  const session = await auth()
  const sp = await searchParams

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { timezone: true },
  })
  const tz = restaurant?.timezone || "Europe/Madrid"

  const todayStr = todayStrInTZ(tz)
  const from = typeof sp?.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.from) ? sp.from : todayStr
  const to = typeof sp?.to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.to) ? sp.to : null
  const status = typeof sp?.status === "string" ? sp.status : null
  const page = Math.max(1, parseInt(sp?.page || "1", 10) || 1)

  const where = { restaurantId: session.user.restaurantId, date: { gte: dateAtMidnightUTC(from) } }
  if (to) where.date.lte = dateAtMidnightUTC(to)
  if (status) where.status = status

  const [total, reservations] = await Promise.all([
    prisma.reservation.count({ where }),
    prisma.reservation.findMany({
      where,
      orderBy: [{ date: "asc" }, { time: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Reservas</h1>
      <p className="text-sm text-gray-500 mb-6">{total} {total === 1 ? "reserva" : "reservas"}</p>

      <ReservasFilters from={from} to={to || ""} status={status || ""} />

      {reservations.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm">No hay reservas que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="space-y-2 mt-4">
          {reservations.map((r) => (
            <ReservationRow key={r.id} reservation={r} showDate />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 text-sm">
          <span className="text-gray-500">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <PageLink page={page - 1} from={from} to={to} status={status}>← Anterior</PageLink>
            )}
            {page < totalPages && (
              <PageLink page={page + 1} from={from} to={to} status={status}>Siguiente →</PageLink>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const PageLink = ({ page, from, to, status, children }) => {
  const params = new URLSearchParams()
  params.set("page", String(page))
  if (from) params.set("from", from)
  if (to) params.set("to", to)
  if (status) params.set("status", status)
  return (
    <a
      href={`/dashboard/reservas?${params.toString()}`}
      className="px-3 py-1 border border-gray-300 rounded-md hover:border-gray-500 text-gray-700"
    >
      {children}
    </a>
  )
}
