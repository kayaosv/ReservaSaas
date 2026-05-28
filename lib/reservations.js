import "server-only"
import { prisma } from "@/lib/prisma"
import { canReserve } from "@/lib/availability"
import { dateAtMidnightUTC } from "@/lib/datetime"

// Shared transactional reservation creator. Both the public widget endpoint
// and the dashboard manual-booking server action go through here so the
// capacity check + insert remain atomic under Serializable isolation.
//
// Throws Error with .code === "UNAVAILABLE" when the slot is full or invalid.
// Throws other errors for caller to handle (DB issues, etc).
export const createReservation = async ({
  restaurant,
  date,
  time,
  partySize,
  customerName,
  customerEmail,
  customerPhone = null,
  notes = null,
  source = "widget",
}) => {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const created = await prisma.$transaction(
        async (tx) => {
          const check = await canReserve(restaurant, date, time, partySize, { tx })
          if (!check.allowed) {
            const err = new Error(check.reason)
            err.code = "UNAVAILABLE"
            throw err
          }
          return tx.reservation.create({
            data: {
              restaurantId: restaurant.id,
              customerName,
              customerEmail,
              customerPhone,
              date: dateAtMidnightUTC(date),
              time,
              partySize: Number(partySize),
              source,
              status: "confirmed",
              notes,
            },
          })
        },
        { isolationLevel: "Serializable" },
      )
      return created
    } catch (e) {
      if (e?.code === "UNAVAILABLE") throw e
      // Serializable conflict — retry once.
      if (e?.code === "P2034" && attempt === 0) continue
      throw e
    }
  }
}
