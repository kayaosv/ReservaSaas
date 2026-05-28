export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-3">🍽️</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Restaurante no encontrado</h1>
        <p className="text-sm text-gray-500">
          La página que buscas no existe o el restaurante ya no está disponible.
        </p>
      </div>
    </div>
  )
}
