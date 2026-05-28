import "server-only"
import { render } from "@react-email/components"
import { getResend, EMAIL_FROM } from "@/lib/resend"
import { sign as signCancelToken } from "@/lib/cancelToken"
import { formatDateEs } from "@/lib/datetime"
import { BookingConfirmation } from "@/emails/BookingConfirmation"
import { BookingReminder } from "@/emails/BookingReminder"
import { NewBookingNotification } from "@/emails/NewBookingNotification"
import { BookingCancelledToRestaurant } from "@/emails/BookingCancelledToRestaurant"
import { BookingCancelledToCustomer } from "@/emails/BookingCancelledToCustomer"
import { BookingModified } from "@/emails/BookingModified"
import { InvoiceReady } from "@/emails/InvoiceReady"
import { TrialEndingSoon } from "@/emails/TrialEndingSoon"
import { TrialExpired } from "@/emails/TrialExpired"

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

// Reservation may be either a hydrated object (with `restaurant`) or just enough fields to refetch.
// Each helper accepts a "reservation" that already includes the restaurant relation when possible.
const getDateStr = (reservation) => {
  // reservation.date is a midnight-UTC Date — convert back to YYYY-MM-DD.
  if (typeof reservation.date === "string") return reservation.date.slice(0, 10)
  const d = new Date(reservation.date)
  return d.toISOString().slice(0, 10)
}

const buildPublicUrls = (reservation, restaurant) => {
  const token = signCancelToken(reservation.id)
  const base = APP_URL()
  const cancelUrl = `${base}/r/${restaurant.slug}/cancelar?token=${token}&id=${reservation.id}`
  const invoiceUrl = `${base}/r/${restaurant.slug}/factura?token=${token}&id=${reservation.id}`
  return { cancelUrl, invoiceUrl, token }
}

const send = async ({ to, subject, react }) => {
  try {
    const html = await render(react)
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    })
    if (error) {
      console.error("Resend error", error)
      return { success: false, error }
    }
    return { success: true, id: data?.id }
  } catch (err) {
    console.error("Email send failed", err)
    return { success: false, error: err }
  }
}

export const sendBookingConfirmation = async (reservation, restaurant) => {
  const dateLabel = formatDateEs(getDateStr(reservation), restaurant.timezone)
  const { cancelUrl, invoiceUrl } = buildPublicUrls(reservation, restaurant)
  return send({
    to: reservation.customerEmail,
    subject: `Reserva confirmada en ${restaurant.name}`,
    react: BookingConfirmation({
      customerName: reservation.customerName,
      restaurantName: restaurant.name,
      restaurantAddress: restaurant.address,
      restaurantPhone: restaurant.phone,
      dateLabel,
      time: reservation.time,
      partySize: reservation.partySize,
      cancelUrl,
      invoiceUrl,
    }),
  })
}

export const sendBookingReminder = async (reservation, restaurant) => {
  const dateLabel = formatDateEs(getDateStr(reservation), restaurant.timezone)
  const { cancelUrl, invoiceUrl } = buildPublicUrls(reservation, restaurant)
  return send({
    to: reservation.customerEmail,
    subject: `Mañana tienes reserva en ${restaurant.name}`,
    react: BookingReminder({
      customerName: reservation.customerName,
      restaurantName: restaurant.name,
      restaurantAddress: restaurant.address,
      restaurantPhone: restaurant.phone,
      dateLabel,
      time: reservation.time,
      partySize: reservation.partySize,
      cancelUrl,
      invoiceUrl,
    }),
  })
}

export const sendNewBookingNotification = async (reservation, restaurant) => {
  const dateLabel = formatDateEs(getDateStr(reservation), restaurant.timezone)
  const dashboardUrl = `${APP_URL()}/dashboard/hoy`
  return send({
    to: restaurant.email,
    subject: `Nueva reserva — ${reservation.customerName} (${reservation.partySize} pax)`,
    react: NewBookingNotification({
      restaurantName: restaurant.name,
      customerName: reservation.customerName,
      customerEmail: reservation.customerEmail,
      customerPhone: reservation.customerPhone,
      partySize: reservation.partySize,
      dateLabel,
      time: reservation.time,
      source: reservation.source,
      notes: reservation.notes,
      dashboardUrl,
    }),
  })
}

export const sendCancellationToRestaurant = async (reservation, restaurant) => {
  const dateLabel = formatDateEs(getDateStr(reservation), restaurant.timezone)
  return send({
    to: restaurant.email,
    subject: `Cancelación — ${reservation.customerName} (${reservation.partySize} pax)`,
    react: BookingCancelledToRestaurant({
      restaurantName: restaurant.name,
      customerName: reservation.customerName,
      partySize: reservation.partySize,
      dateLabel,
      time: reservation.time,
    }),
  })
}

export const sendCancellationToCustomer = async (reservation, restaurant) => {
  const dateLabel = formatDateEs(getDateStr(reservation), restaurant.timezone)
  return send({
    to: reservation.customerEmail,
    subject: `Tu reserva en ${restaurant.name} ha sido cancelada`,
    react: BookingCancelledToCustomer({
      customerName: reservation.customerName,
      restaurantName: restaurant.name,
      restaurantPhone: restaurant.phone,
      partySize: reservation.partySize,
      dateLabel,
      time: reservation.time,
    }),
  })
}

export const sendBookingModified = async (reservation, restaurant) => {
  const oldDateLabel = formatDateEs(reservation.oldDate, restaurant.timezone)
  const newDateLabel = formatDateEs(reservation.date, restaurant.timezone)
  return send({
    to: reservation.customerEmail,
    subject: `Tu reserva en ${restaurant.name} ha sido modificada`,
    react: BookingModified({
      customerName: reservation.customerName,
      restaurantName: restaurant.name,
      restaurantAddress: restaurant.address,
      restaurantPhone: restaurant.phone,
      oldDateLabel,
      oldTime: reservation.oldTime,
      oldPartySize: reservation.oldPartySize,
      newDateLabel,
      newTime: reservation.time,
      newPartySize: reservation.partySize,
    }),
  })
}

export const sendTrialEndingSoon = async (restaurant, daysLeft) => {
  const activateUrl = `${APP_URL()}/dashboard/ajustes?activate=1`
  return send({
    to: restaurant.email,
    subject: `Tu prueba gratis de RestoBook termina en ${daysLeft} días`,
    react: TrialEndingSoon({
      restaurantName: restaurant.name,
      daysLeft,
      activateUrl,
    }),
  })
}

export const sendTrialExpired = async (restaurant) => {
  const activateUrl = `${APP_URL()}/dashboard/ajustes?activate=1`
  return send({
    to: restaurant.email,
    subject: `Tu prueba gratis de RestoBook ha terminado`,
    react: TrialExpired({
      restaurantName: restaurant.name,
      activateUrl,
    }),
  })
}

export const sendInvoiceReady = async (invoiceRequest, restaurant, downloadUrl) => {
  return send({
    to: invoiceRequest.customerEmail,
    subject: `Tu factura de ${restaurant.name} ya está disponible`,
    react: InvoiceReady({
      customerName: invoiceRequest.customerName,
      restaurantName: restaurant.name,
      downloadUrl,
    }),
  })
}
