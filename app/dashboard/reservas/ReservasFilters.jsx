"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/Button"

const STATUSES = [
  { value: "", label: "Todos" },
  { value: "confirmed", label: "Confirmadas" },
  { value: "completed", label: "Completadas" },
  { value: "cancelled", label: "Canceladas" },
  { value: "no_show", label: "No show" },
]

export const ReservasFilters = ({ from, to, status }) => {
  const router = useRouter()
  const [f, setF] = useState({ from, to, status })

  const apply = () => {
    const params = new URLSearchParams()
    if (f.from) params.set("from", f.from)
    if (f.to) params.set("to", f.to)
    if (f.status) params.set("status", f.status)
    router.push(`/dashboard/reservas?${params.toString()}`)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Desde</label>
        <input
          type="date"
          value={f.from}
          onChange={(e) => setF((p) => ({ ...p, from: e.target.value }))}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Hasta</label>
        <input
          type="date"
          value={f.to}
          onChange={(e) => setF((p) => ({ ...p, to: e.target.value }))}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">Estado</label>
        <select
          value={f.status}
          onChange={(e) => setF((p) => ({ ...p, status: e.target.value }))}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      <Button onClick={apply}>Filtrar</Button>
    </div>
  )
}
