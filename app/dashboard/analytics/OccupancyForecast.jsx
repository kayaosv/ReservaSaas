import { formatDateEs } from "@/lib/datetime"

const WEEKDAY_ES = {
  monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles",
  thursday: "Jueves", friday: "Viernes", saturday: "Sábado", sunday: "Domingo",
}

const colorFor = (pct) => {
  if (pct >= 0.7) return "bg-green-500"
  if (pct >= 0.4) return "bg-yellow-400"
  return "bg-red-400"
}

export const OccupancyForecast = ({ forecast, tz }) => {
  if (!forecast || forecast.length === 0) return null
  return (
    <ul className="space-y-2">
      {forecast.map((d) => {
        const label = `${WEEKDAY_ES[d.weekday] || d.weekday} ${formatDateEs(d.date, tz)}`
        if (!d.isOpen) {
          return (
            <li key={d.date} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{label}</span>
              <span className="text-xs text-gray-400">Cerrado</span>
            </li>
          )
        }
        const pct = Math.round(d.pct * 100)
        return (
          <li key={d.date}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-700">{label}</span>
              <span
                className="text-xs text-gray-500 tabular-nums"
                title={`${label}: ${d.used}/${d.capacity} plazas (${pct}%)`}
              >
                {d.used}/{d.capacity} · {pct}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${colorFor(d.pct)}`}
                style={{ width: `${Math.max(2, pct)}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
