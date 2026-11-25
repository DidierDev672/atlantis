import { useState } from 'react';
import { PAGE_META, BACK_TO_CONFIG_PAGES, type NavId } from './ui/navigation';
import { Sidebar } from './ui/organisms/sidebar';
import { Header } from './ui/organisms/header';
import { useRoleRouter } from '../../features/roles/application/use-role-router';
import {
  canAccessRoute,
  getDefaultRouteForCurrentUser,
} from '../../shared/auth-storage';
import { HomeOverview } from './ui/organisms/home-overview';
import { PaletteView } from './ui/organisms/palette-view';
import { SedesView } from './ui/organisms/sedes-view';
import { UsuariosPage } from '../../features/usuarios/ui/usuarios-page';
import { PersonasPage } from '../../features/personas/ui/personas-page';
import { RecursosPage } from '../../features/recursos/ui/recursos-page';
import { HabitacionesPage } from '../../features/habitaciones/ui/habitaciones-page';
import { ReservasPage } from '../../features/reservas/ui/reservas-page';
import { RecepcionesPage } from '../../features/recepciones/ui/recepciones-page';
import { SalidasRecepcionesPage } from '../../features/recepciones/ui/salidas-recepciones-page';
import { Cama3dPage } from '../../features/cama3d/ui/cama3d-page';
import { TarifasPage } from '../../features/tarifas/ui/tarifas-page';
import { ConfiguracionesPage } from '../../features/configuraciones/ui/configuraciones-page';
import { AuditoriaPage } from '../../features/auditoria/ui/auditoria-page';
import UserProfile from '../../features/usuarios/ui/UserProfile';
import { ServicioHabitacionesPage } from '../../features/servicio-habitaciones/ui/views/ServicioHabitacionesPage';
import { SectionSoon } from './ui/molecules/section-soon';

export interface DashboardPageProps {
  onLogout?: () => void;
  initialNavId?: NavId;
}

export function DashboardPage({
  onLogout,
  initialNavId,
}: DashboardPageProps = {}) {
  const { decision } = useRoleRouter();
  const [userNavId, setUserNavId] = useState<NavId | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('nexora.sidebar.pinned') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebarPin = () => {
    setSidebarPinned((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem('nexora.sidebar.pinned', String(next));
      } catch {
        // localStorage no disponible
      }
      return next;
    });
  };

  // Si el usuario navegó explícitamente y tiene permiso sobre la ruta, se respeta su selección;
  // de lo contrario, se usa initialNavId o la redirección automática del switch por rol (ej. 'habitacion')
  const rawActiveId: NavId =
    userNavId ?? initialNavId ?? (decision.isReception ? 'habitacion' : getDefaultRouteForCurrentUser());
  const activeId: NavId = canAccessRoute(rawActiveId)
    ? rawActiveId
    : getDefaultRouteForCurrentUser();

  const meta = PAGE_META[activeId];

  const navigate = (id: NavId) => {
    const safeId: NavId = canAccessRoute(id) ? id : getDefaultRouteForCurrentUser();
    setUserNavId(safeId);
    setSidebarOpen(false);
  };

  const isBackToConfigPage =
    canAccessRoute('configuracion') && BACK_TO_CONFIG_PAGES.includes(activeId);
  const handleBackToConfig = () => navigate('configuracion');

  return (
    <div className="bg-canvas text-ink relative min-h-screen">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeId={activeId}
        onNavigate={navigate}
        pinned={sidebarPinned}
        onTogglePin={handleToggleSidebarPin}
      />

      <div
        className={`relative z-10 transition-[padding] duration-200 ease-out ${
          sidebarPinned ? 'lg:pl-64' : 'lg:pl-20'
        }`}
      >
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          onOpenSidebar={() => setSidebarOpen(true)}
          onNavigate={navigate}
          onLogout={onLogout}
          canGoBack={isBackToConfigPage}
          onBack={handleBackToConfig}
        />

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {activeId === 'home' ? (
            <HomeOverview onNavigate={navigate} />
          ) : activeId === 'perfil' ? (
            <UserProfile />
          ) : activeId === 'sedes' ? (
            <SedesView />
          ) : activeId === 'usuarios' ? (
            <UsuariosPage />
          ) : activeId === 'personas' ? (
            <PersonasPage />
          ) : activeId === 'habitacion' ? (
            <HabitacionesPage />
          ) : activeId === 'tarifas' ? (
            <TarifasPage />
          ) : activeId === 'reservas' ? (
            <ReservasPage />
          ) : activeId === 'recepcion' ? (
            <RecepcionesPage />
          ) : activeId === 'salidas' ? (
            <SalidasRecepcionesPage />
          ) : activeId === 'auditoria' ? (
            <AuditoriaPage />
          ) : activeId === 'cama' ? (
            <Cama3dPage />
          ) : activeId === 'recursos' ? (
            <RecursosPage />
          ) : activeId === 'paletas' ? (
            <PaletteView />
          ) : activeId === 'servicios' ? (
            <ServicioHabitacionesPage />
          ) : activeId === 'configuracion' ? (
            <ConfiguracionesPage onNavigate={navigate} />
          ) : (
            <SectionSoon
              icon="bed"
              title={meta.title}
              message={meta.soonMessage}
              actionLabel="Volver al resumen"
              onAction={() => navigate('home')}
            />
          )}
        </main>
      </div>
    </div>
  );
}
