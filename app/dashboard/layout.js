import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { SignOutButton } from "@/components/SignOutButton"
import { SubscriptionBanner } from "@/components/SubscriptionBanner"
import { DashboardNav } from "@/components/DashboardNav"

export default async function DashboardLayout({ children }) {
  const session = await auth()

  if (!session?.user) redirect("/login")
  if (!session.user.restaurantId) redirect("/onboarding")

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { subscriptionStatus: true, trialEndsAt: true },
  })

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200">
          <Link href="/dashboard/hoy" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">R</span>
            <span className="font-bold tracking-tight text-slate-900">RestoBook</span>
          </Link>
        </div>

        <DashboardNav />

        <div className="px-3 py-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 mb-2 px-2 truncate">{session.user.email}</p>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-auto flex flex-col">
        <SubscriptionBanner restaurant={restaurant} />
        <div className="flex-1">{children}</div>
      </main>
    </div>
  )
}
