"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { dateAtMidnightUTC, todayStrInTZ } from "@/lib/datetime"
import { generateReservationsCsv } from "@/lib/csv"

const isDateStr = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s)

export const exportReservationsCsv = async ({ from, to, status } = {}) => {
  const session = await auth()
  if (!session?.user?.restaurantId) return { error: "No autorizado." }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { timezone: true },
  })
  const tz = restaurant?.timezone || "Europe/Madrid"

  const where = { restaurantId: session.user.restaurantId }
  if (isDateStr(from) || isDateStr(to)) {
    where.date = {}
    if (isDateStr(from)) where.date.gte = dateAtMidnightUTC(from)
    if (isDateStr(to)) where.date.lte = dateAtMidnightUTC(to)
  }
  if (status && typeof status === "string") where.status = status

  const reservations = await prisma.reservation.findMany({
    where,
    orderBy: [{ date: "asc" }, { time: "asc" }],
    take: 10_000,
  })

  const content = generateReservationsCsv(reservations, tz)
  const today = todayStrInTZ(tz)
  return { filename: `reservas-${today}.csv`, content }
}
