"use client"

import { useState, useTransition } from "react"
import { updateReservationStatus } from "@/app/actions/reservations"
import { EditarReservaModal } from "@/components/EditarReservaModal"

const STATUS_STYLES = {
  confirmed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-gray-200 text-gray-700",
}

const STATUS_LABELS = {
  confirmed: "Confirmada",
  pending: "Pendiente",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No show",
}

const SOURCE_LABELS = {
  widget: "Widget",
  google: "Google",
  manual: "Manual",
}

const ACTIONS = [
  { value: "confirmed", label: "Confirmar" },
  { value: "completed", label: "Completar" },
  { value: "no_show", label: "No show" },
  { value: "cancelled", label: "Cancelar" },
]

const formatDate = (d) =>
  new Date(d).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })

const isReservationPast = (reservation) => {
  // Compare against now in restaurant tz would be ideal, but for the row's
  // UI affordance the user's local clock is good enough — the server action
  // re-validates against the actual tz before persisting.
  const [h, m] = String(reservation.time).split(":").map(Number)
  const dateStr = typeof reservation.date === "string"
    ? reservation.date.slice(0, 10)
    : new Date(reservation.date).toISOString().slice(0, 10)
  const dt = new Date(`${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`)
  return dt.getTime() < Date.now()
}

export const ReservationRow = ({ reservation, showDate = false }) => {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const canEdit = reservation.status === "confirmed" && !isReservationPast(reservation)

  const handleAction = (status) => {
    setError(null)
    setOpen(false)
    startTransition(async () => {
      const res = await updateReservationStatus(reservation.id, status)
      if (res?.error) setError(res.error)
    })
  }

  const sourceLabel = SOURCE_LABELS[reservation.source] || reservation.source

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-gray-900 truncate">{reservation.customerName}</p>
            <span className="text-xs text-gray-400">· {sourceLabel}</span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {showDate && <>{formatDate(reservation.date)} · </>}
            {reservation.time} · {reservation.partySize} personas
          </p>
          {(reservation.customerEmail || reservation.customerPhone) && (
            <p className="text-xs text-gray-400 mt-1 truncate">
              {reservation.customerEmail}
              {reservation.customerPhone && <> · {reservation.customerPhone}</>}
            </p>
          )}
          {reservation.notes && (
            <p className="text-xs text-gray-600 mt-1 italic">"{reservation.notes}"</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              STATUS_STYLES[reservation.status] || "bg-gray-100 text-gray-600"
            }`}
          >
            {STATUS_LABELS[reservation.status] || reservation.status}
          </span>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              disabled={pending}
              className="text-xs text-gray-500 hover:text-gray-900 px-2 py-1 rounded-md border border-gray-200 hover:border-gray-300 disabled:opacity-50"
            >
              {pending ? "Actualizando…" : "Acciones ▾"}
            </button>
            {open && (
              <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded-md shadow-md py-1 min-w-[140px]">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => { setOpen(false); setEditOpen(true) }}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Editar
                  </button>
                )}
                {ACTIONS.filter((a) => a.value !== reservation.status).map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => handleAction(a.value)}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {canEdit && (
        <EditarReservaModal open={editOpen} onClose={() => setEditOpen(false)} reservation={reservation} />
      )}
    </div>
  )
}
