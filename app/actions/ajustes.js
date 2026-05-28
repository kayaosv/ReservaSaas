"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

export const updateRestaurantSettings = async (formData) => {
  const session = await auth()
  if (!session?.user?.restaurantId) return { error: "No autorizado" }

  const name = formData.get("name")?.toString().trim()
  const slug = formData.get("slug")?.toString().trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  const email = formData.get("email")?.toString().trim()
  const phone = formData.get("phone")?.toString().trim() || null
  const address = formData.get("address")?.toString().trim() || null

  if (!name || !slug || !email) return { error: "Nombre, slug y email son obligatorios." }

  const slugExists = await prisma.restaurant.findUnique({ where: { slug } })
  if (slugExists && slugExists.id !== session.user.restaurantId) {
    return { error: "Ese slug ya está en uso." }
  }

  await prisma.restaurant.update({
    where: { id: session.user.restaurantId },
    data: { name, slug, email, phone, address },
  })

  revalidatePath("/dashboard/ajustes")
  return { success: true }
}

export const updateRestaurantConfig = async ({ hoursData, capacityData }) => {
  const session = await auth()
  if (!session?.user?.restaurantId) return { error: "No autorizado" }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
  })

  const existingConfig = typeof restaurant.config === "object" ? restaurant.config : {}

  const operatingHours = {}
  DAYS.forEach((day) => {
    if (hoursData[day]?.enabled) {
      operatingHours[day] = { open: hoursData[day].open, close: hoursData[day].close }
    } else {
      operatingHours[day] = null
    }
  })

  const config = {
    ...existingConfig,
    operatingHours,
    slotDuration: Number(capacityData.slotDuration),
    reservationDuration: Number(capacityData.reservationDuration),
    maxCapacity: Number(capacityData.maxCapacity),
    maxPartySize: Number(capacityData.maxPartySize),
  }

  await prisma.restaurant.update({
    where: { id: session.user.restaurantId },
    data: { config },
  })

  revalidatePath("/dashboard/ajustes")
  return { success: true }
}

export const addClosedDay = async ({ date, reason }) => {
  const session = await auth()
  if (!session?.user?.restaurantId) return { error: "No autorizado" }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { closedDays: true },
  })

  const existing = Array.isArray(restaurant.closedDays) ? restaurant.closedDays : []
  const updated = [...existing, { date, reason: reason || "" }]

  await prisma.restaurant.update({
    where: { id: session.user.restaurantId },
    data: { closedDays: updated },
  })

  revalidatePath("/dashboard/ajustes")
  return { success: true }
}

export const removeClosedDay = async (date) => {
  const session = await auth()
  if (!session?.user?.restaurantId) return { error: "No autorizado" }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { closedDays: true },
  })

  const existing = Array.isArray(restaurant.closedDays) ? restaurant.closedDays : []
  const updated = existing.filter((d) => d.date !== date)

  await prisma.restaurant.update({
    where: { id: session.user.restaurantId },
    data: { closedDays: updated },
  })

  revalidatePath("/dashboard/ajustes")
  return { success: true }
}
