import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import authConfig from "@/lib/auth.config"

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { restaurant: { select: { id: true, subscriptionStatus: true } } },
        })

        if (!user) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          restaurantId: user.restaurantId,
          subscriptionStatus: user.restaurant?.subscriptionStatus ?? null,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.restaurantId = user.restaurantId
        token.subscriptionStatus = user.subscriptionStatus
      }
      // On explicit session update, re-fetch from DB so the JWT cookie
      // picks up changes made server-side (onboarding completion, plan changes, etc).
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id },
          include: { restaurant: { select: { subscriptionStatus: true } } },
        })
        if (fresh) {
          token.role = fresh.role
          token.restaurantId = fresh.restaurantId
          token.subscriptionStatus = fresh.restaurant?.subscriptionStatus ?? null
        }
        if (session?.user) {
          if (session.user.restaurantId !== undefined) token.restaurantId = session.user.restaurantId
          if (session.user.subscriptionStatus !== undefined) token.subscriptionStatus = session.user.subscriptionStatus
        }
      }
      return token
    },
  },
})
