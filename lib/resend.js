import "server-only"
import { Resend } from "resend"

// Lazy singleton so build-time / edge bundling don't require RESEND_API_KEY.
let _instance = null
export const getResend = () => {
  if (_instance) return _instance
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error("RESEND_API_KEY no está configurado.")
  _instance = new Resend(key)
  return _instance
}

export const EMAIL_FROM = process.env.EMAIL_FROM || "RestoBook <onboarding@resend.dev>"
