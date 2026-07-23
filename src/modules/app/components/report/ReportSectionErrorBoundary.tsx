"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  /** Título mostrado cuando esta sección falla al renderizar. */
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
}

/**
 * Contiene errores de render dentro de una sección del caso (p. ej. el panel
 * de Tareas) para que un fallo puntual no tumbe toda la página del reporte
 * con el boundary genérico de la app. La acción que disparó el error (guardar,
 * completar una tarea, etc.) ya se confirmó en el servidor antes de este punto;
 * este boundary solo evita que un problema de re-render oculte ese resultado.
 */
export class ReportSectionErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Error rendering report section:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <i className="icon-[lucide--refresh-ccw] mx-auto mb-2 size-6 text-amber-600" />
          <p className="text-sm font-semibold text-amber-900">
            {this.props.fallbackTitle || "No se pudo mostrar esta sección"}
          </p>
          <p className="mt-1 text-xs text-amber-800">
            Tu cambio se guardó correctamente. Recarga la página para ver la
            vista actualizada.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="mt-3 rounded-full border border-amber-300 bg-white px-4 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
