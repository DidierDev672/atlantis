import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListUl, faPlus } from '@fortawesome/free-solid-svg-icons';
import { ReservasListaPage } from './reservas-lista-page';
import { ReservaInteractiveForm } from './organisms/reserva-interactive-form';

type ReservasTab = 'lista' | 'nueva';

export function ReservasPage() {
  const [activeTab, setActiveTab] = useState<ReservasTab>('lista');

  return (
    <div className="bg-canvas min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {/* Pestañas de navegación de alto nivel */}
        <div className="border-line flex items-center justify-between border-b pb-4">
          <nav className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('lista')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === 'lista'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface/50 text-ink-muted hover:bg-surface hover:text-ink'
              }`}
            >
              <FontAwesomeIcon icon={faListUl} className="size-3.5" />
              <span>Lista de reservas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('nueva')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === 'nueva'
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface/50 text-ink-muted hover:bg-surface hover:text-ink'
              }`}
            >
              <FontAwesomeIcon icon={faPlus} className="size-3.5" />
              <span>Nueva reserva</span>
            </button>
          </nav>
        </div>

        {/* Contenido según pestaña activa */}
        {activeTab === 'lista' ? (
          <ReservasListaPage onNuevaReserva={() => setActiveTab('nueva')} />
        ) : (
          <div className="space-y-8">
            <ReservaInteractiveForm />
          </div>
        )}
      </div>
    </div>
  );
}
