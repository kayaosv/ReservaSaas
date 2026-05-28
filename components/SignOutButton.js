"use client"

import { signOut } from "next-auth/react"

export const SignOutButton = () => (
  <button
    onClick={() => signOut({ callbackUrl: "/login" })}
    className="w-full text-left px-2 py-1.5 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
  >
    Cerrar sesión
  </button>
)
