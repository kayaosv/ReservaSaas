"use server"

import { prisma } from "@/lib/prisma"
import { signIn, unstable_update } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { AuthError } from "next-auth"

// Re-reads JWT from DB. Used after webhooks change subscriptionStatus
// (e.g. after Stripe checkout) so the proxy sees the fresh status.
export const refreshSubscriptionInSession = async () => {
  try {
    await unstable_update({})
    return { success: true }
  } catch (e) {
    console.error("refresh session failed", e)
    return { error: "No se pudo refrescar la sesión." }
  }
}

export const registerUser = async (formData) => {
  const name = formData.get("name")?.toString().trim()
  const email = formData.get("email")?.toString().trim().toLowerCase()
  const password = formData.get("password")?.toString()

  if (!name || !email || !password) {
    return { error: "Todos los campos son obligatorios." }
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "Ya existe una cuenta con ese email." }
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "owner",
    },
  })

  try {
    await signIn("credentials", { email, password, redirect: false })
  } catch {
    // ignore redirect error
  }

  redirect("/onboarding")
}

export const loginUser = async (formData) => {
  const email = formData.get("email")?.toString().trim().toLowerCase()
  const password = formData.get("password")?.toString()

  if (!email || !password) {
    return { error: "Email y contraseña son obligatorios." }
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email o contraseña incorrectos." }
    }
    throw error
  }
}
