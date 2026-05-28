import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const POST = async (req) => {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { users: { some: { id: session.user.id } } },
  })

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurante no encontrado" }, { status: 404 })
  }

  let customerId = restaurant.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: restaurant.email,
      name: restaurant.name,
      metadata: { restaurantId: restaurant.id },
    })
    customerId = customer.id
    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { stripeCustomerId: customerId },
    })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL
  const url = new URL(req.url)
  const from = url.searchParams.get("from")
  const cancelPath = from === "onboarding" ? "/onboarding?step=4" : "/dashboard/ajustes"

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      { price: process.env.STRIPE_PRICE_ID, quantity: 1 },
    ],
    subscription_data: {
      trial_period_days: 14,
      metadata: { restaurantId: restaurant.id },
    },
    payment_method_collection: "always",
    metadata: { restaurantId: restaurant.id },
    success_url: `${appUrl}/dashboard/ajustes?checkout=success`,
    cancel_url: `${appUrl}${cancelPath}`,
  })

  return NextResponse.json({ url: checkoutSession.url })
}
