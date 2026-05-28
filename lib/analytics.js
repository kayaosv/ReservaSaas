import { prisma } from "@/lib/prisma"
import {
  weekdayInTZ,
  dateAtMidnightUTC,
  generateSlotTimes,
  todayStrInTZ,
  addDaysStr,
  eachDayStr,
  isPastInTZ,
  composeInstantInTZ,
} from "@/lib/datetime"

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
const WEEKDAY_INDEX = Object.fromEntries(WEEKDAYS.map((w, i) => [w, i]))

const DEFAULT_CONFIG = {
  slotDuration: 30,
  reservationDuration: 120,
  maxCapacity: 40,
  maxPartySize: 10,
}

const readConfig = (restaurant) => {
  const cfg = typeof restaurant?.config === "object" && restaurant.config !== null ? restaurant.config : {}
  return {
    slotDuration: Number(cfg.slotDuration) || DEFAULT_CONFIG.slotDuration,
    reservationDuration: Number(cfg.reservationDuration) || DEFAULT_CONFIG.reservationDuration,
    maxCapacity: Number(cfg.maxCapacity) || DEFAULT_CONFIG.maxCapacity,
    maxPartySize: Number(cfg.maxPartySize) || DEFAULT_CONFIG.maxPartySize,
    operatingHours: cfg.operatingHours || {},
  }
}

const isClosedDay = (restaurant, dateStr) => {
  const closed = Array.isArray(restaurant.closedDays) ? restaurant.closedDays : []
  return closed.some((d) => d?.date === dateStr)
}

const slotsPerReservation = (slotDuration, reservationDuration) =>
  Math.max(1, Math.ceil(reservationDuration / slotDuration))

const dateKey = (d) => new Date(d).toISOString().slice(0, 10)

// Builds occupancy aggregates for a list of reservations grouped by date.
// Returns { occupancyByDay: Map<dateStr, { sumPct, slotCount }>, slotUsageByWeekday: Map<weekday, Map<slot, { used, samples }>> }
const aggregateOccupancy = (reservations, restaurant, dateStrs, cfg) => {
  const { slotDuration, reservationDuration, maxCapacity, operatingHours } = cfg
  const span = slotsPerReservation(slotDuration, reservationDuration)

  const byDay = new Map()
  for (const r of reservations) {
    if (r.status === "cancelled") continue
    const k = dateKey(r.date)
    if (!byDay.has(k)) byDay.set(k, [])
    byDay.get(k).push(r)
  }

  const occupancyByDay = new Map()
  // weekdayIdx -> slot -> { totalPctSum, samples, usedSeatsSum, capacitySum }
  const slotUsageByWeekday = new Map()
  for (let i = 0; i < 7; i++) slotUsageByWeekday.set(i, new Map())

  for (const dateStr of dateStrs) {
    if (isClosedDay(restaurant, dateStr)) continue
    const weekday = weekdayInTZ(dateStr, restaurant.timezone || "Europe/Madrid")
    const hours = operatingHours?.[weekday]
    if (!hours?.open || !hours?.close) continue

    const slotTimes = generateSlotTimes(hours.open, hours.close, slotDuration)
    if (slotTimes.length === 0) continue

    const indexOf = new Map(slotTimes.map((t, i) => [t, i]))
    const usage = new Array(slotTimes.length).fill(0)
    const dayReservations = byDay.get(dateStr) || []
    for (const r of dayReservations) {
      const start = indexOf.get(r.time)
      if (start === undefined) continue
      for (let k = 0; k < span; k++) {
        const idx = start + k
        if (idx >= slotTimes.length) break
        usage[idx] += r.partySize
      }
    }

    let pctSum = 0
    const wIdx = WEEKDAY_INDEX[weekday]
    const wMap = slotUsageByWeekday.get(wIdx)
    for (let i = 0; i < slotTimes.length; i++) {
      const slot = slotTimes[i]
      const pct = Math.min(1, usage[i] / maxCapacity)
      pctSum += pct
      const cur = wMap.get(slot) || { sumPct: 0, samples: 0 }
      cur.sumPct += pct
      cur.samples += 1
      wMap.set(slot, cur)
    }
    occupancyByDay.set(dateStr, { avgPct: pctSum / slotTimes.length, slotCount: slotTimes.length })
  }

  return { occupancyByDay, slotUsageByWeekday }
}

