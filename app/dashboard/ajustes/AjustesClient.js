"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { TimeInput } from "@/components/ui/TimeInput"
import { Card } from "@/components/ui/Card"
import { updateRestaurantSettings, updateRestaurantConfig, addClosedDay, removeClosedDay } from "@/app/actions/ajustes"
import { refreshSubscriptionInSession } from "@/app/actions/auth"
import { CompartirTab } from "./CompartirTab"

const DAYS_ES = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
}

const STATUS_LABELS = {
  active: { label: "Activa", color: "text-green-700 bg-green-100" },
  trialing: { label: "Periodo de prueba", color: "text-blue-700 bg-blue-100" },
  past_due: { label: "Pago pendiente", color: "text-yellow-700 bg-yellow-100" },
  cancelled: { label: "Cancelada", color: "text-red-700 bg-red-100" },
  incomplete: { label: "Incompleta", color: "text-gray-700 bg-gray-100" },
}

const SUBSCRIBE_STATUSES = new Set(["incomplete", "cancelled"])
const PORTAL_STATUSES = new Set(["trialing", "active", "past_due"])

const SUBSCRIPTION_CTAS = {
  incomplete: { label: "Comenzar prueba gratuita", action: "checkout" },
  trialing: { label: "Gestionar suscripción", action: "portal" },
  active: { label: "Gestionar suscripción", action: "portal" },
  past_due: { label: "Actualizar método de pago", action: "portal" },
  cancelled: { label: "Reactivar", action: "checkout" },
}

const DEFAULT_HOURS = {
  monday: { enabled: false, open: "09:00", close: "23:00" },
  tuesday: { enabled: false, open: "09:00", close: "23:00" },
  wednesday: { enabled: false, open: "09:00", close: "23:00" },
  thursday: { enabled: false, open: "09:00", close: "23:00" },
  friday: { enabled: false, open: "09:00", close: "00:00" },
  saturday: { enabled: false, open: "09:00", close: "00:00" },
  sunday: { enabled: false, open: "10:00", close: "22:00" },
}

const parseHours = (operatingHours) => {
  const result = { ...DEFAULT_HOURS }
  if (!operatingHours) return result
  Object.entries(operatingHours).forEach(([day, val]) => {
    if (val) {
      result[day] = { enabled: true, open: val.open, close: val.close }
    } else {
      result[day] = { ...DEFAULT_HOURS[day], enabled: false }
    }
  })
  return result
}

