import crypto from "node:crypto"

const getSecret = () => {
  const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  if (!s) throw new Error("AUTH_SECRET / NEXTAUTH_SECRET no está configurado.")
  return s
}

const toUrlSafe = (b64) => b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")

export const sign = (reservationId) => {
  const h = crypto.createHmac("sha256", getSecret()).update(`reservation:${reservationId}`).digest("base64")
  return toUrlSafe(h)
}

export const verify = (reservationId, token) => {
  if (!token || typeof token !== "string") return false
  const expected = sign(reservationId)
  const a = Buffer.from(expected)
  const b = Buffer.from(token)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
