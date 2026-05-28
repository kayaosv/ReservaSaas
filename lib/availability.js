import { prisma } from "@/lib/prisma"
import {
  weekdayInTZ,
  dateAtMidnightUTC,
  generateSlotTimes,
  timeToMinutes,
} from "@/lib/datetime"

const DEFAULT_CONFIG = {
  slotDuration: 30,
  reservationDuration: 120,
  maxCapacity: 40,
  maxPartySize: 10,
}

const readConfig = (restaurant) => {
  const cfg = typeof restaurant?.config === "object" && restaurant.config !== null ? restaurant.config : {}
  return {
    slotDuration: Number(cfg.slotDuration) || DEFAULT_CONFIG.slotDuration,
    reservationDuration: Number(cfg.reservationDuration) || DEFAULT_CONFIG.reservationDuration,
    maxCapacity: Number(cfg.maxCapacity) || DEFAULT_CONFIG.maxCapacity,
    maxPartySize: Number(cfg.maxPartySize) || DEFAULT_CONFIG.maxPartySize,
    operatingHours: cfg.operatingHours || {},
  }
}

const isClosedDay = (restaurant, dateStr) => {
  const closed = Array.isArray(restaurant.closedDays) ? restaurant.closedDays : []
  return closed.some((d) => d?.date === dateStr)
}

// Returns the number of slots a single reservation occupies.
const slotsPerReservation = (slotDuration, reservationDuration) =>
  Math.max(1, Math.ceil(reservationDuration / slotDuration))

// Build a Map<slotIndex, usedSeats> from existing reservations on this date.
const buildUsage = (reservations, slotTimes, span) => {
  const indexOf = new Map(slotTimes.map((t, i) => [t, i]))
  const usage = new Array(slotTimes.length).fill(0)
  for (const r of reservations) {
    const start = indexOf.get(r.time)
    if (start === undefined) continue
    for (let k = 0; k < span; k++) {
      const idx = start + k
      if (idx >= slotTimes.length) break
      usage[idx] += r.partySize
    }
  }
  return usage
}

// Returns [{ time, available, remaining, totalCapacity }, ...].
// Empty array when restaurant is closed that day or has no operating hours.
// excludeReservationId omits one existing reservation from usage — used when
// recomputing slots from the "edit reservation" modal so the moving booking
// doesn't conflict with itself.
export const getAvailableSlots = async (restaurant, dateStr, { tx, excludeReservationId } = {}) => {
  if (!restaurant || !dateStr) return []
  if (isClosedDay(restaurant, dateStr)) return []

  const { slotDuration, reservationDuration, maxCapacity, operatingHours } = readConfig(restaurant)
  const weekday = weekdayInTZ(dateStr, restaurant.timezone || "Europe/Madrid")
  const hours = operatingHours?.[weekday]
  if (!hours || !hours.open || !hours.close) return []

  const slotTimes = generateSlotTimes(hours.open, hours.close, slotDuration)
  if (slotTimes.length === 0) return []

  const span = slotsPerReservation(slotDuration, reservationDuration)
  const client = tx || prisma
  const reservations = await client.reservation.findMany({
    where: {
      restaurantId: restaurant.id,
      date: dateAtMidnightUTC(dateStr),
      status: { not: "cancelled" },
      ...(excludeReservationId ? { NOT: { id: excludeReservationId } } : {}),
    },
    select: { time: true, partySize: true },
  })

  const usage = buildUsage(reservations, slotTimes, span)
  return slotTimes.map((time, i) => {
    const remaining = Math.max(0, maxCapacity - usage[i])
    return { time, available: remaining > 0, remaining, totalCapacity: maxCapacity }
  })
}

// Atomic-friendly availability check used inside the create-reservation transaction.
// Pass the transactional client via { tx } so the read participates in the same tx.
// excludeReservationId omits one existing reservation from the usage map — used
// when editing a reservation so it doesn't conflict with itself.
export const canReserve = async (restaurant, dateStr, time, partySize, { tx, excludeReservationId } = {}) => {
  if (!restaurant) return { allowed: false, reason: "Restaurante no encontrado." }

  const { slotDuration, reservationDuration, maxCapacity, maxPartySize, operatingHours } = readConfig(restaurant)

  const size = Number(partySize)
  if (!Number.isInteger(size) || size < 1) {
    return { allowed: false, reason: "Número de comensales inválido." }
  }
  if (size > maxPartySize) {
    return { allowed: false, reason: `Máximo ${maxPartySize} comensales por reserva.` }
  }

  if (isClosedDay(restaurant, dateStr)) {
    return { allowed: false, reason: "El restaurante está cerrado ese día." }
  }

  const weekday = weekdayInTZ(dateStr, restaurant.timezone || "Europe/Madrid")
  const hours = operatingHours?.[weekday]
  if (!hours || !hours.open || !hours.close) {
    return { allowed: false, reason: "El restaurante no abre ese día." }
  }

  const slotTimes = generateSlotTimes(hours.open, hours.close, slotDuration)
  const span = slotsPerReservation(slotDuration, reservationDuration)
  const indexOf = new Map(slotTimes.map((t, i) => [t, i]))
  const startIdx = indexOf.get(time)
  if (startIdx === undefined) {
    return { allowed: false, reason: "Hora fuera del horario de apertura." }
  }
  // The reservation must not run past closing time.
  if (startIdx + span > slotTimes.length) {
    return { allowed: false, reason: "No hay tiempo suficiente antes del cierre." }
  }
  if (Number.isNaN(timeToMinutes(time))) {
    return { allowed: false, reason: "Hora inválida." }
  }

  const client = tx || prisma
  const reservations = await client.reservation.findMany({
    where: {
      restaurantId: restaurant.id,
      date: dateAtMidnightUTC(dateStr),
      status: { not: "cancelled" },
      ...(excludeReservationId ? { NOT: { id: excludeReservationId } } : {}),
    },
    select: { time: true, partySize: true },
  })

  const usage = buildUsage(reservations, slotTimes, span)
  for (let k = 0; k < span; k++) {
    const idx = startIdx + k
    if (usage[idx] + size > maxCapacity) {
      return { allowed: false, reason: "No queda capacidad en ese horario." }
    }
  }

  return { allowed: true }
}
