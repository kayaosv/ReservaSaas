"use client"

export const Input = ({ label, error, id, className = "", ...props }) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors
          ${error ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-slate-300 focus:border-brand-600 focus:ring-1 focus:ring-brand-600"}
          ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
