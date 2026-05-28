import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { mapStripeStatus, getSubscriptionIdFromInvoice } from "@/lib/subscription"

// Webhooks need raw body + Prisma → Node runtime.
export const runtime = "nodejs"

const getRestaurantByCustomer = (customerId) =>
  prisma.restaurant.findUnique({ where: { stripeCustomerId: customerId } })

const getRestaurantBySubscription = (subscriptionId) =>
  prisma.restaurant.findUnique({ where: { stripeSubscriptionId: subscriptionId } })

const applySubscription = async (restaurantId, sub) => {
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      stripeSubscriptionId: sub.id,
      subscriptionStatus: mapStripeStatus(sub.status),
      trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    },
  })
}

export const POST = async (req) => {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (e) {
    console.error("Stripe webhook signature failed", e?.message)
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 })
  }

  // Idempotency: insert event.id into ProcessedStripeEvent. Duplicate → ignore.
  try {
    await prisma.processedStripeEvent.create({
      data: { id: event.id, type: event.type },
    })
  } catch (e) {
    if (e?.code === "P2002") {
      return NextResponse.json({ received: true, duplicate: true })
    }
    console.error("Idempotency insert failed", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const cs = event.data.object
        const restaurantId = cs.metadata?.restaurantId
        if (!restaurantId || !cs.subscription) break
        const sub = await stripe.subscriptions.retrieve(cs.subscription)
        await applySubscription(restaurantId, sub)
        break
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object
        const restaurant = await getRestaurantByCustomer(sub.customer)
        if (!restaurant) break
        await applySubscription(restaurant.id, sub)
        break
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object
        const restaurant =
          (await getRestaurantBySubscription(sub.id)) ||
          (await getRestaurantByCustomer(sub.customer))
        if (!restaurant) break
        await prisma.restaurant.update({
          where: { id: restaurant.id },
          data: { subscriptionStatus: "cancelled" },
        })
        break
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object
        const subId = getSubscriptionIdFromInvoice(invoice)
        if (!subId) break
        const restaurant = await getRestaurantBySubscription(subId)
        if (!restaurant) break
        const sub = await stripe.subscriptions.retrieve(subId)
        await applySubscription(restaurant.id, sub)
        break
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object
        const subId = getSubscriptionIdFromInvoice(invoice)
        if (!subId) break
        const restaurant = await getRestaurantBySubscription(subId)
        if (!restaurant) break
        await prisma.restaurant.update({
          where: { id: restaurant.id },
          data: { subscriptionStatus: "past_due" },
        })
        break
      }
      default:
        break
    }
  } catch (e) {
    console.error("Stripe webhook handler failed", event.type, e)
    // Rollback idempotency record so Stripe retries deliver a chance to succeed.
    await prisma.processedStripeEvent.delete({ where: { id: event.id } }).catch(() => {})
    return NextResponse.json({ error: "Handler error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
