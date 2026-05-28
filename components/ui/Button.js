"use client"

const variants = {
  primary: "bg-gray-900 text-white hover:bg-gray-700 disabled:bg-gray-300",
  secondary: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 disabled:opacity-50",
  ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
}

export const Button = ({ children, variant = "primary", className = "", disabled, loading, ...props }) => {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          {children}
        </span>
      ) : children}
    </button>
  )
}
