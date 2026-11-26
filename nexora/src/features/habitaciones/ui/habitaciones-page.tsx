import { Suspense, memo, useCallback, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { lazyWithFallback } from '../application/lazy-with-fallback';
import { ResourcePolicyProvider } from '../application/resource-policy/resource-policy-provider';
import { useResourcePolicy } from '../application/resource-policy/use-resource-policy';
import { useDeviceResourceProfile } from '../../../shared/lib/use-device-resource-profile';
import { FloorAccordionSkeleton } from './atoms/floor-accordion-skeleton';
import { HabitacionesErrorBoundary } from './molecules/habitaciones-error-boundary';
import type { HabitacionesTabKey } from './molecules/habitaciones-mode-switch';
import { type HabitacionesViewMode } from './molecules/habitaciones-view-mode-toggle';

const LazyHabitacionesModeSwitch = lazyWithFallback(
  () => import('./molecules/habitaciones-mode-switch').then((m) => m.default),
  'HabitacionesModeSwitch'
);

const LazyHabitacionesPisosList = lazyWithFallback(
  () => import('./organisms/habitaciones-pisos-list').then((m) => m.default),
  'HabitacionesPisosList'
);

const LazyRegistrarHabitacionDrawer = lazyWithFallback(
  () =>
    import('./organisms/registrar-habitacion-drawer').then(
      (m) => m.RegistrarHabitacionDrawer
    ),
  'RegistrarHabitacionDrawer'
);

const LazyEdificioRegistroDrawer = lazyWithFallback(
  () =>
    import('../../edificios/ui/organisms/edificio-registro-drawer').then(
      (m) => m.EdificioRegistroDrawer
    ),
  'EdificioRegistroDrawer'
);

const LazyDeviceResourceBadge = lazyWithFallback(
  () => import('./atoms/device-resource-badge').then((m) => m.default),
  'DeviceResourceBadge'
);

const HabitacionesPageContent = memo(function HabitacionesPageContent() {
  const resourceProfile = useDeviceResourceProfile();
  const resourcePolicy = useResourcePolicy();
  const [isRegistroDrawerOpen, setIsRegistroDrawerOpen] = useState(false);
  const [isPisosDrawerOpen, setIsPisosDrawerOpen] = useState(false);
  const [listRefreshVersion, setListRefreshVersion] = useState(0);
  const [viewMode, setViewMode] = useState<HabitacionesViewMode>(() =>
    resourcePolicy.deviceTier === 'low'
      ? 'compact'
      : resourceProfile.policy.defaultViewMode
  );

  const handleOpenRegistroDrawer = useCallback(() => {
    setIsPisosDrawerOpen(false);
    setIsRegistroDrawerOpen(true);
  }, []);

  const handleCloseRegistroDrawer = useCallback(() => {
    setIsRegistroDrawerOpen(false);
  }, []);

  const handleOpenPisosDrawer = useCallback(() => {
    setIsRegistroDrawerOpen(false);
    setIsPisosDrawerOpen(true);
  }, []);

  const handleClosePisosDrawer = useCallback(() => {
    setIsPisosDrawerOpen(false);
  }, []);

  const handleTabChange = useCallback(
    (tab: HabitacionesTabKey) => {
      if (tab === 'registro') {
        handleOpenRegistroDrawer();
      } else if (tab === 'pisos') {
        handleOpenPisosDrawer();
      } else {
        handleCloseRegistroDrawer();
        handleClosePisosDrawer();
      }
    },
    [
      handleClosePisosDrawer,
      handleCloseRegistroDrawer,
      handleOpenPisosDrawer,
      handleOpenRegistroDrawer,
    ]
  );

  const handleCatalogMutated = useCallback(() => {
    setListRefreshVersion((prev) => prev + 1);
  }, []);

  const handleBoundaryReset = useCallback(() => {
    setIsRegistroDrawerOpen(false);
    setIsPisosDrawerOpen(false);
  }, []);

  const allowAnimations =
    resourcePolicy.animation !== 'none' &&
    resourceProfile.policy.enableAnimations;

  const allowSkeletonPulse =
    allowAnimations && resourceProfile.policy.tier === 'full';

  const showResourceBadge =
    resourcePolicy.deviceTier !== 'high' ||
    resourcePolicy.networkTier !== 'high' ||
    resourceProfile.policy.tier !== 'full';

  const activeSwitchTab: HabitacionesTabKey = isRegistroDrawerOpen
    ? 'registro'
    : isPisosDrawerOpen
      ? 'pisos'
      : 'lista';

  return (
    <MotionConfig reducedMotion={allowAnimations ? 'user' : 'always'}>
      <div className="bg-canvas min-h-screen w-full px-3 py-5 pr-16 sm:px-5 sm:pr-20 lg:px-6 lg:pr-20">
        <div className="w-full space-y-6">
          <HabitacionesErrorBoundary onReset={handleBoundaryReset}>
            <div className="space-y-3.5">
              <div className="fixed top-1/2 right-5 z-30 -translate-y-1/2">
                <Suspense
                  fallback={
                    <div
                      className={`bg-line/40 h-28 w-10 rounded-full shadow-md ${
                        allowSkeletonPulse ? 'animate-pulse' : ''
                      }`}
                    />
                  }
                >
                  <LazyHabitacionesModeSwitch
                    activeTab={activeSwitchTab}
                    onChange={handleTabChange}
                  />
                </Suspense>
              </div>

              {showResourceBadge && (
                <Suspense fallback={null}>
                  <LazyDeviceResourceBadge
                    profile={resourceProfile}
                    policy={resourcePolicy}
                  />
                </Suspense>
              )}

              <Suspense
                fallback={
                  <FloorAccordionSkeleton count={3} animate={allowSkeletonPulse} />
                }
              >
                <LazyHabitacionesPisosList
                  onNewHabitacion={handleOpenRegistroDrawer}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  refreshVersion={listRefreshVersion}
                />
              </Suspense>

              {isRegistroDrawerOpen && (
                <Suspense fallback={null}>
                  <LazyRegistrarHabitacionDrawer
                    isOpen={isRegistroDrawerOpen}
                    onClose={handleCloseRegistroDrawer}
                    onHabitacionRegistrada={handleCatalogMutated}
                  />
                </Suspense>
              )}

              {isPisosDrawerOpen && (
                <Suspense fallback={null}>
                  <LazyEdificioRegistroDrawer
                    isOpen={isPisosDrawerOpen}
                    onClose={handleClosePisosDrawer}
                    onSuccess={handleCatalogMutated}
                    allowAnimations={allowAnimations}
                  />
                </Suspense>
              )}
            </div>
          </HabitacionesErrorBoundary>
        </div>
      </div>
    </MotionConfig>
  );
});

export const HabitacionesPage = memo(function HabitacionesPage() {
  return (
    <ResourcePolicyProvider>
      <HabitacionesPageContent />
    </ResourcePolicyProvider>
  );
});

export default HabitacionesPage;
