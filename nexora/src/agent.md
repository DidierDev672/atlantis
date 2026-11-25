# Convenciones y Arquitectura de Frontend (Nexora)

Guía de arquitectura y optimización para agentes de IA y desarrolladores que extiendan el proyecto en React + TypeScript sin romper las reglas estructurales ni degradar rendimiento.

---

## 1. Arquitectura Base (Vertical Slicing + Cebolla + SOLID)

### Verticalidad (Vertical Slicing)

Cada funcionalidad vive aislada en su propia carpeta dentro de `src/features/<feature>/` con sus capas internas (`domain/`, `application/`, `infrastructure/`, `ui/`), sin acoplarse internamente a otros slices.

Ejemplo real en `src/features/tema/`:

- `domain/` → `palette.ts`, `palette-repository.ts` (tipos y contratos puros, sin React ni APIs de navegador).
- `application/` → `get-palettes.ts`, `palette-theme.ts`, `tema-store.ts` (casos de uso y orquestación; solo dependen de `domain/`).
- `infrastructure/` → `api-palette-repository.ts` (adaptadores HTTP, almacenamiento, detección de red/hardware).
- `ui/` → `tema-page.tsx`, `atoms/`, `molecules/`, `organisms/`, `lib/` (única capa que conoce React).

### Principios SOLID

- **SRP:** Un caso de uso o componente por responsabilidad.
- **OCP:** Extender variantes, tokens o repositorios sin modificar el núcleo de dominio ni los componentes consumidores.
- **LSP / ISP / DIP:** Repositorios pequeños que implementan interfaces de `domain/` e intercambio por abstracción.

---

## 2. Reglas Obligatorias de Diseño, Tamaño y Código

### 2.1 Sin Header obligatorio en componentes ni páginas

- **No** se debe implementar un componente `Header` por defecto en páginas, vistas, modales ni drawers.
- Solo se incluirá encabezado cuando un requerimiento explícito del usuario lo solicite.

### 2.2 Límite de 250 – 350 líneas + Atomic Design obligatorio

- **Límite estricto:** Ningún componente, vista o archivo de funciones debe superar las **250 – 350 líneas** (objetivo recomendado <= 250 líneas; techo máximo 350 líneas).
- Si un componente supera (o va a superar) ese límite, es **obligatorio** refactorizarlo aplicando **Atomic Design**:
  - `atoms/` → Piezas visuales mínimas e indivisibles (botones, badges, iconos, inputs).
  - `molecules/` → Composición acotada de átomos (cards, modales pequeños, controles compuestos).
  - `organisms/` → Secciones complejas que orquestan moléculas y hooks de `application/`.
- Si un módulo de lógica o función excede el límite, dividirlo en funciones puras pequeñas y archivos separados dentro de `domain/`, `application/` o `infrastructure/`.

### 2.3 Cargas perezosas obligatorias (`async / await`, `React.lazy`, `React.memo`)

Todo componente y función pesada o secundaria debe cumplir obligatoriamente:

1. **`React.memo`:** Envolver todos los componentes UI exportados con `memo(...)` para evitar re-renders innecesarios (junto con `useCallback` y `useMemo` cuando se pasen handlers u objetos derivados).
2. **`React.lazy` + `async / await` + `try / catch`:** Cargar de forma perezosa vistas, pestañas, modales, drawers, overlays y componentes con peso visual (p. ej. animaciones o 3D) mediante `lazy(async () => { try { ... } catch { ... } })` con fallback seguro y `<Suspense>` en el punto de renderizado.
3. **Funciones bajo demanda:** Las operaciones de datos, importaciones dinámicas (`import(...)`) y transformaciones costosas deben ejecutarse de forma asíncrona con `async / await` y manejo de errores `try / catch` únicamente cuando el usuario o la vista activa los necesite.

```tsx
const LazyDetalleModal = lazy<ComponentType<DetalleModalProps>>(async () => {
  try {
    const mod = await import('../molecules/DetalleModal');
    return { default: mod.DetalleModal };
  } catch (error) {
    console.error('Error cargando DetalleModal:', error);
    const Fallback: ComponentType<DetalleModalProps> = () => null;
    return { default: Fallback };
  }
});
```

---

## 3. Optimización de Hardware (GPU / VRAM / RAM) y Ancho de Banda

