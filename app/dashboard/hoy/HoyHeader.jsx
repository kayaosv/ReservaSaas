"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { ReservaManualModal } from "@/components/ReservaManualModal"

export const HoyHeader = ({ dateLabel, activeCount, defaultDate }) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 capitalize">{dateLabel}</h1>
          <p className="text-sm text-gray-500">
            {activeCount} {activeCount === 1 ? "reserva" : "reservas"} hoy
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Reserva manual</Button>
      </div>
      <ReservaManualModal open={open} onClose={() => setOpen(false)} defaultDate={defaultDate} />
    </>
  )
}
