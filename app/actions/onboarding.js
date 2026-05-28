"use server"

import { prisma } from "@/lib/prisma"
import { auth, unstable_update } from "@/lib/auth"

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

export const saveRestaurantSetup = async ({ restaurantData, hoursData, capacityData }) => {
  const session = await auth()
  if (!session?.user?.id) return { error: "No autorizado" }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { restaurant: true },
  })

  if (!user) return { error: "Usuario no encontrado" }

  const slug = restaurantData.slug.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

  // Check slug uniqueness (allow if same restaurant)
  const slugExists = await prisma.restaurant.findUnique({ where: { slug } })
  if (slugExists && slugExists.id !== user.restaurantId) {
    return { error: "Ese slug ya está en uso. Elige otro." }
  }

  const operatingHours = {}
  DAYS.forEach((day) => {
    if (hoursData[day]?.enabled) {
      operatingHours[day] = { open: hoursData[day].open, close: hoursData[day].close }
    } else {
      operatingHours[day] = null
    }
  })

  const config = {
    operatingHours,
    slotDuration: Number(capacityData.slotDuration),
    reservationDuration: Number(capacityData.reservationDuration),
    maxCapacity: Number(capacityData.maxCapacity),
    maxPartySize: Number(capacityData.maxPartySize),
  }

  if (user.restaurantId) {
    await prisma.restaurant.update({
      where: { id: user.restaurantId },
      data: {
        name: restaurantData.name,
        slug,
        email: restaurantData.email,
        phone: restaurantData.phone || null,
        address: restaurantData.address || null,
        config,
      },
    })
  } else {
    const restaurant = await prisma.restaurant.create({
      data: {
        name: restaurantData.name,
        slug,
        email: restaurantData.email,
        phone: restaurantData.phone || null,
        address: restaurantData.address || null,
        config,
        users: { connect: { id: user.id } },
      },
    })
    await prisma.user.update({
      where: { id: user.id },
      data: { restaurantId: restaurant.id },
    })
  }

  // Refresh the JWT cookie so middleware sees the new restaurantId immediately.
  // The jwt callback re-fetches from DB on `trigger: "update"`.
  await unstable_update({})

  return { success: true }
}
