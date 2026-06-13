import Link from "next/link"
import { getSubscriptionBannerState } from "@/lib/subscription"

const TONE_CLASSES = {
  blue: "bg-brand-50 text-brand-800 border-brand-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  red: "bg-red-50 text-red-800 border-red-200",
  gray: "bg-slate-100 text-slate-700 border-slate-200",
}

export const SubscriptionBanner = ({ restaurant }) => {
  const state = getSubscriptionBannerState(restaurant)
  if (!state) return null
  const classes = TONE_CLASSES[state.tone] || TONE_CLASSES.gray
  return (
    <div className={`border-b px-6 py-2.5 text-sm flex items-center justify-between gap-4 ${classes}`}>
      <span>{state.message}</span>
      <Link
        href="/dashboard/ajustes?activate=1"
        className="font-medium underline underline-offset-2 hover:no-underline shrink-0"
      >
        {state.ctaLabel} →
      </Link>
    </div>
  )
}
