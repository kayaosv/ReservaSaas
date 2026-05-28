"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/Button"
import { cancelByToken } from "@/app/actions/publicCancel"

export const CancelConfirm = ({ id, token }) => {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handle = () => {
    setError(null)
    startTransition(async () => {
      const res = await cancelByToken(id, token)
      if (res?.error) setError(res.error)
      else setResult(res)
    })
  }

  if (result?.success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-4 text-sm text-green-800">
        {result.alreadyCancelled
          ? "Esta reserva ya estaba cancelada."
          : "Tu reserva ha sido cancelada. Gracias por avisar."}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">{error}</div>
      )}
      <div className="flex gap-3">
        <Button variant="danger" onClick={handle} loading={isPending}>
          Confirmar cancelación
        </Button>
        <Button variant="secondary" onClick={() => history.back()} disabled={isPending}>
          Volver
        </Button>
      </div>
    </div>
  )
}
