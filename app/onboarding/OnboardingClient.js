"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { saveRestaurantSetup } from "@/app/actions/onboarding"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { TimeInput } from "@/components/ui/TimeInput"

const DAYS_ES = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
}

const DEFAULT_HOURS = {
  monday: { enabled: true, open: "09:00", close: "23:00" },
  tuesday: { enabled: true, open: "09:00", close: "23:00" },
  wednesday: { enabled: true, open: "09:00", close: "23:00" },
  thursday: { enabled: true, open: "09:00", close: "23:00" },
  friday: { enabled: true, open: "09:00", close: "00:00" },
  saturday: { enabled: true, open: "09:00", close: "00:00" },
  sunday: { enabled: true, open: "10:00", close: "22:00" },
}

const slugify = (text) =>
  text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50)

export const OnboardingClient = () => {
  const searchParams = useSearchParams()
  const initialStep = parseInt(searchParams.get("step") || "1", 10)

  const [step, setStep] = useState(initialStep)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [restaurantData, setRestaurantData] = useState({
    name: "",
    slug: "",
    email: "",
    phone: "",
    address: "",
  })

  const [hoursData, setHoursData] = useState(DEFAULT_HOURS)

  const [capacityData, setCapacityData] = useState({
    maxCapacity: 40,
    maxPartySize: 10,
    slotDuration: 30,
    reservationDuration: 120,
  })

  const updateRestaurant = (field, value) => {
    setRestaurantData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "name" ? { slug: slugify(value) } : {}),
    }))
  }

  const updateHours = (day, field, value) => {
    setHoursData((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
  }

  const handleSaveAndContinue = async () => {
    setError("")
    setLoading(true)

    const result = await saveRestaurantSetup({ restaurantData, hoursData, capacityData })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setStep(4)
    setLoading(false)
  }

  const handleStripeCheckout = async () => {
    setLoading(true)
    setError("")

    const res = await fetch("/api/stripe/checkout", { method: "POST" })
    const data = await res.json()

    if (data.url) {
      window.location.href = data.url
    } else {
      setError("Error al iniciar el proceso de pago. Inténtalo de nuevo.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="font-bold text-gray-900">RestoBook</span>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                    ${s === step ? "bg-gray-900 text-white" : s < step ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}
                >
                  {s < step ? "✓" : s}
                </div>
                {s < 4 && <div className={`w-8 h-0.5 ${s < step ? "bg-green-500" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {step === 1 && (
          <StepRestaurant
            data={restaurantData}
            onChange={updateRestaurant}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepHours
            data={hoursData}
            onChange={updateHours}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepCapacity
            data={capacityData}
            onChange={(field, val) => setCapacityData((p) => ({ ...p, [field]: val }))}
            onBack={() => setStep(2)}
            onSave={handleSaveAndContinue}
            loading={loading}
            error={error}
          />
        )}
        {step === 4 && (
          <StepPayment
            onCheckout={handleStripeCheckout}
            loading={loading}
            error={error}
          />
        )}
      </div>
    </div>
  )
}

const StepRestaurant = ({ data, onChange, onNext }) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!data.name || !data.slug || !data.email) return
    onNext()
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Tu restaurante</h2>
      <p className="text-sm text-gray-500 mb-6">Información básica que verán tus clientes</p>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <Input
          id="name"
          label="Nombre del restaurante"
          value={data.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="La Taberna del Puerto"
          required
        />
        <div>
          <Input
            id="slug"
            label="URL pública"
            value={data.slug}
            onChange={(e) => onChange("slug", e.target.value)}
            placeholder="la-taberna-del-puerto"
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            restobook.es/r/<strong>{data.slug || "tu-restaurante"}</strong>
          </p>
        </div>
        <Input
          id="email"
          label="Email de contacto"
          type="email"
          value={data.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="reservas@mirestaurante.com"
          required
        />
        <Input
          id="phone"
          label="Teléfono (opcional)"
          type="tel"
          value={data.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          placeholder="+34 600 000 000"
        />
        <Input
          id="address"
          label="Dirección (opcional)"
          value={data.address}
          onChange={(e) => onChange("address", e.target.value)}
          placeholder="Calle Mayor 1, Madrid"
        />

        <div className="pt-2">
          <Button type="submit" className="w-full">Continuar →</Button>
        </div>
      </form>
    </div>
  )
}

const StepHours = ({ data, onChange, onBack, onNext }) => (
  <div>
    <h2 className="text-xl font-bold text-gray-900 mb-1">Horarios de apertura</h2>
    <p className="text-sm text-gray-500 mb-6">Define cuándo estás abierto y en qué horario</p>

    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
      {Object.entries(DAYS_ES).map(([day, label]) => (
        <div key={day} className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer min-w-[100px]">
            <input
              type="checkbox"
              checked={data[day]?.enabled ?? true}
              onChange={(e) => onChange(day, "enabled", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-gray-900"
            />
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </label>

          {data[day]?.enabled ? (
            <div className="flex items-center gap-2">
              <TimeInput
                value={data[day]?.open}
                onChange={(e) => onChange(day, "open", e.target.value)}
              />
              <span className="text-gray-400 text-sm">—</span>
              <TimeInput
                value={data[day]?.close}
                onChange={(e) => onChange(day, "close", e.target.value)}
              />
            </div>
          ) : (
            <span className="text-sm text-gray-400">Cerrado</span>
          )}
        </div>
      ))}

      <div className="flex gap-3 pt-4">
        <Button variant="secondary" onClick={onBack} className="flex-1">← Atrás</Button>
        <Button onClick={onNext} className="flex-1">Continuar →</Button>
      </div>
    </div>
  </div>
)

const StepCapacity = ({ data, onChange, onBack, onSave, loading, error }) => (
  <div>
    <h2 className="text-xl font-bold text-gray-900 mb-1">Capacidad y reservas</h2>
    <p className="text-sm text-gray-500 mb-6">Configura cómo gestionas las reservas</p>

    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Input
          id="maxCapacity"
          label="Capacidad total (comensales)"
          type="number"
          min="1"
          value={data.maxCapacity}
          onChange={(e) => onChange("maxCapacity", e.target.value)}
        />
        <Input
          id="maxPartySize"
          label="Máx. por reserva"
          type="number"
          min="1"
          value={data.maxPartySize}
          onChange={(e) => onChange("maxPartySize", e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Duración del slot</label>
        <div className="flex gap-2">
          {[30, 60].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange("slotDuration", v)}
              className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors
                ${data.slotDuration === v ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"}`}
            >
              {v} min
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Duración de reserva</label>
        <div className="flex gap-2 flex-wrap">
          {[60, 90, 120, 180].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange("reservationDuration", v)}
              className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors
                ${data.reservationDuration === v ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"}`}
            >
              {v} min
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onBack} className="flex-1">← Atrás</Button>
        <Button onClick={onSave} loading={loading} className="flex-1">Guardar y continuar →</Button>
      </div>
    </div>
  </div>
)

const StepPayment = ({ onCheckout, loading, error }) => (
  <div>
    <h2 className="text-xl font-bold text-gray-900 mb-1">Activa tu cuenta</h2>
    <p className="text-sm text-gray-500 mb-6">14 días gratis, sin cobros hasta que termine el periodo de prueba</p>

    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="bg-gray-50 rounded-lg p-5 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-semibold text-gray-900">Plan RestoBook</p>
            <p className="text-sm text-gray-500 mt-0.5">Para restaurantes independientes</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">29€</p>
            <p className="text-xs text-gray-500">/ mes</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm text-gray-600">
          {[
            "Reservas online ilimitadas",
            "Widget para tu web",
            "Gestión de horarios y capacidad",
            "Sin comisiones por reserva",
            "Soporte por email",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-3 mb-5 text-sm text-blue-800">
        <strong>14 días gratis.</strong> Necesitamos una tarjeta para activar la cuenta, pero no se cobrará nada hasta que termine el periodo de prueba.
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">{error}</p>
      )}

      <Button onClick={onCheckout} loading={loading} className="w-full">
        Activar prueba gratuita →
      </Button>
      <p className="text-center text-xs text-gray-400 mt-3">
        Puedes cancelar en cualquier momento desde el panel
      </p>
    </div>
  </div>
)
