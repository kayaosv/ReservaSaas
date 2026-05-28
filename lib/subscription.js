// Single source of truth for subscription state semantics across the app.
// Status values: "incomplete" | "trialing" | "active" | "past_due" | "cancelled"

export const STATUS_LABELS = {
  incomplete: "Sin activar",
  trialing: "Prueba gratis",
  active: "Activa",
  past_due: "Pago pendiente",
  cancelled: "Cancelada",
}

// Maps a Stripe subscription.status to our internal vocabulary.
export const mapStripeStatus = (stripeStatus) => {
  switch (stripeStatus) {
    case "trialing":
      return "trialing"
    case "active":
      return "active"
    case "past_due":
    case "unpaid":
      return "past_due"
    case "canceled":
    case "incomplete_expired":
      return "cancelled"
    case "incomplete":
      return "incomplete"
    default:
      return "incomplete"
  }
}

// Stripe's Basil API moved invoice.subscription onto invoice.parent. Cover both shapes.
export const getSubscriptionIdFromInvoice = (invoice) => {
  if (!invoice) return null
  if (typeof invoice.subscription === "string") return invoice.subscription
  if (invoice.subscription?.id) return invoice.subscription.id
  const parentSub = invoice.parent?.subscription_details?.subscription
  if (typeof parentSub === "string") return parentSub
  if (parentSub?.id) return parentSub.id
  return null
}

// Commercial guard: only these statuses are allowed to accept public reservations.
export const canCreateReservations = (status) =>
  status === "trialing" || status === "active"

const daysBetween = (a, b) => {
  const ms = b.getTime() - a.getTime()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

// Returns banner descriptor for layouts and ajustes UI. null = no banner needed.
export const getSubscriptionBannerState = (restaurant) => {
  const status = restaurant?.subscriptionStatus || "incomplete"
  const trialEnd = restaurant?.trialEndsAt ? new Date(restaurant.trialEndsAt) : null
  const now = new Date()
  const daysLeft = trialEnd ? daysBetween(now, trialEnd) : null

  if (status === "incomplete") {
    return {
      tone: "blue",
      message: "Activa tu suscripción para empezar a recibir reservas.",
      ctaLabel: "Comenzar prueba gratuita",
      ctaAction: "checkout",
      daysLeft,
    }
  }
  if (status === "trialing") {
    if (daysLeft !== null && daysLeft <= 3) {
      return {
        tone: "amber",
        message: `Tu prueba gratis termina en ${daysLeft} día${daysLeft === 1 ? "" : "s"}.`,
        ctaLabel: "Gestionar suscripción",
        ctaAction: "portal",
        daysLeft,
      }
    }
    return null // no banner during normal trial
  }
  if (status === "past_due") {
    return {
      tone: "red",
      message: "Pago pendiente. Actualiza tu método de pago para no perder reservas.",
      ctaLabel: "Actualizar método de pago",
      ctaAction: "portal",
      daysLeft,
    }
  }
  if (status === "cancelled") {
    return {
      tone: "gray",
      message: "Tu suscripción está cancelada. Tu restaurante no puede recibir reservas.",
      ctaLabel: "Reactivar",
      ctaAction: "checkout",
      daysLeft,
    }
  }
  return null
}
