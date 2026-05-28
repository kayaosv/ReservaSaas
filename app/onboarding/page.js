import { Suspense } from "react"
import { OnboardingClient } from "./OnboardingClient"

export const dynamic = "force-dynamic"

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">Cargando...</div>}>
      <OnboardingClient />
    </Suspense>
  )
}
