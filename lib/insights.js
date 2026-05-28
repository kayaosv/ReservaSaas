const WEEKDAY_ES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// Genera insights en lenguaje natural a partir del output de computeAnalytics.
// No accede a BD: pure function.
export const generateInsights = (analytics) => {
  if (!analytics?.hasMinData) return []
  const out = []

  // Trend vs periodo anterior
  if (analytics.prev) {
    const cur = analytics.totals.reservations
    const prev = analytics.prev.reservations
    if (prev > 0) {
      const diff = (cur - prev) / prev
      if (Math.abs(diff) >= 0.1) {
        const pct = Math.round(Math.abs(diff) * 100)
        out.push({
          type: "trend",
          icon: diff > 0 ? "📈" : "📉",
          text:
            diff > 0
              ? `Tus reservas han subido un ${pct}% respecto al periodo anterior.`
              : `Tus reservas han bajado un ${pct}% respecto al periodo anterior.`,
        })
      }
    }
  }

  // Oportunidad: weekday con ≥3 slots de ocupación <40% (con muestras)
  const lowSlotsByWeekday = new Map()
  for (const cell of analytics.heatmap) {
    if (cell.samples < 2) continue
    if (cell.pct < 0.4) {
      lowSlotsByWeekday.set(cell.weekday, (lowSlotsByWeekday.get(cell.weekday) || 0) + 1)
    }
  }
  let bestWeekday = null
  for (const [w, n] of lowSlotsByWeekday.entries()) {
    if (n >= 3 && (!bestWeekday || n > bestWeekday.n)) bestWeekday = { w, n }
  }
  if (bestWeekday) {
    out.push({
      type: "opportunity",
      icon: "📌",
      text: `Los ${WEEKDAY_ES[bestWeekday.w]} tienes baja ocupación en varias franjas — podría ser un buen día para promociones.`,
    })
  }

  // Alerta: hora con tasa no-show alta (necesita correlacionar no-shows con reservas totales por hora)
  // Heurística simple: si una hora concentra >=3 no-shows y >10% del total
  if (analytics.noShowsByHour.length > 0) {
    const top = analytics.noShowsByHour[0]
    const totalNoShows = analytics.noShowsByHour.reduce((a, b) => a + b.count, 0)
    if (top.count >= 3 && top.count / Math.max(1, totalNoShows) >= 0.3) {
      out.push({
        type: "alert",
        icon: "⚠️",
        text: `Los no-shows se concentran a las ${top.hour}:00 — considera pedir confirmación previa.`,
      })
    }
  }

  // Hora estrella
  if (analytics.topHour) {
    out.push({
      type: "top_hour",
      icon: "⭐",
      text: `Tu franja con más ocupación es las ${analytics.topHour}.`,
    })
  }

  // Antelación media
  if (analytics.avgLeadHours != null) {
    const h = analytics.avgLeadHours
    let label
    if (h < 24) label = `${Math.round(h)} horas`
    else label = `${Math.round(h / 24)} días`
    out.push({
      type: "lead_time",
      icon: "⏱️",
      text: `Tus clientes reservan con una antelación media de ${label}.`,
    })
  }

  // Clientes recurrentes
  if (analytics.recurringCount > 0) {
    out.push({
      type: "customer",
      icon: "👤",
      text: `${analytics.recurringCount} ${analytics.recurringCount === 1 ? "cliente ha reservado" : "clientes han reservado"} 3 o más veces en este periodo.`,
    })
  }

  return out
}
