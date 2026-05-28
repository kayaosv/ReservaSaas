// Timezone-aware date helpers built on Intl.DateTimeFormat (no external deps).

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

// Returns "monday".."sunday" for a YYYY-MM-DD date interpreted in the given tz.
export const weekdayInTZ = (dateStr, timeZone) => {
  // Parse the date string as a calendar date (no tz drift): noon UTC is safe inside any tz day.
  const d = new Date(`${dateStr}T12:00:00Z`)
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long" })
  const name = fmt.format(d).toLowerCase()
  return name
}

// Returns YYYY-MM-DD for the current day in the given tz.
export const todayStrInTZ = (timeZone) => {
  const now = new Date()
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now)
  const get = (t) => parts.find((p) => p.type === t).value
  return `${get("year")}-${get("month")}-${get("day")}`
}

// Returns "HH:MM" for the current local time in the given tz.
export const currentTimeStrInTZ = (timeZone) => {
  const now = new Date()
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now)
  const get = (t) => parts.find((p) => p.type === t).value
  return `${get("hour")}:${get("minute")}`
}

// Compares dateStr+time vs now in the restaurant tz. Returns true if dateStr+time has already passed.
export const isPastInTZ = (dateStr, time, timeZone) => {
  const today = todayStrInTZ(timeZone)
  if (dateStr < today) return true
  if (dateStr > today) return false
  return time <= currentTimeStrInTZ(timeZone)
}

// Returns a Date object at midnight UTC for the given YYYY-MM-DD string.
// Used as the canonical Reservation.date value to avoid tz drift on the date field.
export const dateAtMidnightUTC = (dateStr) => new Date(`${dateStr}T00:00:00.000Z`)

// "HH:MM" → minutes since 00:00. Returns NaN if invalid.
export const timeToMinutes = (time) => {
  if (!time || typeof time !== "string") return NaN
  const [h, m] = time.split(":").map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN
  return h * 60 + m
}

// Minutes since 00:00 → "HH:MM".
export const minutesToTime = (mins) => {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

// "YYYY-MM-DD" + n días (n puede ser negativo) sin tz drift.
export const addDaysStr = (dateStr, n) => {
  const d = new Date(`${dateStr}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// Array inclusivo de YYYY-MM-DD entre fromStr y toStr.
export const eachDayStr = (fromStr, toStr) => {
  const out = []
  let cur = fromStr
  while (cur <= toStr) {
    out.push(cur)
    cur = addDaysStr(cur, 1)
  }
  return out
}

// Compone un instante UTC equivalente a (dateStr + timeStr) interpretado en timeZone.
// Itera ±2h alrededor del candidato naive para encontrar el offset correcto (cubre DST).
export const composeInstantInTZ = (dateStr, timeStr, timeZone) => {
  const [h, m] = timeStr.split(":").map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  const naive = new Date(`${dateStr}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00.000Z`)
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  })
  const targetKey = `${dateStr} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  for (let offset = -14; offset <= 14; offset++) {
    const candidate = new Date(naive.getTime() + offset * 30 * 60 * 1000)
    const parts = fmt.formatToParts(candidate)
    const get = (t) => parts.find((p) => p.type === t).value
    const key = `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`
    if (key === targetKey) return candidate
  }
  return naive
}

// "15 may 2026" en es-ES, opcionalmente forzando timeZone para interpretar dateStr como midday.
export const formatDateEs = (dateStr, timeZone = "UTC") => {
  const d = new Date(`${dateStr}T12:00:00Z`)
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric", month: "short", year: "numeric", timeZone,
  }).format(d)
}

// Generate slot times "HH:MM" between open and close (close exclusive), stepping by slotDuration.
// Handles cross-midnight close (e.g. open "20:00", close "00:00" or "01:00").
export const generateSlotTimes = (open, close, slotDuration) => {
  const start = timeToMinutes(open)
  let end = timeToMinutes(close)
  if (Number.isNaN(start) || Number.isNaN(end) || !slotDuration) return []
  if (end <= start) end += 24 * 60 // close wraps past midnight
  const out = []
  for (let m = start; m < end; m += slotDuration) out.push(minutesToTime(m))
  return out
}
