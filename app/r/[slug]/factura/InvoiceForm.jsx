"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { submitInvoiceRequest } from "@/app/actions/invoices"

export const InvoiceForm = ({ reservationId, token, defaultName, defaultEmail }) => {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const onSubmit = (e) => {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const payload = {
      reservationId,
      token,
      name: fd.get("name"),
      email: fd.get("email"),
      cif: fd.get("cif"),
      businessName: fd.get("businessName"),
      address: fd.get("address"),
      amount: fd.get("amount"),
    }
    startTransition(async () => {
      const res = await submitInvoiceRequest(payload)
      if (res?.error) setError(res.error)
      else setDone(true)
    })
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-4 text-sm text-green-800">
        Solicitud enviada. El restaurante te enviará la factura por email en cuanto esté lista.
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">{error}</div>
      )}
      <Input id="name" name="name" label="Nombre *" defaultValue={defaultName} required />
      <Input id="email" name="email" type="email" label="Email *" defaultValue={defaultEmail} required />
      <Input id="cif" name="cif" label="NIF/CIF *" required />
      <Input id="businessName" name="businessName" label="Razón social *" required />
      <Input id="address" name="address" label="Dirección *" required />
      <Input id="amount" name="amount" label="Importe (opcional)" placeholder="Ej. 45,80 €" />

      <div className="flex justify-end mt-2">
        <Button type="submit" loading={isPending}>Enviar solicitud</Button>
      </div>
    </form>
  )
}
