import { after } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { corsJson, corsPreflight } from "@/lib/cors"
import { dateAtMidnightUTC, isPastInTZ } from "@/lib/datetime"
import { sign as signCancelToken } from "@/lib/cancelToken"
import { check as rateCheck, getClientIp } from "@/lib/rateLimit"
import { sendBookingConfirmation, sendNewBookingNotification } from "@/lib/email"
import { createReservation } from "@/lib/reservations"
import { canCreateReservations } from "@/lib/subscription"

export const OPTIONS = () => corsPreflight()

const sanitizeStr = (s, max = 200) => {
  if (typeof s !== "string") return ""
  return s.trim().slice(0, max)
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// POST: public reservation creation (with CORS, honeypot, rate-limit, serializable tx).
export const POST = async (request) => {
  const ip = getClientIp(request)
  const rl = rateCheck(`reserve:${ip}`, 5, 60_000)
  if (!rl.ok) {
    return corsJson(
      { error: "Demasiadas solicitudes. Inténtalo en un minuto." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return corsJson({ error: "JSON inválido." }, { status: 400 })
  }

  // Honeypot: bots fill this; humans don't see it.
  if (body.website && String(body.website).trim().length > 0) {
    return corsJson({ error: "Solicitud rechazada." }, { status: 400 })
  }

  const slug = sanitizeStr(body.slug, 80)
  const date = sanitizeStr(body.date, 10)
  const time = sanitizeStr(body.time, 5)
  const partySize = Number(body.partySize)
  const customerName = sanitizeStr(body.customerName, 120)
  const customerEmail = sanitizeStr(body.customerEmail, 200).toLowerCase()
  const customerPhone = sanitizeStr(body.customerPhone, 40) || null
  const notes = sanitizeStr(body.notes, 500) || null

  if (!slug || !date || !time || !customerName || !customerEmail) {
    return corsJson({ error: "Faltan campos obligatorios." }, { status: 400 })
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return corsJson({ error: "Fecha inválida." }, { status: 400 })
  }
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return corsJson({ error: "Hora inválida." }, { status: 400 })
  }
  if (!isValidEmail(customerEmail)) {
    return corsJson({ error: "Email inválido." }, { status: 400 })
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { slug } })
  if (!restaurant) {
    return corsJson({ error: "Restaurante no encontrado." }, { status: 404 })
  }

  // Commercial guard: only restaurants with an active or trialing subscription
  // can accept public reservations. Manual bookings from the dashboard bypass this.
  if (!canCreateReservations(restaurant.subscriptionStatus)) {
    return corsJson(
      { error: "Este restaurante no está aceptando reservas en este momento." },
      { status: 503 },
    )
  }

  const tz = restaurant.timezone || "Europe/Madrid"
  if (isPastInTZ(date, time, tz)) {
    return corsJson({ error: "No se puede reservar en el pasado." }, { status: 400 })
  }

  let created
  try {
    created = await createReservation({
      restaurant,
      date,
      time,
      partySize,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      source: "widget",
    })
  } catch (e) {
    if (e?.code === "UNAVAILABLE") {
      return corsJson({ error: e.message }, { status: 409 })
    }
    console.error("reservation create failed", e)
    return corsJson({ error: "No se pudo crear la reserva." }, { status: 500 })
  }

  // Fire emails after responding, so the widget gets confirmation instantly.
  after(async () => {
    const reservationForEmail = {
      id: created.id,
      customerName: created.customerName,
      customerEmail,
      customerPhone,
      date,
      time: created.time,
      partySize: created.partySize,
      source: "widget",
      notes,
    }
    await sendBookingConfirmation(reservationForEmail, restaurant)
    if (reservationForEmail.source !== "manual") {
      await sendNewBookingNotification(reservationForEmail, restaurant)
    }
  })

  return corsJson(
    {
      id: created.id,
      cancelToken: signCancelToken(created.id),
      date,
      time: created.time,
      partySize: created.partySize,
      customerName: created.customerName,
      restaurant: { name: restaurant.name, address: restaurant.address, phone: restaurant.phone },
    },
    { status: 201 },
  )
}

// GET: auth-only listing scoped to the session's restaurant.
export const GET = async (request) => {
  const session = await auth()
  if (!session?.user?.restaurantId) {
    return Response.json({ error: "No autorizado." }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const date = searchParams.get("date")
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const status = searchParams.get("status")

  const where = { restaurantId: session.user.restaurantId }
  if (status) where.status = status
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    where.date = dateAtMidnightUTC(date)
  } else if (from || to) {
    where.date = {}
    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) where.date.gte = dateAtMidnightUTC(from)
    if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) where.date.lte = dateAtMidnightUTC(to)
  }

  const reservations = await prisma.reservation.findMany({
    where,
    orderBy: [{ date: "asc" }, { time: "asc" }],
    take: 200,
  })

  return Response.json({ count: reservations.length, reservations })
}
