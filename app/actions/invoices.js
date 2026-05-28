"use server"

import { after } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { verify as verifyToken } from "@/lib/cancelToken"
import { uploadInvoicePdf, getInvoiceSignedUrl } from "@/lib/supabase-admin"
import { sendInvoiceReady } from "@/lib/email"
import { generateInvoiceRequestsCsv } from "@/lib/csv"
import { todayStrInTZ } from "@/lib/datetime"

const sanitize = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "")
const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

// Public: submit an invoice request linked to a reservation, validated by HMAC token.
export const submitInvoiceRequest = async (formInput) => {
  const reservationId = sanitize(formInput.reservationId, 50)
  const token = sanitize(formInput.token, 200)
  const name = sanitize(formInput.name, 120)
  const email = sanitize(formInput.email, 200).toLowerCase()
  const cif = sanitize(formInput.cif, 30)
  const businessName = sanitize(formInput.businessName, 200)
  const address = sanitize(formInput.address, 300)
  const amount = sanitize(formInput.amount, 30) || null

  if (!reservationId || !token || !verifyToken(reservationId, token)) {
    return { error: "Enlace no válido." }
  }
  if (!name || !email || !cif || !businessName || !address) {
    return { error: "Faltan campos obligatorios." }
  }
  if (!isValidEmail(email)) return { error: "Email inválido." }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: { id: true, restaurantId: true },
  })
  if (!reservation) return { error: "Reserva no encontrada." }

  await prisma.invoiceRequest.create({
    data: {
      restaurantId: reservation.restaurantId,
      reservationId: reservation.id,
      customerName: name,
      customerEmail: email,
      cif,
      businessName,
      address,
      amount,
      status: "pending",
    },
  })

  revalidatePath("/dashboard/facturas")
  return { success: true }
}

// Auth: upload invoice PDF, mark completed, email customer with signed URL.
export const uploadInvoicePdfAction = async (invoiceId, formData) => {
  const session = await auth()
  if (!session?.user?.restaurantId) return { error: "No autorizado." }

  const invoice = await prisma.invoiceRequest.findUnique({
    where: { id: invoiceId },
    include: { restaurant: true },
  })
  if (!invoice) return { error: "Solicitud no encontrada." }
  if (invoice.restaurantId !== session.user.restaurantId) return { error: "No autorizado." }

  const file = formData.get("file")
  if (!file || typeof file === "string") return { error: "Archivo inválido." }
  if (file.type !== "application/pdf") return { error: "Solo se admite PDF." }
  if (file.size > 10 * 1024 * 1024) return { error: "Máximo 10MB." }

  const buf = Buffer.from(await file.arrayBuffer())
  try {
    await uploadInvoicePdf(invoice.restaurantId, invoice.id, buf)
  } catch (e) {
    console.error("upload failed", e)
    return { error: "No se pudo subir el archivo." }
  }

  const storagePath = `${invoice.restaurantId}/${invoice.id}.pdf`
  const updated = await prisma.invoiceRequest.update({
    where: { id: invoice.id },
    data: { pdfUrl: storagePath, status: "completed" },
  })

  after(async () => {
    const signed = await getInvoiceSignedUrl(invoice.restaurantId, invoice.id, 3600)
    if (signed) await sendInvoiceReady(updated, invoice.restaurant, signed)
  })

  revalidatePath("/dashboard/facturas")
  return { success: true }
}

// Auth: regenerate signed URL and resend the invoice email.
export const resendInvoiceAction = async (invoiceId) => {
  const session = await auth()
  if (!session?.user?.restaurantId) return { error: "No autorizado." }

  const invoice = await prisma.invoiceRequest.findUnique({
    where: { id: invoiceId },
    include: { restaurant: true },
  })
  if (!invoice) return { error: "Solicitud no encontrada." }
  if (invoice.restaurantId !== session.user.restaurantId) return { error: "No autorizado." }
  if (invoice.status !== "completed" || !invoice.pdfUrl) {
    return { error: "La factura aún no tiene PDF." }
  }

  const signed = await getInvoiceSignedUrl(invoice.restaurantId, invoice.id, 3600)
  if (!signed) return { error: "No se pudo generar el enlace." }

  const res = await sendInvoiceReady(invoice, invoice.restaurant, signed)
  if (!res.success) return { error: "No se pudo reenviar el email." }
  return { success: true }
}

// Auth: get a fresh signed URL for download in the dashboard.
export const getInvoiceDownloadUrl = async (invoiceId) => {
  const session = await auth()
  if (!session?.user?.restaurantId) return { error: "No autorizado." }

  const invoice = await prisma.invoiceRequest.findUnique({ where: { id: invoiceId } })
  if (!invoice) return { error: "Solicitud no encontrada." }
  if (invoice.restaurantId !== session.user.restaurantId) return { error: "No autorizado." }
  if (!invoice.pdfUrl) return { error: "Sin PDF." }

  const url = await getInvoiceSignedUrl(invoice.restaurantId, invoice.id, 3600)
  if (!url) return { error: "No se pudo generar el enlace." }
  return { url }
}

// Auth: export all invoice requests as CSV.
export const exportInvoicesCsv = async () => {
  const session = await auth()
  if (!session?.user?.restaurantId) return { error: "No autorizado." }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { timezone: true },
  })
  const tz = restaurant?.timezone || "Europe/Madrid"

  const invoices = await prisma.invoiceRequest.findMany({
    where: { restaurantId: session.user.restaurantId },
    orderBy: { createdAt: "desc" },
    take: 10_000,
  })

  const content = generateInvoiceRequestsCsv(invoices, tz)
  const today = todayStrInTZ(tz)
  return { filename: `facturas-${today}.csv`, content }
}
