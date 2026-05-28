"use client"

export const Input = ({ label, error, id, className = "", ...props }) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full px-3 py-2 text-sm border rounded-md outline-none transition-colors
          ${error ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
