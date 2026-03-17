import React from "react";

interface ReportErrorProps {
  error: string;
  onRetry?: () => void;
  onGoBack?: () => void;
}

export const ReportError: React.FC<ReportErrorProps> = ({
  error,
  onRetry,
  onGoBack,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i
              className="icon-[lucide--triangle-alert] size-8 text-red-600"
              role="img"
              aria-hidden="true"
            />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error al cargar el reporte
          </h2>

          <p className="text-gray-600 mb-6">
            {error ||
              "Ha ocurrido un error inesperado al cargar la información del reporte."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center justify-center space-x-2 bg-blue-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-800 transition-colors"
              >
                <i
                  className="icon-[lucide--refresh-cw] size-4"
                  role="img"
                  aria-hidden="true"
                />
                <span>Intentar nuevamente</span>
              </button>
            )}

            {onGoBack && (
              <button
                onClick={onGoBack}
                className="flex items-center justify-center space-x-2 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
              >
                <i
                  className="icon-[lucide--arrow-left] size-4"
                  role="img"
                  aria-hidden="true"
                />
                <span>Volver</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
