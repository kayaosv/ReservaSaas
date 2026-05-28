import "server-only"
import { createClient } from "@supabase/supabase-js"

const BUCKET = "invoices"

let _client = null
const getAdmin = () => {
  if (_client) return _client
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no configurados.")
  _client = createClient(url, key, { auth: { persistSession: false } })
  return _client
}

const invoicePath = (restaurantId, invoiceId) => `${restaurantId}/${invoiceId}.pdf`

// Sube un PDF al bucket privado. file: Buffer | Blob | File | Uint8Array.
export const uploadInvoicePdf = async (restaurantId, invoiceId, file) => {
  const supa = getAdmin()
  const { error } = await supa.storage
    .from(BUCKET)
    .upload(invoicePath(restaurantId, invoiceId), file, {
      contentType: "application/pdf",
      upsert: true,
    })
  if (error) throw error
  return invoicePath(restaurantId, invoiceId)
}

// Genera URL firmada con TTL (segundos). Devuelve null si el archivo no existe.
export const getInvoiceSignedUrl = async (restaurantId, invoiceId, ttlSec = 3600) => {
  const supa = getAdmin()
  const { data, error } = await supa.storage
    .from(BUCKET)
    .createSignedUrl(invoicePath(restaurantId, invoiceId), ttlSec)
  if (error) return null
  return data?.signedUrl || null
}

// Elimina el PDF (opcional, no usado todavía).
export const deleteInvoicePdf = async (restaurantId, invoiceId) => {
  const supa = getAdmin()
  await supa.storage.from(BUCKET).remove([invoicePath(restaurantId, invoiceId)])
}
