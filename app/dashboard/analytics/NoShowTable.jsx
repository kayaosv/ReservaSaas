export const NoShowTable = ({ noShowsByHour }) => {
  if (!noShowsByHour || noShowsByHour.length === 0) {
    return <p className="text-sm text-gray-400">Sin no-shows en el periodo.</p>
  }
  return (
    <ul className="divide-y divide-gray-100">
      {noShowsByHour.slice(0, 10).map((row, i) => (
        <li key={row.hour} className="flex items-center justify-between py-2">
          <span className="text-sm text-gray-700 tabular-nums">{row.hour}:00</span>
          <span
            className={`text-sm tabular-nums ${
              i < 3 ? "text-red-600 font-semibold" : "text-gray-500"
            }`}
          >
            {row.count}
          </span>
        </li>
      ))}
    </ul>
  )
}
