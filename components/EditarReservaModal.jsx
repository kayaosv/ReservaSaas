"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { updateReservation, getAvailabilityForDate } from "@/app/actions/reservations"

const dateOnly = (d) => {
  if (typeof d === "string") return d.slice(0, 10)
  return new Date(d).toISOString().slice(0, 10)
}

export const EditarReservaModal = ({ open, onClose, reservation }) => {
  const router = useRouter()
  const initialDate = dateOnly(reservation.date)
  const [form, setForm] = useState({
    date: initialDate,
    time: reservation.time,
    partySize: reservation.partySize,
    notes: reservation.notes || "",
  })
  const [slots, setSlots] = useState([])
  const [maxPartySize, setMaxPartySize] = useState(10)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setForm({
      date: initialDate,
      time: reservation.time,
      partySize: reservation.partySize,
      notes: reservation.notes || "",
    })
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reservation.id])

  useEffect(() => {
    if (!open || !form.date) return
    let cancelled = false
    setLoadingSlots(true)
    getAvailabilityForDate(form.date, reservation.id)
      .then((res) => {
        if (cancelled) return
        if (res.error) {
          setError(res.error)
          setSlots([])
        } else {
          setSlots(res.slots || [])
          setMaxPartySize(res.maxPartySize || 10)
        }
      })
      .finally(() => !cancelled && setLoadingSlots(false))
    return () => { cancelled = true }
  }, [form.date, open, reservation.id])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const res = await updateReservation(reservation.id, form)
    setSaving(false)
    if (res.error) {
      setError(res.error)
      return
    }
    router.refresh()
    onClose()
  }

  const setField = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))
  // Show the current slot even when "full" (otherwise the user can't keep its own time).
  const visibleSlots = slots.filter((s) => s.available || s.time === reservation.time)

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Editar reserva — {reservation.customerName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-gray-500">
            Para cambiar nombre, email o teléfono cancela y vuelve a crear la reserva.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Fecha *" type="date" value={form.date} onChange={setField("date")} required />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Hora *</label>
              <select
                value={form.time}
                onChange={setField("time")}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">{loadingSlots ? "Cargando…" : "Selecciona hora"}</option>
                {visibleSlots.map((s) => (
                  <option key={s.time} value={s.time}>
                    {s.time} ({s.remaining} libres)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Comensales *</label>
            <select
              value={form.partySize}
              onChange={(e) => setForm((p) => ({ ...p, partySize: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {Array.from({ length: maxPartySize }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={setField("notes")}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar cambios</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
