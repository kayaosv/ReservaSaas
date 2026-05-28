import { after } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { verify as verifyToken } from "@/lib/cancelToken"
import { corsJson, corsPreflight } from "@/lib/cors"
import { sendCancellationToRestaurant, sendCancellationToCustomer } from "@/lib/email"

const VALID_STATUSES = new Set(["confirmed", "completed", "cancelled", "no_show"])

export const OPTIONS = () => corsPreflight()

export const PATCH = async (request, { params }) => {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.restaurantId) {
    return Response.json({ error: "No autorizado." }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 })
  }

  const status = typeof body?.status === "string" ? body.status : null
  if (!status || !VALID_STATUSES.has(status)) {
    return Response.json({ error: "status inválido." }, { status: 400 })
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { restaurant: true },
  })
  if (!reservation) {
    return Response.json({ error: "Reserva no encontrada." }, { status: 404 })
  }
  if (reservation.restaurantId !== session.user.restaurantId) {
    return Response.json({ error: "No autorizado." }, { status: 403 })
  }

  const updated = await prisma.reservation.update({
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

  return Response.json({ reservation: updated })
}

export const DELETE = async (request, { params }) => {
  const { id } = await params
  const token = request.nextUrl.searchParams.get("token")

  if (!token || !verifyToken(id, token)) {
    return corsJson({ error: "Token inválido." }, { status: 401 })
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { restaurant: true },
  })
  if (!reservation) {
    return corsJson({ error: "Reserva no encontrada." }, { status: 404 })
  }
  if (reservation.status === "cancelled") {
    return corsJson({ ok: true, alreadyCancelled: true })
  }

  await prisma.reservation.update({
    where: { id },
    data: { status: "cancelled", cancelledAt: new Date() },
  })

  after(async () => {
    await sendCancellationToRestaurant(reservation, reservation.restaurant)
  })

  return corsJson({ ok: true })
}