const periodSummary = (reservations, occupancyByDay, restaurant) => {
  const tz = restaurant.timezone || "Europe/Madrid"
  let total = 0
  let cancellations = 0
  let noShows = 0
  let completed = 0
  let confirmedPast = 0

  for (const r of reservations) {
    total += 1
    if (r.status === "cancelled") cancellations += 1
    else if (r.status === "no_show") noShows += 1
    else if (r.status === "completed") completed += 1
    else if (r.status === "confirmed") {
      const ds = dateKey(r.date)
      if (isPastInTZ(ds, r.time, tz)) confirmedPast += 1
    }
  }

  let pctSum = 0
  let pctCount = 0
  for (const { avgPct } of occupancyByDay.values()) {
    pctSum += avgPct
    pctCount += 1
  }
  const occupancyPct = pctCount > 0 ? pctSum / pctCount : 0
  const noShowDenom = noShows + completed + confirmedPast
  const noShowRate = noShowDenom > 0 ? noShows / noShowDenom : 0

  return { reservations: total, occupancyPct, noShowRate, cancellations }
}

const computeChannels = (reservations) => {
  const map = new Map()
  for (const r of reservations) {
    if (r.status === "cancelled") continue
    map.set(r.source, (map.get(r.source) || 0) + 1)
  }
  return Array.from(map.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
}

const computeNoShowsByHour = (reservations) => {
  const map = new Map()
  for (const r of reservations) {
    if (r.status !== "no_show") continue
    const hour = (r.time || "").slice(0, 2)
    if (!hour) continue
    map.set(hour, (map.get(hour) || 0) + 1)
  }
  return Array.from(map.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
}

const computeRecurring = (reservations) => {
  const map = new Map()
  for (const r of reservations) {
    if (r.status === "cancelled") continue
    const email = (r.customerEmail || "").trim().toLowerCase()
    if (!email) continue
    map.set(email, (map.get(email) || 0) + 1)
  }
  let count = 0
  for (const n of map.values()) if (n >= 3) count += 1
  return count
}

const computeTopHour = (slotUsageByWeekday) => {
  const slotAgg = new Map()
  for (const wMap of slotUsageByWeekday.values()) {
    for (const [slot, v] of wMap.entries()) {
      const cur = slotAgg.get(slot) || { sumPct: 0, samples: 0 }
      cur.sumPct += v.sumPct
      cur.samples += v.samples
      slotAgg.set(slot, cur)
    }
  }
  let best = null
  for (const [slot, v] of slotAgg.entries()) {
    if (v.samples < 3) continue
    const pct = v.sumPct / v.samples
    if (!best || pct > best.pct) best = { slot, pct }
  }
  return best?.slot || null
}

const computeAvgLeadHours = (reservations, tz) => {
  const leads = []
  for (const r of reservations) {
    if (r.status === "cancelled") continue
    const instant = composeInstantInTZ(dateKey(r.date), r.time, tz)
    if (!instant) continue
    const diffMs = instant.getTime() - new Date(r.createdAt).getTime()
    if (diffMs <= 0) continue
    leads.push(diffMs / (1000 * 60 * 60))
  }
  if (leads.length === 0) return null
  leads.sort((a, b) => a - b)
  const mid = Math.floor(leads.length / 2)
  return leads.length % 2 === 0 ? (leads[mid - 1] + leads[mid]) / 2 : leads[mid]
}

const computeForecast = (futureReservations, restaurant, fromStr, cfg) => {
  const { slotDuration, reservationDuration, maxCapacity, operatingHours } = cfg
  const span = slotsPerReservation(slotDuration, reservationDuration)
  const tz = restaurant.timezone || "Europe/Madrid"

  const byDay = new Map()
  for (const r of futureReservations) {
    if (r.status === "cancelled") continue
    const k = dateKey(r.date)
    if (!byDay.has(k)) byDay.set(k, [])
    byDay.get(k).push(r)
  }

  const out = []
  for (let i = 0; i < 7; i++) {
    const dateStr = addDaysStr(fromStr, i)
    const weekday = weekdayInTZ(dateStr, tz)
    const closed = isClosedDay(restaurant, dateStr)
    const hours = operatingHours?.[weekday]
    if (closed || !hours?.open || !hours?.close) {
      out.push({ date: dateStr, weekday, isOpen: false, used: 0, capacity: 0, pct: 0 })
      continue
    }
    const slotTimes = generateSlotTimes(hours.open, hours.close, slotDuration)
    const indexOf = new Map(slotTimes.map((t, i) => [t, i]))
    const usage = new Array(slotTimes.length).fill(0)
    for (const r of byDay.get(dateStr) || []) {
      const start = indexOf.get(r.time)
      if (start === undefined) continue
      for (let k = 0; k < span; k++) {
        const idx = start + k
        if (idx >= slotTimes.length) break
        usage[idx] += r.partySize
      }
    }
    const totalUsed = usage.reduce((a, b) => a + b, 0)
    const totalCapacity = slotTimes.length * maxCapacity
    out.push({
      date: dateStr,
      weekday,
      isOpen: true,
      used: totalUsed,
      capacity: totalCapacity,
      pct: totalCapacity > 0 ? Math.min(1, totalUsed / totalCapacity) : 0,
    })
  }
  return out
}

const buildEvolution = (currentReservations, prevReservations, fromStr, toStr, prevFromStr) => {
  const days = eachDayStr(fromStr, toStr)
  const curMap = new Map()
  const prevMap = new Map()
  for (const r of currentReservations) {
    if (r.status === "cancelled") continue
    const k = dateKey(r.date)
    curMap.set(k, (curMap.get(k) || 0) + 1)
  }
  for (const r of prevReservations) {
    if (r.status === "cancelled") continue
    const k = dateKey(r.date)
    prevMap.set(k, (prevMap.get(k) || 0) + 1)
  }
  return days.map((d, i) => {
    const prevDay = prevFromStr ? addDaysStr(prevFromStr, i) : null
    return {
      date: d,
      current: curMap.get(d) || 0,
      previous: prevDay ? (prevMap.get(prevDay) || 0) : null,
    }
  })
}

const buildHeatmap = (slotUsageByWeekday) => {
  const out = []
  for (let w = 0; w < 7; w++) {
    const wMap = slotUsageByWeekday.get(w)
    for (const [slot, v] of wMap.entries()) {
      out.push({
        weekday: w,
        slot,
        pct: v.samples > 0 ? v.sumPct / v.samples : 0,
        samples: v.samples,
      })
    }
  }
  return out
}

export const computeAnalytics = async (restaurant, fromStr, toStr) => {
  const tz = restaurant.timezone || "Europe/Madrid"
  const cfg = readConfig(restaurant)
  const days = eachDayStr(fromStr, toStr)
  const lengthDays = days.length

  const prevToStr = addDaysStr(fromStr, -1)
  const prevFromStr = addDaysStr(prevToStr, -(lengthDays - 1))
  const restaurantStartStr = dateKey(restaurant.createdAt)
  const hasPrev = prevFromStr >= restaurantStartStr

  const today = todayStrInTZ(tz)
  const forecastEndStr = addDaysStr(today, 6)

  const [currentReservations, prevReservations, futureReservations] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        restaurantId: restaurant.id,
        date: { gte: dateAtMidnightUTC(fromStr), lte: dateAtMidnightUTC(toStr) },
      },
      select: {
        date: true, time: true, partySize: true, source: true, status: true,
        customerEmail: true, createdAt: true,
      },
    }),
    hasPrev
      ? prisma.reservation.findMany({
          where: {
            restaurantId: restaurant.id,
            date: { gte: dateAtMidnightUTC(prevFromStr), lte: dateAtMidnightUTC(prevToStr) },
          },
          select: {
            date: true, time: true, partySize: true, status: true, customerEmail: true, createdAt: true,
          },
        })
      : Promise.resolve(null),
    prisma.reservation.findMany({
      where: {
        restaurantId: restaurant.id,
        date: { gte: dateAtMidnightUTC(today), lte: dateAtMidnightUTC(forecastEndStr) },
        status: { not: "cancelled" },
      },
      select: { date: true, time: true, partySize: true, status: true },
    }),
  ])

  const { occupancyByDay, slotUsageByWeekday } = aggregateOccupancy(
    currentReservations, restaurant, days, cfg,
  )
  const totals = periodSummary(currentReservations, occupancyByDay, restaurant)

  let prev = null
  if (prevReservations) {
    const prevDays = eachDayStr(prevFromStr, prevToStr)
    const prevAgg = aggregateOccupancy(prevReservations, restaurant, prevDays, cfg)
    prev = periodSummary(prevReservations, prevAgg.occupancyByDay, restaurant)
  }

  const evolution = buildEvolution(
    currentReservations, prevReservations || [], fromStr, toStr, hasPrev ? prevFromStr : null,
  )
  const heatmap = buildHeatmap(slotUsageByWeekday)
  const channels = computeChannels(currentReservations)
  const noShowsByHour = computeNoShowsByHour(currentReservations)
  const forecastNext7 = computeForecast(futureReservations, restaurant, today, cfg)
  const recurringCount = computeRecurring(currentReservations)
  const topHour = computeTopHour(slotUsageByWeekday)
  const avgLeadHours = computeAvgLeadHours(currentReservations, tz)

  return {
    range: { from: fromStr, to: toStr, days: lengthDays },
    prevRange: hasPrev ? { from: prevFromStr, to: prevToStr } : null,
    totals,
    prev,
    evolution,
    heatmap,
    channels,
    noShowsByHour,
    forecastNext7,
    recurringCount,
    topHour,
    avgLeadHours,
    maxCapacity: cfg.maxCapacity,
    hasMinData: totals.reservations >= 5,
  }
}
