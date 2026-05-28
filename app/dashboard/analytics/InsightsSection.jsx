export const InsightsSection = ({ insights }) => {
  if (!insights || insights.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Reserva más para que podamos darte ideas personalizadas.
      </p>
    )
  }
  return (
    <ul className="space-y-2">
      {insights.map((ins, i) => (
        <li
          key={i}
          className="flex items-start gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3"
        >
          <span className="text-lg leading-none">{ins.icon}</span>
          <p className="text-sm text-gray-700">{ins.text}</p>
        </li>
      ))}
    </ul>
  )
}
