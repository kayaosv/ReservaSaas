export const Card = ({ children, className = "", ...props }) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`} {...props}>
      {children}
    </div>
  )
}
