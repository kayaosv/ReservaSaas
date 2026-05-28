const STATUS_LABELS = {
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No show",
  pending: "Pendiente",
}

const SOURCE_LABELS = {
  widget: "Widget",
  manual: "Manual",
  google: "Google",
}

const escapeCell = (value) => {
  if (value == null) return ""
  const s = String(value)
  if (/[;"\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

const formatDateForCsv = (date, tz) => {
  const d = new Date(date)
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: tz,
  }).format(d)
}

const formatDateTimeForCsv = (date, tz) => {
  const d = new Date(date)
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz,
  }).format(d)
}

const HEADERS = ["Fecha", "Hora", "Comensales", "Nombre", "Email", "Teléfono", "Origen", "Estado", "Notas", "Creada"]

export const generateReservationsCsv = (reservations, tz = "Europe/Madrid") => {
  const lines = [HEADERS.join(";")]
  for (const r of reservations) {
    lines.push([
      formatDateForCsv(r.date, tz),
      r.time,
      r.partySize,
      r.customerName,
      r.customerEmail,
      r.customerPhone || "",
      SOURCE_LABELS[r.source] || r.source,
      STATUS_LABELS[r.status] || r.status,
      r.notes || "",
      formatDateTimeForCsv(r.createdAt, tz),
    ].map(escapeCell).join(";"))
  }
  // BOM para Excel español + CRLF
  return "﻿" + lines.join("\r\n")
}

const INVOICE_HEADERS = ["Fecha solicitud", "Cliente", "Email", "CIF", "Razón social", "Dirección", "Importe", "Estado", "PDF"]

const INVOICE_STATUS_LABELS = { pending: "Pendiente", completed: "Completada" }

export const generateInvoiceRequestsCsv = (invoices, tz = "Europe/Madrid") => {
  const lines = [INVOICE_HEADERS.join(";")]
  for (const inv of invoices) {
    lines.push([
      formatDateTimeForCsv(inv.createdAt, tz),
      inv.customerName,
      inv.customerEmail,
      inv.cif,
      inv.businessName,
      inv.address,
      inv.amount || "",
      INVOICE_STATUS_LABELS[inv.status] || inv.status,
      inv.pdfUrl ? "Sí" : "No",
    ].map(escapeCell).join(";"))
  }
  return "﻿" + lines.join("\r\n")
}
