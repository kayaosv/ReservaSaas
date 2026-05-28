import { prisma } from "@/lib/prisma"
import { getAvailableSlots } from "@/lib/availability"
import { corsJson, corsPreflight } from "@/lib/cors"
import { todayStrInTZ } from "@/lib/datetime"

export const OPTIONS = () => corsPreflight()

export const GET = async (request) => {
  const { searchParams } = request.nextUrl
  const slug = searchParams.get("slug")
  const date = searchParams.get("date")

  if (!slug || !date) {
    return corsJson({ error: "slug y date son obligatorios." }, { status: 400 })
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return corsJson({ error: "date debe tener formato YYYY-MM-DD." }, { status: 400 })
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { slug } })
  if (!restaurant) {
    return corsJson({ error: "Restaurante no encontrado." }, { status: 404 })
  }

  // Don't expose availability for past days.
  const today = todayStrInTZ(restaurant.timezone || "Europe/Madrid")
  if (date < today) {
    return corsJson({ date, slots: [] })
  }

  const slots = await getAvailableSlots(restaurant, date)
  return corsJson({ date, slots })
}
