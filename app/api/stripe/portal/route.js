import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const POST = async () => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { users: { some: { id: session.user.id } } },
  })

  if (!restaurant?.stripeCustomerId) {
    return NextResponse.json({ error: "No hay suscripción activa" }, { status: 404 })
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: restaurant.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL}/dashboard/ajustes`,
  })

  return NextResponse.json({ url: portalSession.url })
}
