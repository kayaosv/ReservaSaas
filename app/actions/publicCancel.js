"use server"

import { after } from "next/server"
import { prisma } from "@/lib/prisma"
import { verify as verifyToken } from "@/lib/cancelToken"
import { sendCancellationToRestaurant } from "@/lib/email"

export const cancelByToken = async (id, token) => {
  if (!id || typeof id !== "string") return { error: "Reserva inválida." }
  if (!token || !verifyToken(id, token)) return { error: "Token inválido." }

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { restaurant: true },
  })
  if (!reservation) return { error: "Reserva no encontrada." }
  if (reservation.status === "cancelled") {
    return { success: true, alreadyCancelled: true }
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data: { status: "cancelled", cancelledAt: new Date() },
  })

  after(async () => {
    await sendCancellationToRestaurant({ ...updated, customerName: reservation.customerName, customerEmail: reservation.customerEmail }, reservation.restaurant)
  })

  return { success: true }
}
