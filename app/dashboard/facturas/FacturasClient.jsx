"use client"

import { useMemo, useState, useTransition } from "react"
import { SubirPdfModal } from "./SubirPdfModal"
import {
  resendInvoiceAction,
  getInvoiceDownloadUrl,
  exportInvoicesCsv,
} from "@/app/actions/invoices"

const fmt = (iso) =>
  new Intl.DateTimeFormat("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso))

export const FacturasClient = ({ invoices }) => {
  const [tab, setTab] = useState("pending")
  const [uploadFor, setUploadFor] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [exportPending, startExport] = useTransition()
  const [exportError, setExportError] = useState(null)

  const { pending, completed } = useMemo(() => {
    const p = []
    const c = []
    for (const i of invoices) (i.status === "completed" ? c : p).push(i)
    return { pending: p, completed: c }
  }, [invoices])

  const handleDownload = async (id) => {
    setBusyId(id)
    const res = await getInvoiceDownloadUrl(id)
    setBusyId(null)
    if (res?.error) return alert(res.error)
    window.open(res.url, "_blank", "noopener")
  }

  const handleResend = async (id) => {
    if (!confirm("¿Reenviar email con la factura al cliente?")) return
    setBusyId(id)
    const res = await resendInvoiceAction(id)
    setBusyId(null)
    if (res?.error) alert(res.error)
    else alert("Email reenviado.")
  }

  const handleExport = () => {
    setExportError(null)
    startExport(async () => {
      const res = await exportInvoicesCsv()
      if (res?.error) {
        setExportError(res.error)
        return
      }
      const blob = new Blob([res.content], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = res.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 border border-gray-200 rounded-md p-1 bg-white w-fit">
          <TabBtn active={tab === "pending"} onClick={() => setTab("pending")}>
            Pendientes <span className="ml-1 text-xs text-gray-400">({pending.length})</span>
          </TabBtn>
          <TabBtn active={tab === "completed"} onClick={() => setTab("completed")}>
            Completadas <span className="ml-1 text-xs text-gray-400">({completed.length})</span>
          </TabBtn>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={handleExport}
            disabled={exportPending || invoices.length === 0}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {exportPending ? "Generando…" : "Exportar CSV"}
          </button>
          {exportError && <p className="text-xs text-red-600">{exportError}</p>}
        </div>
      </div>

      {tab === "pending" ? (
        <Table
          rows={pending}
          emptyLabel="Sin solicitudes pendientes"
          renderActions={(inv) => (
            <button
              type="button"
              onClick={() => setUploadFor(inv)}
              className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-md hover:bg-gray-700"
            >
              Subir PDF
            </button>
          )}
        />
      ) : (
        <Table
          rows={completed}
          emptyLabel="Sin facturas completadas"
          renderActions={(inv) => (
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                disabled={busyId === inv.id}
                onClick={() => handleDownload(inv.id)}
                className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Descargar
              </button>
              <button
                type="button"
                disabled={busyId === inv.id}
                onClick={() => handleResend(inv.id)}
                className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Reenviar email
              </button>
            </div>
          )}
        />
      )}

      {uploadFor && (
        <SubirPdfModal
          invoice={uploadFor}
          onClose={() => setUploadFor(null)}
        />
      )}
    </div>
  )
}

const TabBtn = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 text-sm rounded-md ${active ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
  >
    {children}
  </button>
)

const Table = ({ rows, emptyLabel, renderActions }) => {
  if (rows.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 bg-white border border-gray-200 rounded-lg">
        <p className="text-sm">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-2 font-medium">Solicitud</th>
            <th className="text-left px-4 py-2 font-medium">Cliente</th>
            <th className="text-left px-4 py-2 font-medium">CIF</th>
            <th className="text-left px-4 py-2 font-medium">Importe</th>
            <th className="text-right px-4 py-2 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((inv) => (
            <tr key={inv.id} className="border-b border-gray-100 last:border-b-0">
              <td className="px-4 py-3 text-gray-700">{fmt(inv.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{inv.businessName}</div>
                <div className="text-xs text-gray-500">{inv.customerName} · {inv.customerEmail}</div>
              </td>
              <td className="px-4 py-3 text-gray-700">{inv.cif}</td>
              <td className="px-4 py-3 text-gray-700">{inv.amount || "—"}</td>
              <td className="px-4 py-3 text-right">{renderActions(inv)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
