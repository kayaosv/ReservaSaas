import crypto from "node:crypto"
import { prisma } from "@/lib/prisma"
import { addDaysStr, dateAtMidnightUTC, todayStrInTZ } from "@/lib/datetime"
import { sendBookingReminder, sendTrialEndingSoon, sendTrialExpired } from "@/lib/email"

export const dynamic = "force-dynamic"

const timingSafeMatch = (a, b) => {
  if (!a || !b) return false
  const aBuf = Buffer.from(String(a))
  const bBuf = Buffer.from(String(b))
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

const chunk = (arr, size) => {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export const GET = async (request) => {
  const expected = process.env.CRON_SECRET
  if (!expected) return Response.json({ error: "CRON_SECRET no configurado." }, { status: 500 })

  const provided = request.nextUrl.searchParams.get("key") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!timingSafeMatch(provided, expected)) {
    return Response.json({ error: "No autorizado." }, { status: 401 })
  }

  const restaurants = await prisma.restaurant.findMany({
    select: { id: true, name: true, slug: true, email: true, phone: true, address: true, timezone: true },
  })

  const byRestaurant = []
  let totalSent = 0
  let totalFailed = 0

  for (const restaurant of restaurants) {
    const tz = restaurant.timezone || "Europe/Madrid"
    const tomorrow = addDaysStr(todayStrInTZ(tz), 1)

    const reservations = await prisma.reservation.findMany({
      where: {
        restaurantId: restaurant.id,
        date: dateAtMidnightUTC(tomorrow),
        status: "confirmed",
        reminderSentAt: null,
      },
    })

    if (reservations.length === 0) {
      byRestaurant.push({ id: restaurant.id, name: restaurant.name, sent: 0, failed: 0 })
      continue
    }

    let sent = 0
    let failed = 0

    // Resend free tier: 10 req/s. Chunks of 10 with 1.1s gap.
    const chunks = chunk(reservations, 10)
    for (let i = 0; i < chunks.length; i++) {
      const batch = chunks[i]
      const results = await Promise.allSettled(
        batch.map((r) => sendBookingReminder(r, restaurant)),
      )
      for (let j = 0; j < results.length; j++) {
        const r = batch[j]
        const ok = results[j].status === "fulfilled" && results[j].value?.success
        if (ok) {
          sent++
          await prisma.reservation.update({
            where: { id: r.id },
            data: { reminderSentAt: new Date() },
          }).catch(() => {})
        } else {
          failed++
        }
      }
      if (i < chunks.length - 1) await sleep(1100)
    }

    totalSent += sent
    totalFailed += failed
    byRestaurant.push({ id: restaurant.id, name: restaurant.name, sent, failed, date: tomorrow })
  }

  // Trial lifecycle emails. Idempotent via trialReminderSentAt / trialExpiredSentAt.
  const trial = { remindersSent: 0, expiredSent: 0 }
  const now = new Date()
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const in4Days = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000)

  const endingSoon = await prisma.restaurant.findMany({
    where: {
      subscriptionStatus: "trialing",
      trialEndsAt: { gte: in3Days, lt: in4Days },
      trialReminderSentAt: null,
    },
  })
  for (const r of endingSoon) {
    const res = await sendTrialEndingSoon(r, 3)
    if (res?.success) {
      trial.remindersSent++
      await prisma.restaurant.update({
        where: { id: r.id },
        data: { trialReminderSentAt: new Date() },
      }).catch(() => {})
    }
  }

  // Trial expired: trialEndsAt in the past AND status downgraded to incomplete/past_due/cancelled.
  const expired = await prisma.restaurant.findMany({
    where: {
      trialEndsAt: { lt: now },
      subscriptionStatus: { in: ["incomplete", "past_due", "cancelled"] },
      trialExpiredSentAt: null,
    },
  })
  for (const r of expired) {
    const res = await sendTrialExpired(r)
    if (res?.success) {
      trial.expiredSent++
      await prisma.restaurant.update({
        where: { id: r.id },
        data: { trialExpiredSentAt: new Date() },
      }).catch(() => {})
    }
  }

  return Response.json({ sent: totalSent, failed: totalFailed, byRestaurant, trial })
}
