const formatPct = (v) => `${Math.round(v * 100)}%`

const Delta = ({ current, previous, invert = false }) => {
  if (previous == null) return <span className="text-xs text-gray-400">—</span>
  if (previous === 0 && current === 0) return <span className="text-xs text-gray-400">—</span>
  if (previous === 0) return <span className="text-xs text-gray-400">nuevo</span>
  const diff = (current - previous) / previous
  const pct = Math.round(Math.abs(diff) * 100)
  const isUp = diff > 0
  const positive = invert ? !isUp : isUp
  if (Math.abs(diff) < 0.01) return <span className="text-xs text-gray-400">=</span>
  return (
    <span className={`text-xs font-medium ${positive ? "text-green-600" : "text-red-600"}`}>
      {isUp ? "↑" : "↓"} {pct}%
    </span>
  )
}

const Card = ({ label, value, sub }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4">
    <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
    <div className="flex items-baseline gap-2 mt-1">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub}
    </div>
  </div>
)

export const SummaryCards = ({ totals, prev }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <Card
      label="Total reservas"
      value={totals.reservations}
      sub={<Delta current={totals.reservations} previous={prev?.reservations ?? null} />}
    />
    <Card
      label="Ocupación media"
      value={formatPct(totals.occupancyPct)}
      sub={<Delta current={totals.occupancyPct} previous={prev?.occupancyPct ?? null} />}
    />
    <Card
      label="No-show rate"
      value={formatPct(totals.noShowRate)}
      sub={<Delta current={totals.noShowRate} previous={prev?.noShowRate ?? null} invert />}
    />
    <Card
      label="Cancelaciones"
      value={totals.cancellations}
      sub={<Delta current={totals.cancellations} previous={prev?.cancellations ?? null} invert />}
    />
  </div>
)
