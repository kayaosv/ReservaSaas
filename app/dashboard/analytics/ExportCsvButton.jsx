"use client"

import { useState, useTransition } from "react"
import { exportReservationsCsv } from "@/app/actions/analytics"

export const ExportCsvButton = ({ from, to }) => {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(null)

  const handleClick = () => {
    setError(null)
    startTransition(async () => {
      const res = await exportReservationsCsv({ from, to })
      if (res?.error) {
        setError(res.error)
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
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        {pending ? "Generando…" : "Exportar CSV"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
