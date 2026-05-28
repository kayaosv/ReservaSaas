import NextAuth from "next-auth"
import authConfig from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  if (!session) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!session.user.restaurantId && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/onboarding", req.url))
  }

  // Restaurants whose subscription was never activated can only access ajustes
  // (to start the trial) and onboarding. Everything else redirects to ajustes.
  const status = session.user.subscriptionStatus
  const isAjustes = pathname.startsWith("/dashboard/ajustes")
  if (status === "incomplete" && pathname.startsWith("/dashboard") && !isAjustes) {
    return NextResponse.redirect(new URL("/dashboard/ajustes?activate=1", req.url))
  }

  // past_due / cancelled: read-only access to the dashboard. The hard block
  // for accepting new reservations lives in /api/reservations (so it also
  // covers the public widget). The banner in the dashboard layout warns
  // the user about their state.

  return NextResponse.next()
})

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*"],
}
