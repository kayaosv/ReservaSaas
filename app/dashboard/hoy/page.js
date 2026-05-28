import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ReservationRow } from "@/components/ReservationRow"
import { dateAtMidnightUTC, todayStrInTZ } from "@/lib/datetime"
import { HoyHeader } from "./HoyHeader"

export default async function HoyPage() {
  const session = await auth()

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { timezone: true },
  })

  const tz = restaurant?.timezone || "Europe/Madrid"
  const todayStr = todayStrInTZ(tz)

  const reservations = await prisma.reservation.findMany({
    where: {
      restaurantId: session.user.restaurantId,
      date: dateAtMidnightUTC(todayStr),
    },
    orderBy: { time: "asc" },
  })

  const dateLabel = new Date(todayStr + "T12:00:00Z").toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: tz,
  })

  const activeCount = reservations.filter((r) => r.status !== "cancelled").length

  return (
    <div className="p-8">
      <HoyHeader dateLabel={dateLabel} activeCount={activeCount} defaultDate={todayStr} />

      {reservations.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">Sin reservas para hoy</p>
        </div>
      ) : (
        <div className="space-y-2 max-w-2xl">
          {reservations.map((r) => (
            <ReservationRow key={r.id} reservation={r} />
          ))}
        </div>
      )}
    </div>
  )
}
