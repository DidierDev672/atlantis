import { Component, type ErrorInfo, type ReactNode } from 'react';
import { HabitacionesErrorState } from './habitaciones-error-state';

export interface HabitacionesErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface HabitacionesErrorBoundaryState {
  hasError: boolean;
}

export class HabitacionesErrorBoundary extends Component<
  HabitacionesErrorBoundaryProps,
  HabitacionesErrorBoundaryState
> {
  state: HabitacionesErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): HabitacionesErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Error en módulo de habitaciones:', error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="border-line bg-panel rounded-2xl border p-6 shadow-sm">
          <HabitacionesErrorState
            message={
              this.props.fallbackMessage ??
              'Ocurrió un problema inesperado al cargar esta sección.'
            }
            actionLabel="Reintentar"
            onRetry={this.handleReset}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
