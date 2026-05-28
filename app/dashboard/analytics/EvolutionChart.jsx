"use client"

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts"

const formatXLabel = (dateStr) => {
  const d = new Date(`${dateStr}T12:00:00Z`)
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(d)
}

export const EvolutionChart = ({ data, hasPrev }) => {
  if (!data || data.length === 0) {
    return <p className="text-sm text-gray-400">Sin datos para el gráfico.</p>
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXLabel}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} allowDecimals={false} />
          <Tooltip
            labelFormatter={formatXLabel}
            formatter={(value, name) => [value, name === "current" ? "Periodo actual" : "Periodo anterior"]}
            contentStyle={{ fontSize: 12, borderRadius: 6 }}
          />
          <Legend
            formatter={(name) => (name === "current" ? "Periodo actual" : "Periodo anterior")}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Line type="monotone" dataKey="current" stroke="#111827" strokeWidth={2} dot={false} />
          {hasPrev && (
            <Line type="monotone" dataKey="previous" stroke="#9ca3af" strokeWidth={2} strokeDasharray="4 4" dot={false} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
