"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

const todayStr = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const maxDateStr = (daysAhead = 60) => {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export const BookingFlow = ({ slug, maxPartySize = 10 }) => {
  const [step, setStep] = useState(1)
  const [date, setDate] = useState(todayStr())
  const [time, setTime] = useState(null)
  const [slots, setSlots] = useState(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState(null)

  const [partySize, setPartySize] = useState(2)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [website, setWebsite] = useState("") // honeypot

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [confirmation, setConfirmation] = useState(null)

  useEffect(() => {
    if (step !== 2) return
    let aborted = false
    setSlotsLoading(true)
    setSlotsError(null)
    setSlots(null)
    fetch(`/api/reservations/availability?slug=${encodeURIComponent(slug)}&date=${encodeURIComponent(date)}`)
      .then((r) => r.json())
      .then((data) => {
        if (aborted) return
        if (data?.error) setSlotsError(data.error)
        else setSlots(data.slots || [])
      })
      .catch(() => !aborted && setSlotsError("Error de conexión."))
      .finally(() => !aborted && setSlotsLoading(false))
    return () => {
      aborted = true
    }
  }, [step, slug, date])

  const handleSubmit = async () => {
    setSubmitError(null)
    setSubmitting(true)
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          date,
          time,
          partySize,
          customerName: name.trim(),
          customerEmail: email.trim(),
          customerPhone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
          website,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data?.error || "No se pudo completar la reserva.")
      } else {
        setConfirmation(data)
        setStep(4)
      }
    } catch {
      setSubmitError("Error de conexión.")
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 4 && confirmation) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-4xl mb-3">✅</p>
        <h2 className="text-lg font-bold text-gray-900 mb-2">¡Reserva confirmada!</h2>
        <p className="text-sm text-gray-600 mb-4">
          Te esperamos el <strong>{date}</strong> a las <strong>{confirmation.time}</strong> para{" "}
          <strong>{confirmation.partySize}</strong> {confirmation.partySize === 1 ? "persona" : "personas"}.
        </p>
        <p className="text-xs text-gray-400">Código de reserva: {confirmation.id}</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <Stepper step={step} />

      {step === 1 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Elige fecha</h2>
          <Input
            type="date"
            value={date}
            min={todayStr()}
            max={maxDateStr(60)}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!date}>Continuar →</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-1">Elige hora</h2>
          <p className="text-sm text-gray-500 mb-4">{date}</p>

          {slotsLoading && <p className="text-sm text-gray-500">Cargando horarios…</p>}
          {slotsError && <p className="text-sm text-red-600">{slotsError}</p>}
          {!slotsLoading && !slotsError && slots && slots.length === 0 && (
            <p className="text-sm text-gray-500">No hay horarios disponibles esa fecha.</p>
          )}
          {!slotsLoading && !slotsError && slots && slots.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((s) => (
                <button
                  key={s.time}
                  type="button"
                  disabled={!s.available}
                  onClick={() => {
                    setTime(s.time)
                    setStep(3)
                  }}
                  className={`py-2 rounded-md text-sm font-medium border transition-colors
                    ${
                      s.available
                        ? "border-gray-300 hover:border-gray-900 hover:bg-gray-900 hover:text-white"
                        : "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                    }`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}>← Atrás</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
        >
          <h2 className="font-semibold text-gray-900 mb-1">Tus datos</h2>
          <p className="text-sm text-gray-500 mb-4">
            {date} · {time} · {partySize} {partySize === 1 ? "persona" : "personas"}
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Número de comensales</label>
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: maxPartySize }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPartySize(n)}
                    className={`w-10 h-10 rounded-md text-sm font-medium border ${
                      partySize === n
                        ? "bg-gray-900 text-white border-gray-900"
                        : "border-gray-300 hover:border-gray-500"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Teléfono (opcional)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Notas (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Alergias, ocasión especial…"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
            </div>

            {/* Honeypot: hidden from users, bots fill it */}
            <div style={{ position: "absolute", left: "-10000px", height: 0, width: 0, overflow: "hidden" }} aria-hidden="true">
              <label>
                Website
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>
            </div>

            {submitError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {submitError}
              </p>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="secondary" type="button" onClick={() => setStep(2)}>← Atrás</Button>
              <Button type="submit" loading={submitting}>Confirmar reserva</Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

const Stepper = ({ step }) => (
  <div className="flex items-center gap-2 mb-6">
    {[1, 2, 3].map((s) => (
      <div key={s} className="flex items-center gap-2">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
            ${s === step ? "bg-gray-900 text-white" : s < step ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}
        >
          {s < step ? "✓" : s}
        </div>
        {s < 3 && <div className={`w-8 h-0.5 ${s < step ? "bg-green-500" : "bg-gray-200"}`} />}
      </div>
    ))}
  </div>
)
