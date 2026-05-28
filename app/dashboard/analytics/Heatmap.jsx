"use client"

const WEEKDAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const WEEKDAYS_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
// heatmap usa weekday 0=domingo..6=sábado (Date.getDay)
const TO_MON_FIRST = [6, 0, 1, 2, 3, 4, 5] // input weekday -> column index (lunes=0)

const colorFor = (pct) => {
  if (pct >= 0.7) return "bg-green-500"
  if (pct >= 0.4) return "bg-yellow-400"
  return "bg-red-400"
}

export const Heatmap = ({ heatmap }) => {
  const slots = Array.from(new Set(heatmap.map((c) => c.slot))).sort()
  if (slots.length === 0) {
    return <p className="text-sm text-gray-400">Sin datos para el mapa de calor.</p>
  }

  // grid[row=slot][col=weekdayMonFirst] = cell
  const grid = new Map()
  for (const cell of heatmap) {
    const col = TO_MON_FIRST[cell.weekday]
    grid.set(`${cell.slot}|${col}`, cell)
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `64px repeat(7, minmax(40px, 1fr))` }}
        >
          <div />
          {WEEKDAYS_ES.map((d) => (
            <div key={d} className="text-xs text-gray-500 text-center font-medium py-1">{d}</div>
          ))}
          {slots.map((slot) => (
            <Row key={slot} slot={slot} grid={grid} />
          ))}
        </div>
        <Legend />
      </div>
    </div>
  )
}

const Row = ({ slot, grid }) => (
  <>
    <div className="text-xs text-gray-500 pr-2 py-1 text-right tabular-nums">{slot}</div>
    {[0, 1, 2, 3, 4, 5, 6].map((col) => {
      const cell = grid.get(`${slot}|${col}`)
      if (!cell || cell.samples === 0) {
        return <div key={col} className="h-6 bg-gray-100 rounded-sm" />
      }
      const tooltip = `${WEEKDAYS_FULL[col]} ${slot} — ${Math.round(cell.pct * 100)}% ocupado`
      return (
        <div
          key={col}
          title={tooltip}
          className={`h-6 rounded-sm ${colorFor(cell.pct)} hover:ring-2 hover:ring-gray-300 cursor-help`}
          style={{ opacity: 0.4 + cell.pct * 0.6 }}
        />
      )
    })}
  </>
)

const Legend = () => (
  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
    <span>Ocupación:</span>
    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded-sm" />&lt;40%</span>
    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-400 rounded-sm" />40-70%</span>
    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-sm" />&gt;70%</span>
    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-100 rounded-sm border border-gray-200" />sin datos</span>
  </div>
)
