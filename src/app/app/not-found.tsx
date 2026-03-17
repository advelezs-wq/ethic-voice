import Link from "next/link";

export default function AppNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center space-y-6">
        {/* Header icon without logos */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center">
            <i className="icon-[lucide--layout-dashboard] size-8 text-gray-600" />
          </div>
        </div>

        {/* Número 404 */}
        <div>
          <h1 className="text-8xl font-bold text-gray-300">404</h1>
        </div>

        {/* Mensaje */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">
            Página no encontrada
          </h2>
          <p className="text-gray-600 text-base">
            Lo sentimos, la página que estás buscando no existe en la
            plataforma. Verifica la URL o regresa al inicio de la aplicación.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col gap-3 pt-4">
          <Link
            href="/app"
            className="w-full font-semibold py-3 px-6 rounded-lg bg-primary text-white hover:opacity-90 transition-opacity text-center"
          >
            Ir al inicio de la app
          </Link>

          <Link
            href="/app/reports"
            className="w-full font-semibold py-3 px-6 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-center"
          >
            Ver reportes
          </Link>
        </div>

        {/* Información de ayuda */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            ¿Necesitas ayuda?{" "}
            <a
              href="mailto:support@ethicvoice.co"
              className="text-primary hover:underline font-medium"
            >
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