export const AjustesClient = ({ restaurant }) => {
  const config = typeof restaurant.config === "object" ? restaurant.config : {}
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("checkout") === "success" || searchParams.get("activate") === "1" ? "suscripción" : "datos"
  const [tab, setTab] = useState(initialTab)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  // After returning from Stripe Checkout, force JWT + RSC refresh so the new
  // subscriptionStatus (set by webhook in the meantime) propagates to the proxy.
  useEffect(() => {
    if (searchParams.get("checkout") !== "success") return
    const refresh = async () => {
      await refreshSubscriptionInSession()
      router.refresh()
      showMsg("¡Suscripción activada! Tu periodo de prueba ha comenzado.")
    }
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Datos básicos
  const [datos, setDatos] = useState({
    name: restaurant.name,
    slug: restaurant.slug,
    email: restaurant.email,
    phone: restaurant.phone || "",
    address: restaurant.address || "",
  })

  // Horarios
  const [hours, setHours] = useState(parseHours(config.operatingHours))

  // Capacidad
  const [capacity, setCapacity] = useState({
    maxCapacity: config.maxCapacity ?? 40,
    maxPartySize: config.maxPartySize ?? 10,
    slotDuration: config.slotDuration ?? 30,
    reservationDuration: config.reservationDuration ?? 120,
  })

  // Días cerrados
  const [closedDays, setClosedDays] = useState(
    Array.isArray(restaurant.closedDays) ? restaurant.closedDays : []
  )
  const [newClosedDate, setNewClosedDate] = useState("")
  const [newClosedReason, setNewClosedReason] = useState("")

  const showMsg = (text, type = "success") => {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 3000)
  }

  const handleSaveDatos = async (e) => {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const result = await updateRestaurantSettings(fd)
    setSaving(false)
    if (result?.error) showMsg(result.error, "error")
    else showMsg("Guardado correctamente")
  }

  const handleSaveConfig = async () => {
    setSaving(true)
    const result = await updateRestaurantConfig({ hoursData: hours, capacityData: capacity })
    setSaving(false)
    if (result?.error) showMsg(result.error, "error")
    else showMsg("Configuración guardada")
  }

  const handleAddClosedDay = async () => {
    if (!newClosedDate) return
    const result = await addClosedDay({ date: newClosedDate, reason: newClosedReason })
    if (result?.success) {
      setClosedDays((prev) => [...prev, { date: newClosedDate, reason: newClosedReason }])
      setNewClosedDate("")
      setNewClosedReason("")
    }
  }

  const handleRemoveClosedDay = async (date) => {
    await removeClosedDay(date)
    setClosedDays((prev) => prev.filter((d) => d.date !== date))
  }

  const handleOpenPortal = async () => {
    setSaving(true)
    const res = await fetch("/api/stripe/portal", { method: "POST" })
    const data = await res.json()
    setSaving(false)
    if (data.url) window.location.href = data.url
    else showMsg("Error al abrir el portal de facturación", "error")
  }

  const handleStartCheckout = async () => {
    setSaving(true)
    const res = await fetch("/api/stripe/checkout", { method: "POST" })
    const data = await res.json()
    setSaving(false)
    if (data.url) window.location.href = data.url
    else showMsg("Error al iniciar el checkout", "error")
  }

  const cta = SUBSCRIPTION_CTAS[restaurant.subscriptionStatus] ?? SUBSCRIPTION_CTAS.incomplete
  const onCtaClick = () => (cta.action === "checkout" ? handleStartCheckout() : handleOpenPortal())

  const statusInfo = STATUS_LABELS[restaurant.subscriptionStatus] ?? STATUS_LABELS.incomplete

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Ajustes</h1>

      {msg && (
        <div className={`mb-4 px-4 py-2 rounded-md text-sm ${msg.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
          {msg.text}
        </div>
      )}

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {["datos", "horarios", "compartir", "suscripción"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors
              ${tab === t ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "datos" && (
        <form onSubmit={handleSaveDatos} className="space-y-4">
          <Card>
            <h2 className="font-semibold text-gray-900 mb-4">Información del restaurante</h2>
            <div className="space-y-4">
              <Input label="Nombre" name="name" value={datos.name} onChange={(e) => setDatos((p) => ({ ...p, name: e.target.value }))} required />
              <div>
                <Input label="Slug (URL)" name="slug" value={datos.slug} onChange={(e) => setDatos((p) => ({ ...p, slug: e.target.value }))} required />
                <p className="text-xs text-gray-400 mt-1">restobook.es/r/<strong>{datos.slug}</strong></p>
              </div>
              <Input label="Email" name="email" type="email" value={datos.email} onChange={(e) => setDatos((p) => ({ ...p, email: e.target.value }))} required />
              <Input label="Teléfono" name="phone" value={datos.phone} onChange={(e) => setDatos((p) => ({ ...p, phone: e.target.value }))} />
              <Input label="Dirección" name="address" value={datos.address} onChange={(e) => setDatos((p) => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="mt-5">
              <Button type="submit" loading={saving}>Guardar cambios</Button>
            </div>
          </Card>
        </form>
      )}

      {tab === "horarios" && (
        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold text-gray-900 mb-4">Horarios de apertura</h2>
            <div className="space-y-3">
              {Object.entries(DAYS_ES).map(([day, label]) => (
                <div key={day} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 min-w-[100px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hours[day]?.enabled ?? false}
                      onChange={(e) => setHours((p) => ({ ...p, [day]: { ...p[day], enabled: e.target.checked } }))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </label>
                  {hours[day]?.enabled ? (
                    <div className="flex items-center gap-2">
                      <TimeInput
                        value={hours[day]?.open}
                        onChange={(e) => setHours((p) => ({ ...p, [day]: { ...p[day], open: e.target.value } }))}
                      />
                      <span className="text-gray-400">—</span>
                      <TimeInput
                        value={hours[day]?.close}
                        onChange={(e) => setHours((p) => ({ ...p, [day]: { ...p[day], close: e.target.value } }))}
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Cerrado</span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-gray-900 mb-4">Capacidad y slots</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Capacidad total"
                  type="number"
                  min="1"
                  value={capacity.maxCapacity}
                  onChange={(e) => setCapacity((p) => ({ ...p, maxCapacity: e.target.value }))}
                />
                <Input
                  label="Máx. por reserva"
                  type="number"
                  min="1"
                  value={capacity.maxPartySize}
                  onChange={(e) => setCapacity((p) => ({ ...p, maxPartySize: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Duración del slot</label>
                <div className="flex gap-2">
                  {[30, 60].map((v) => (
                    <button key={v} type="button" onClick={() => setCapacity((p) => ({ ...p, slotDuration: v }))}
                      className={`flex-1 py-2 rounded-md text-sm font-medium border ${capacity.slotDuration === v ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 hover:border-gray-500"}`}>
                      {v} min
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Duración de reserva</label>
                <div className="flex gap-2 flex-wrap">
                  {[60, 90, 120, 180].map((v) => (
                    <button key={v} type="button" onClick={() => setCapacity((p) => ({ ...p, reservationDuration: v }))}
                      className={`px-4 py-2 rounded-md text-sm font-medium border ${capacity.reservationDuration === v ? "bg-gray-900 text-white border-gray-900" : "border-gray-300 hover:border-gray-500"}`}>
                      {v} min
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-gray-900 mb-4">Días cerrados</h2>
            <div className="space-y-2 mb-4">
              {closedDays.length === 0 && (
                <p className="text-sm text-gray-400">No hay días cerrados configurados</p>
              )}
              {closedDays.map((d) => (
                <div key={d.date} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{d.date}</span>
                    {d.reason && <span className="text-sm text-gray-500 ml-2">— {d.reason}</span>}
                  </div>
                  <button onClick={() => handleRemoveClosedDay(d.date)} className="text-xs text-red-500 hover:text-red-700">
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 items-end">
              <Input
                label="Fecha"
                type="date"
                value={newClosedDate}
                onChange={(e) => setNewClosedDate(e.target.value)}
              />
              <Input
                label="Motivo (opcional)"
                value={newClosedReason}
                onChange={(e) => setNewClosedReason(e.target.value)}
                placeholder="Navidad"
              />
              <Button onClick={handleAddClosedDay} variant="secondary">Añadir</Button>
            </div>
          </Card>

          <Button onClick={handleSaveConfig} loading={saving}>Guardar configuración</Button>
        </div>
      )}

      {tab === "compartir" && (
        <CompartirTab slug={restaurant.slug} />
      )}

      {tab === "suscripción" && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Suscripción</h2>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium text-gray-700">Estado:</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          {restaurant.trialEndsAt && (
            <p className="text-sm text-gray-500 mb-4">
              Periodo de prueba hasta:{" "}
              <strong>{new Date(restaurant.trialEndsAt).toLocaleDateString("es-ES")}</strong>
            </p>
          )}

          <div className="bg-gray-50 rounded-md p-4 mb-5">
            <p className="font-medium text-gray-900">Plan RestoBook</p>
            <p className="text-sm text-gray-500 mt-0.5">29€ / mes · Sin comisiones</p>
          </div>

          <Button onClick={onCtaClick} loading={saving} variant={cta.action === "checkout" ? "primary" : "secondary"}>
            {cta.label} →
          </Button>
          {cta.action === "portal" && (
            <p className="text-xs text-gray-400 mt-2">
              Podrás cancelar, cambiar de plan o actualizar tu método de pago
            </p>
          )}
          {cta.action === "checkout" && (
            <p className="text-xs text-gray-400 mt-2">
              14 días gratis · sin tarjeta hasta el final del trial · cancela cuando quieras
            </p>
          )}
        </Card>
      )}
    </div>
  )
}
