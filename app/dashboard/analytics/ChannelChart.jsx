const SOURCE_LABELS = {
  widget: "Widget",
  manual: "Manual",
  google: "Google",
}

const COLORS = ["bg-gray-900", "bg-red-500", "bg-blue-500", "bg-purple-500", "bg-amber-500"]

export const ChannelChart = ({ channels }) => {
  const total = channels.reduce((a, b) => a + b.count, 0)
  if (total === 0) {
    return <p className="text-sm text-gray-400">Sin reservas en el periodo.</p>
  }
  return (
    <div className="space-y-3">
      {channels.map((c, i) => {
        const pct = Math.round((c.count / total) * 100)
        const label = SOURCE_LABELS[c.source] || c.source
        return (
          <div key={c.source}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-700">{label}</span>
              <span className="text-gray-500 tabular-nums">{c.count} ({pct}%)</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${COLORS[i % COLORS.length]} transition-all`}
                style={{ width: `${pct}%` }}
                title={`${label}: ${pct}% (${c.count} reservas)`}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
