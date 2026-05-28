import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { SignOutButton } from "@/components/SignOutButton"
import { SubscriptionBanner } from "@/components/SubscriptionBanner"

export default async function DashboardLayout({ children }) {
  const session = await auth()

  if (!session?.user) redirect("/login")
  if (!session.user.restaurantId) redirect("/onboarding")

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
    select: { subscriptionStatus: true, trialEndsAt: true },
  })

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200">
          <span className="font-bold text-gray-900">RestoBook</span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          <NavLink href="/dashboard/hoy">Hoy</NavLink>
          <NavLink href="/dashboard/analytics">Analytics</NavLink>
          <NavLink href="/dashboard/reservas">Reservas</NavLink>
          <NavLink href="/dashboard/facturas">Facturas</NavLink>
          <NavLink href="/dashboard/ajustes">Ajustes</NavLink>
        </nav>

        <div className="px-3 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2 px-2 truncate">{session.user.email}</p>
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

const NavLink = ({ href, children }) => (
  <Link
    href={href}
    className="block px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
  >
    {children}
  </Link>
)
