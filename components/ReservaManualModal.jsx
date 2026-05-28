"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { createReservationManual, getAvailabilityForDate } from "@/app/actions/reservations"

const todayIso = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export const ReservaManualModal = ({ open, onClose, defaultDate }) => {
  const router = useRouter()
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    date: defaultDate || todayIso(),
    time: "",
    partySize: 2,
    notes: "",
  })
  const [slots, setSlots] = useState([])
  const [maxPartySize, setMaxPartySize] = useState(10)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setForm((p) => ({ ...p, date: defaultDate || todayIso(), time: "" }))
    setError(null)
  }, [open, defaultDate])

  useEffect(() => {
    if (!open || !form.date) return
    let cancelled = false
    setLoadingSlots(true)
    getAvailabilityForDate(form.date)
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
  }, [form.date, open])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const res = await createReservationManual(form)
    setSaving(false)
    if (res.error) {
      setError(res.error)
      return
    }
    router.refresh()
    onClose()
  }

  const setField = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))
  const availableSlots = slots.filter((s) => s.available)

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Nueva reserva manual</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input label="Nombre del cliente *" value={form.customerName} onChange={setField("customerName")} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" type="email" value={form.customerEmail} onChange={setField("customerEmail")} />
            <Input label="Teléfono" value={form.customerPhone} onChange={setField("customerPhone")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Fecha *" type="date" value={form.date} onChange={setField("date")} min={todayIso()} required />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Hora *</label>
              <select
                value={form.time}
                onChange={setField("time")}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">{loadingSlots ? "Cargando…" : "Selecciona hora"}</option>
                {availableSlots.map((s) => (
                  <option key={s.time} value={s.time}>
                    {s.time} ({s.remaining} libres)
                  </option>
                ))}
              </select>
              {!loadingSlots && availableSlots.length === 0 && (
                <p className="text-xs text-amber-700 mt-1">Sin slots disponibles ese día.</p>
              )}
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
              placeholder="Alergias, preferencias…"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={saving}>Crear reserva</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