Todo módulo nuevo o modificado debe consultar el perfil unificado de hardware y red mediante `useDeviceResourceProfile()` (`src/shared/lib/use-device-resource-profile.ts`), que expone `hardware`, `network` y `policy`.

### 3.1 GPU y VRAM

- **Blur condicionado al hardware:** No apilar múltiples `backdrop-blur-*`. Aplicar `backdrop-blur` solo cuando `policy.enableBackdropBlur` sea `true` (y nunca en doble capa fondo + tarjeta).
- **Presupuesto global de animación:** Envolver la raíz de vistas o subárboles interactivos con `<MotionConfig reducedMotion={policy.enableAnimations ? 'user' : 'always'}>` (`motion/react`).
- **Sin bucles infinitos:** Evitar `repeat: Infinity` y `animate-pulse` en listas, tablas o estados hover frecuentes; usar repeticiones finitas en `policy.tier === 'full'` o estilos estáticos (`ring-1`).
- **Efectos pesados y 3D:** En `policy.tier === 'ultra-light'` o `!policy.enableAnimations`, sustituir animaciones pesadas (partículas, escenas 3D, escalado de `#root`) por íconos o vistas estáticas.
- **Listas largas:** Usar `motion` con las variantes centrales de `src/design-tokens/motion.ts` (`fadeUp`, `fadeIn`, `slideIn`, `staggerContainer`, `staggerItem`) solo cuando corresponda al perfil activo, sin envolver contenedores masivos en capas `transform` persistentes.

### 3.2 Memoria RAM

- **Desmontar vistas inactivas:** Renderizar únicamente la pestaña, modal o drawer activo (`vistaActiva === '...'`); **no** retener árboles inactivos en el DOM con `hidden` (`display: none`).
- **Cachés acotadas:** Usar `BoundedTtlCache` (`src/shared/lib/bounded-ttl-cache.ts`) o límites equivalentes (`LRU + TTL`) para evitar crecimiento ilimitado de diccionarios en memoria.
- **Limpieza explícita:** Liberar `setTimeout`, `setInterval`, suscripciones, listeners y `URL.createObjectURL` en el retorno de `useEffect`.

### 3.3 Ancho de banda de red

- **Concurrencia y calidad adaptativa:** Respetar `network.maxConcurrentRequests`, `network.maxConcurrentImages`, `network.imageWidth`, `network.thumbnailWidth` y `network.imageQuality` del `NetworkProfile`.
- **Ahorro de datos y redes lentas:** Cuando `network.saveData`, `network.preferLightweightImages` o `network.tier` sea `'low'` / `'offline'`, evitar descargas de blobs pesados y desactivar precargas automáticas (`network.enableBackgroundMetadata` / `policy.allowPreloadAllBuildings`).
- **Listados progresivos:** Cuando una lista o tabla requiera carga incremental de datos desde red, usar `InfiniteScroll` (`src/shared/ui/InfiniteScroll.tsx`) apoyado en `createInfiniteScrollBalancer` (`src/shared/lib/infinite-scroll-balancer.ts`) para evitar ráfagas de peticiones y ceder el hilo principal entre lotes.

---

## 4. Tokens de Diseño y Mensajes

### Paleta y tipografía centralizadas

- **Colores** (`src/design-tokens/colors.ts`): `primary` (`#5a311f`), `secondary` (`#67543e`), `neutral` (`#6d6e76`), `surface` (`#d4c7b7`), `danger` (`#9c3b31`) y `brandDefaults`.
- **Tipografía** (`src/design-tokens/typography.ts`): `Poppins`, pesos `regular` (400), `medium` (500), `semibold` (600) y `bold` (700).
- **Animaciones** (`src/design-tokens/motion.ts`): importar variantes reutilizables en lugar de duplicar definiciones por módulo.

### Copywriting en mensajes de éxito, error y advertencia

- **Éxito:** Confirmar la acción concreta realizada con el mismo verbo del botón (ej. `"Guardado"`).
- **Error:** No culpar al usuario ni exponer stack traces técnicos; explicar qué ocurrió y el siguiente paso claro, validando respuestas HTTP con `src/shared/lib/status-code-validator.ts`.
- **Advertencia:** Anticipar la consecuencia en tono neutral y ofrecer una acción clara antes de continuar.

---

## 5. Verificación del Proyecto

Scripts reales definidos en `package.json` y comprobación de tipos:

```bash
npx tsc -b
npm run lint
npm run build
```
