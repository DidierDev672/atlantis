import { useState } from 'react';
import { PAGE_META, BACK_TO_CONFIG_PAGES, type NavId } from './ui/navigation';
import { Sidebar } from './ui/organisms/sidebar';
import { Header } from './ui/organisms/header';
import { useRoleRouter } from '../../features/roles/application/use-role-router';
import { HomeOverview } from './ui/organisms/home-overview';
import { PaletteView } from './ui/organisms/palette-view';
import { SedesView } from './ui/organisms/sedes-view';
import { UsuariosPage } from '../../features/usuarios/ui/usuarios-page';
import { PersonasPage } from '../../features/personas/ui/personas-page';
import { RecursosPage } from '../../features/recursos/ui/recursos-page';
import { HabitacionesPage } from '../../features/habitaciones/ui/habitaciones-page';
import { ReservasPage } from '../../features/reservas/ui/reservas-page';
import { RecepcionesPage } from '../../features/recepciones/ui/recepciones-page';
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

  // Si el usuario navegó explícitamente, se respeta su selección;
  // de lo contrario, se usa initialNavId o la redirección automática del switch por rol (ej. 'recepcion')
  const activeId: NavId =
    userNavId ?? initialNavId ?? (decision.isReception ? 'recepcion' : 'home');

  const meta = PAGE_META[activeId];

  const navigate = (id: NavId) => {
    setUserNavId(id);
    setSidebarOpen(false);
  };

  const isBackToConfigPage = BACK_TO_CONFIG_PAGES.includes(activeId);
  const handleBackToConfig = () => navigate('configuracion');

  return (
    <div className="bg-canvas text-ink relative min-h-screen">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeId={activeId}
        onNavigate={navigate}
      />

      <div className="relative z-10 lg:pl-64">
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
