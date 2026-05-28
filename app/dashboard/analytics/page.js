import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { todayStrInTZ, addDaysStr, formatDateEs } from "@/lib/datetime"
import { computeAnalytics } from "@/lib/analytics"
import { generateInsights } from "@/lib/insights"
import { RangeTabs } from "./RangeTabs"
import { SummaryCards } from "./SummaryCards"
import { Heatmap } from "./Heatmap"
import { EvolutionChart } from "./EvolutionChart"
import { ChannelChart } from "./ChannelChart"
import { NoShowTable } from "./NoShowTable"
import { OccupancyForecast } from "./OccupancyForecast"
import { InsightsSection } from "./InsightsSection"
import { ExportCsvButton } from "./ExportCsvButton"

const VALID_RANGES = [7, 30, 90]

export const dynamic = "force-dynamic"

export default async function AnalyticsPage({ searchParams }) {
  const session = await auth()
  const sp = await searchParams
  const range = VALID_RANGES.includes(Number(sp?.range)) ? Number(sp.range) : 30

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: session.user.restaurantId },
  })
  const tz = restaurant?.timezone || "Europe/Madrid"
  const today = todayStrInTZ(tz)
  const fromStr = addDaysStr(today, -(range - 1))
  const toStr = today

  const analytics = await computeAnalytics(restaurant, fromStr, toStr)
  const insights = generateInsights(analytics)

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-start justify-between gap-4 mb-1 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500">
            {formatDateEs(fromStr, tz)} — {formatDateEs(toStr, tz)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RangeTabs active={range} />
          <ExportCsvButton from={fromStr} to={toStr} />
        </div>
      </div>

      {!analytics.hasMinData ? (
        <EmptyState />
      ) : (
        <div className="space-y-8 mt-6">
          <SummaryCards totals={analytics.totals} prev={analytics.prev} />

          <Section title="Evolución de reservas">
            <EvolutionChart data={analytics.evolution} hasPrev={!!analytics.prev} />
          </Section>

          <Section title="Mapa de calor de ocupación">
            <Heatmap heatmap={analytics.heatmap} />
          </Section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Distribución por canal">
              <ChannelChart channels={analytics.channels} />
            </Section>
            <Section title="No-shows por hora">
              <NoShowTable noShowsByHour={analytics.noShowsByHour} />
            </Section>
          </div>

          <Section title="Ocupación prevista próxima semana">
            <OccupancyForecast forecast={analytics.forecastNext7} tz={tz} />
          </Section>

          <Section title="Ideas para tu restaurante">
            <InsightsSection insights={insights} />
          </Section>
        </div>
      )}
    </div>
  )
}

const Section = ({ title, children }) => (
  <section>
    <h2 className="text-sm font-semibold text-gray-900 mb-3">{title}</h2>
    <div className="bg-white border border-gray-200 rounded-lg p-4">{children}</div>
  </section>
)

const EmptyState = () => (
  <div className="mt-12 text-center py-16 bg-white border border-gray-200 rounded-lg">
    <p className="text-4xl mb-3">📊</p>
    <p className="text-sm text-gray-600 font-medium">Aún no hay suficientes datos</p>
    <p className="text-xs text-gray-400 mt-1">
      Necesitas al menos 5 reservas en el periodo para ver tus métricas.
    </p>
  </div>
)
