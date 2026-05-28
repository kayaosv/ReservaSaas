"use client"

import { useRef, useState, useTransition } from "react"
import { uploadInvoicePdfAction } from "@/app/actions/invoices"

export const SubirPdfModal = ({ invoice, onClose }) => {
  const fileRef = useRef(null)
  const [error, setError] = useState(null)
  const [pending, startTransition] = useTransition()

  const onSubmit = (e) => {
    e.preventDefault()
    setError(null)
    const file = fileRef.current?.files?.[0]
    if (!file) return setError("Selecciona un archivo PDF.")
    if (file.type !== "application/pdf") return setError("Solo se admite PDF.")
    if (file.size > 10 * 1024 * 1024) return setError("Máximo 10MB.")

    const fd = new FormData()
    fd.append("file", file)
    startTransition(async () => {
      const res = await uploadInvoicePdfAction(invoice.id, fd)
      if (res?.error) setError(res.error)
      else onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg border border-gray-200 max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Subir factura</h3>
        <p className="text-sm text-gray-500 mb-4">{invoice.businessName} · {invoice.cif}</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-2 text-xs text-red-700">{error}</div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="text-sm text-gray-700 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-gray-900 file:text-white file:text-xs file:cursor-pointer"
          />
          <p className="text-xs text-gray-500">Máximo 10MB. El cliente recibirá un email con enlace seguro de descarga (1h).</p>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-3 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              {pending ? "Subiendo…" : "Subir y notificar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
