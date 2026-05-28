import Link from "next/link"

const OPTIONS = [
  { value: 7, label: "7 días" },
  { value: 30, label: "30 días" },
  { value: 90, label: "90 días" },
]

export const RangeTabs = ({ active }) => (
  <div className="inline-flex rounded-md border border-gray-200 bg-white p-1">
    {OPTIONS.map((o) => {
      const isActive = o.value === active
      return (
        <Link
          key={o.value}
          href={`/dashboard/analytics?range=${o.value}`}
          scroll={false}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            isActive ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {o.label}
        </Link>
      )
    })}
  </div>
)
