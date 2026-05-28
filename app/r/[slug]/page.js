import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { BookingFlow } from "./BookingFlow"

export const generateMetadata = async ({ params }) => {
  const { slug } = await params
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { name: true, address: true },
  })
  if (!restaurant) return { title: "Restaurante no encontrado" }

  const title = `Reservar en ${restaurant.name}`
  const description = restaurant.address
    ? `Reserva tu mesa en ${restaurant.name} (${restaurant.address})`
    : `Reserva tu mesa en ${restaurant.name}`

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  }
}

export default async function PublicRestaurantPage({ params }) {
  const { slug } = await params

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
      phone: true,
      timezone: true,
      config: true,
      closedDays: true,
    },
  })

  if (!restaurant) notFound()

  const cfg = typeof restaurant.config === "object" && restaurant.config !== null ? restaurant.config : {}
  const maxPartySize = Number(cfg.maxPartySize) || 10

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
          {(restaurant.address || restaurant.phone) && (
            <p className="text-sm text-gray-500 mt-1">
              {restaurant.address}
              {restaurant.address && restaurant.phone && " · "}
              {restaurant.phone}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <BookingFlow slug={restaurant.slug} maxPartySize={maxPartySize} />
      </main>

      <footer className="text-center text-xs text-gray-400 py-6">
        Reservas gestionadas con RestoBook
      </footer>
    </div>
  )
}
