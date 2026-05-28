"use server"

import { after } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { sendCancellationToCustomer, sendBookingConfirmation, sendBookingModified } from "@/lib/email"
import { createReservation } from "@/lib/reservations"
import { canReserve, getAvailableSlots } from "@/lib/availability"
import { dateAtMidnightUTC, isPastInTZ } from "@/lib/datetime"

const VALID = new Set(["confirmed", "completed", "cancelled", "no_show"])

export const updateReservationStatus = async (id, status) => {
  const session = await auth()
  if (!session?.user?.restaurantId) return { error: "No autorizado." }
  if (!VALID.has(status)) return { error: "Estado inválido." }

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { restaurant: true },
  })
  if (!reservation) return { error: "Reserva no encontrada." }
  if (reservation.restaurantId !== session.user.restaurantId) return { error: "No autorizado." }

  await prisma.reservation.update({
    where: { id },
    data: {
      status,
      cancelledAt: status === "cancelled" ? new Date() : reservation.cancelledAt,
    },
  })

  if (status === "cancelled" && reservation.status !== "cancelled") {
    after(async () => {
      await sendCancellationToCustomer(reservation, reservation.restaurant)
    })
  }

  revalidatePath("/dashboard/hoy")
  revalidatePath("/dashboard/reservas")
  return { success: true }
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const getAvailabilityForDate = async (date, excludeReservationId) => {
  const session = await auth()
  if (!session?.user?.restaurantId) return { error: "No autorizado." }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return { error: "Fecha inválida." }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
  })
  if (!restaurant) return { error: "Restaurante no encontrado." }

  const slots = await getAvailableSlots(restaurant, date, { excludeReservationId })
  return { slots, maxPartySize: restaurant.config?.maxPartySize ?? 10 }
}

export const createReservationManual = async (input) => {
  const session = await auth()
  if (!session?.user?.restaurantId) return { error: "No autorizado." }

  const customerName = String(input?.customerName || "").trim().slice(0, 120)
  const customerEmail = String(input?.customerEmail || "").trim().toLowerCase().slice(0, 200)
  const customerPhone = String(input?.customerPhone || "").trim().slice(0, 40) || null
  const date = String(input?.date || "").slice(0, 10)
  const time = String(input?.time || "").slice(0, 5)
  const partySize = Number(input?.partySize)
  const notes = String(input?.notes || "").trim().slice(0, 500) || null

  if (!customerName) return { error: "El nombre del cliente es obligatorio." }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Fecha inválida." }
  if (!/^\d{2}:\d{2}$/.test(time)) return { error: "Hora inválida." }
  if (customerEmail && !isValidEmail(customerEmail)) return { error: "Email inválido." }
  if (!Number.isInteger(partySize) || partySize < 1) return { error: "Número de comensales inválido." }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
  })
  if (!restaurant) return { error: "Restaurante no encontrado." }

  // Manual bookings intentionally skip canCreateReservations: a restaurant
  // with past_due/cancelled should still be able to record walk-ins; only
  // public widget intake is blocked.

  if (isPastInTZ(date, time, restaurant.timezone || "Europe/Madrid")) {
    return { error: "No se puede reservar en el pasado." }
  }

  let created
  try {
    created = await createReservation({
      restaurant,
      date,
      time,
      partySize,
      customerName,
      customerEmail: customerEmail || "",
      customerPhone,
      notes,
      source: "manual",
    })
  } catch (e) {
    if (e?.code === "UNAVAILABLE") return { error: e.message }
    console.error("manual reservation failed", e)
    return { error: "No se pudo crear la reserva." }
  }

  if (customerEmail) {
    after(async () => {
      await sendBookingConfirmation({ ...created, date }, restaurant)
    })
  }

  revalidatePath("/dashboard/hoy")
  revalidatePath("/dashboard/reservas")
  return { success: true, reservation: { id: created.id, date, time: created.time } }
}

const VALID_EDIT_FIELDS = ["date", "time", "partySize", "notes"]

export const updateReservation = async (id, patch) => {
  const session = await auth()
  if (!session?.user?.restaurantId) return { error: "No autorizado." }

  const current = await prisma.reservation.findUnique({
    where: { id },
    include: { restaurant: true },
  })
  if (!current || current.restaurantId !== session.user.restaurantId) {
    return { error: "No autorizado." }
  }
  if (current.status !== "confirmed") {
    return { error: "Solo se pueden editar reservas confirmadas." }
  }

  const oldDateStr = current.date.toISOString().slice(0, 10)
  const tz = current.restaurant.timezone || "Europe/Madrid"
  if (isPastInTZ(oldDateStr, current.time, tz)) {
    return { error: "No se puede editar una reserva pasada." }
  }

  const date = String(patch?.date || oldDateStr).slice(0, 10)
  const time = String(patch?.time || current.time).slice(0, 5)
  const partySize = Number(patch?.partySize ?? current.partySize)
  const notes = patch?.notes !== undefined ? (String(patch.notes).trim().slice(0, 500) || null) : current.notes

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Fecha inválida." }
  if (!/^\d{2}:\d{2}$/.test(time)) return { error: "Hora inválida." }
  if (!Number.isInteger(partySize) || partySize < 1) return { error: "Número de comensales inválido." }

  let updated
  try {
    updated = await prisma.$transaction(
      async (tx) => {
        const check = await canReserve(current.restaurant, date, time, partySize, { tx, excludeReservationId: id })
        if (!check.allowed) {
          const err = new Error(check.reason)
          err.code = "UNAVAILABLE"
          throw err
        }
        return tx.reservation.update({
          where: { id },
          data: {
            date: dateAtMidnightUTC(date),
            time,
            partySize,
            notes,
          },
        })
      },
      { isolationLevel: "Serializable" },
    )
  } catch (e) {
    if (e?.code === "UNAVAILABLE") return { error: e.message }
    console.error("update reservation failed", e)
    return { error: "No se pudo actualizar la reserva." }
  }

  const dateOrTimeChanged = oldDateStr !== date || current.time !== time
  if (dateOrTimeChanged && current.customerEmail) {
    after(async () => {
      await sendBookingModified(
        {
          ...current,
          oldDate: oldDateStr,
          oldTime: current.time,
          oldPartySize: current.partySize,
          date,
          time,
          partySize,
        },
        current.restaurant,
      )
    })
  }

  revalidatePath("/dashboard/hoy")
  revalidatePath("/dashboard/reservas")
  return { success: true, reservation: updated }
}
