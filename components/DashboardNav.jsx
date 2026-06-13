"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const LINKS = [
  { href: "/dashboard/hoy", label: "Hoy" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/reservas", label: "Reservas" },
  { href: "/dashboard/facturas", label: "Facturas" },
  { href: "/dashboard/ajustes", label: "Ajustes" },
]

export const DashboardNav = () => {
  const pathname = usePathname()
  return (
    <nav className="flex-1 py-4 px-3 space-y-1">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href || pathname?.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
              active
                ? "bg-brand-50 text-brand-700 font-semibold"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
