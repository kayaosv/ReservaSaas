"use client"

import { useState } from "react"
import Link from "next/link"
import { registerUser } from "@/app/actions/auth"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"

export default function RegisterPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await registerUser(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">R</span>
            <span className="text-2xl font-bold tracking-tight text-slate-900">RestoBook</span>
          </Link>
          <p className="text-slate-500 mt-2 text-sm">Crea tu cuenta — 14 días gratis</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Crear cuenta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="name"
              name="name"
              label="Nombre completo"
              type="text"
              placeholder="María García"
              required
              autoComplete="name"
            />
            <Input
              id="email"
              name="email"
              label="Email"
              type="email"
              placeholder="maria@restaurante.com"
              required
              autoComplete="email"
            />
            <Input
              id="password"
              name="password"
              label="Contraseña"
              type="password"
              placeholder="Mínimo 8 caracteres"
              required
              autoComplete="new-password"
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Crear cuenta
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-brand-700 font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Al crear una cuenta aceptas nuestros términos de servicio
        </p>
      </div>
    </div>
  )
}
