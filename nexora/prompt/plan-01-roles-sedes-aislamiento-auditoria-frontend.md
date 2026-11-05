# Plan 01 (Frontend): Roles, Usuarios, Sedes, Contexto Multi-Sede y Auditoría

> **Estado:** Aprobado para ejecución secuencial (sincronizado con el Plan 01 Backend).
> **Repositorio objetivo:** `d:\Nexora\nexora` (React 19 + TypeScript + Vite + Tailwind CSS).
> **Arquitectura base:** Screaming Architecture + Atomic Design (`src/features/<modulo>/{domain,application,infrastructure,ui}`).

---

## 1. Objetivo Funcional y Experiencia de Usuario

1. **Diferenciación de Vistas por Rol (`super_admin` vs `admin` vs `reception` / operadores)**:
   - **`super_admin` (Soporte Técnico)**: Único rol con acceso a los controles de **"Nueva Sede"**, edición estructural y eliminación de sedes en el módulo de Sedes (`src/features/sedes/`).
   - **`admin` (Dueño del Hotel)**:
     - Recibe su usuario pre-creado en la instalación limpia del servidor.
     - Puede ver la información de su(s) sede(s), pero **NO ve botones de creación ni eliminación de sedes**; en su lugar, visualiza un aviso informativo indicando que la habilitación de nuevas sedes se solicita y cotiza con Soporte Técnico.
     - Puede crear usuarios operadores (`reception`, `housekeeping`, `manager`) y elegir si trabajan en **una sede específica**, **varias sedes**, o **"Todas las sedes"** (cuando el hotel tiene más de una sede contratada).
   - **`reception` (Recepcionista / Operador)**:
     - Accede únicamente a la vista operativa de la sede en la que está trabajando (Dashboard operativo, Recepción/Check-in, Reservas, Habitaciones, Clientes, Servicios al cuarto).
     - Si el administrador le otorgó acceso a más de una sede (o a todas), dispone de un **Selector de Sede Activa** en la barra superior/lateral para cambiar de sede sin mezclar datos.

2. **Aislamiento Total de Información por Sede en el Cliente HTTP (`X-Headquarter-ID`)**:
   - Toda petición enviada por `src/lib/api.ts` adjuntará automáticamente la cabecera `X-Headquarter-ID` correspondiente a la **Sede Activa** seleccionada en la sesión.
   - Al cambiar de sede activa en el selector, la aplicación limpiará/recargará los estados de los módulos para garantizar que jamás se mezclen clientes, habitaciones, tarifas, reservas, usuarios ni configuraciones/paletas de una sede con otra.

3. **Trazabilidad y Auditoría Real (Eliminación de `'user_system'` y `'u-123'`)**:
   - Eliminar de raíz todos los valores hardcodeados de auditoría en los repositorios del frontend (`created_by: 'user_system'`, `assignedByUserId: 'u-123'`).
   - El backend asignará la autoría desde el JWT, y el frontend mostrará en los paneles de detalle/tablas los metadatos reales de auditoría (`Creado por`, `Fecha creación`, `Actualizado por`, `Última modificación`).

---

## 2. Almacenamiento de Sesión y Contexto de Sede Activa (`src/shared/auth-storage.ts`)

### 2.1. Modelo de Sesión Autenticada (`AuthSession`)
Ampliar [`src/shared/auth-storage.ts`](file:///d:/Nexora/nexora/src/shared/auth-storage.ts) para almacenar la sesión completa devuelta por `POST /login` y `GET /auth/me`:

```typescript
export type SystemRoleName =
  | 'super_admin'
  | 'admin'
  | 'reception'
  | 'housekeeping'
  | 'manager'
  | 'guest';

export interface AllowedHeadquarterSummary {
  id: string;
  name: string;
  code: string;
}

export interface AuthSession {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    roleId: string;
    roleName: SystemRoleName;
    allHeadquarters: boolean;
    headquartersId: string | null;
    headquartersIds: string[];
    allowedHeadquarters: AllowedHeadquarterSummary[];
  };
  activeHeadquarterId: string | null;
}
```

### 2.2. Funciones Helper de Sesión y Permisos
En `src/shared/auth-storage.ts`:
- `getAuthSession(): AuthSession | null` y `setAuthSession(session: AuthSession): void`
- `getActiveHeadquarterId(): string | null` y `setActiveHeadquarterId(hqId: string): void`
- `isSuperAdmin(): boolean` (`session?.user.roleName === 'super_admin'`)
- `isAdmin(): boolean` (`session?.user.roleName === 'admin'`)
- `canManageHeadquarters(): boolean` (solo `true` para `super_admin`)
- `canManageUsers(): boolean` (`true` para `super_admin` y `admin`)

---

## 3. Interceptor de Sede Activa y Autorización en `src/lib/api.ts`

Actualizar [`src/lib/api.ts`](file:///d:/Nexora/nexora/src/lib/api.ts):
1. En `buildHeaders()`:
   - Adjuntar `Authorization: Bearer <token>` si existe token.
   - Adjuntar `X-Headquarter-ID: <activeHeadquarterId>` en todas las peticiones hacia la API siempre que exista una sede activa seleccionada.
2. Manejo global de errores `401 Unauthorized` y `403 Forbidden`:
   - Si el backend devuelve `401`, limpiar la sesión (`clearAuthToken()`) y redirigir a `/login`.
   - Si el backend devuelve `403` por intento de acceso a una sede o recurso no autorizado, emitir un error descriptivo de dominio para que la UI muestre el mensaje claro al usuario.

---

## 4. Navegación por Rol y Selector de Sede Activa (`src/features/dashboard/`)

### 4.1. Filtrado de Módulos del Sidebar por Rol (`src/features/dashboard/ui/navigation.ts`)
Actualizar la configuración de navegación en [`src/features/dashboard/ui/navigation.ts`](file:///d:/Nexora/nexora/src/features/dashboard/ui/navigation.ts) y [`src/features/dashboard/domain/dashboard-card.ts`](file:///d:/Nexora/nexora/src/features/dashboard/domain/dashboard-card.ts):
- Definir `allowedRoles: SystemRoleName[]` en cada ítem de navegación:
  - **Dashboard Operativo (`dashboard`)**: `['super_admin', 'admin', 'manager', 'reception', 'housekeeping']`
  - **Recepción / Check-In (`recepcion`)**: `['super_admin', 'admin', 'manager', 'reception']`
  - **Reservas (`reservas`)**: `['super_admin', 'admin', 'manager', 'reception']`
  - **Habitaciones (`habitaciones`)**: `['super_admin', 'admin', 'manager', 'reception', 'housekeeping']`
  - **Clientes / Huéspedes (`clientes`)**: `['super_admin', 'admin', 'manager', 'reception']`
  - **Servicios al Cuarto (`servicios`)**: `['super_admin', 'admin', 'manager', 'reception', 'housekeeping']`
  - **Tarifas (`tarifas`)**: `['super_admin', 'admin', 'manager']`
  - **Usuarios y Roles (`usuarios`)**: `['super_admin', 'admin']`
  - **Sedes (`sedes`)**: `['super_admin', 'admin']` (con vista de solo lectura + aviso comercial para `admin`, y CRUD completo para `super_admin`)
  - **Configuración (`configuracion`)**: `['super_admin', 'admin']`

### 4.2. Selector Global de Sede Activa en el Header / Sidebar (`src/features/dashboard/ui/organisms/sidebar.tsx`)
1. Mostrar en la cabecera del layout el nombre y código de la **Sede Activa** actual.
2. Si `user.allowedHeadquarters.length === 1`: mostrar el badge fijo de la sede asignada (ej. `Sede Principal (HQ-001)`).
3. Si `user.allowedHeadquarters.length > 1` (o `user.allHeadquarters === true` con múltiples sedes creadas por soporte):
   - Renderizar un selector desplegable (`HeadquarterSwitcher`) que permita cambiar la `activeHeadquarterId`.
   - Al cambiar de sede, actualizar `auth-storage` y disparar un evento de recarga de contexto (`window.dispatchEvent(new CustomEvent('nexora:headquarter-changed'))`) para que las vistas activas refresquen sus datos exclusivamente con los registros de la nueva sede seleccionada.

---

## 5. Módulo de Sedes (`src/features/sedes/`)

Actualizar [`src/features/sedes/ui/organisms/sedes-panel.tsx`](file:///d:/Nexora/nexora/src/features/sedes/ui/organisms/sedes-panel.tsx):
1. Verificar `canManageHeadquarters()` (`roleName === 'super_admin'`).
2. **Para `super_admin`**:
   - Habilitar el botón **"Crear nueva sede"**, formulario de alta de sede (`POST /headquarters`) y acción de baja lógica (`DELETE /headquarters/{id}`).
3. **Para `admin` (Dueño del Hotel)**:
   - Ocultar los botones de crear y eliminar sedes.
   - Mostrar un banner informativo institucional:
     > *"Tu licencia actual incluye las sedes listadas a continuación. Para habilitar una nueva sede en tu cuenta, contacta al equipo de Soporte Técnico para su cotización y activación."*
   - Permitir ver el detalle de su sede y gestionar sus bloques/sub-sedes (`sub_headquarters`) o edificios si corresponde a la operación interna de su sede.

---

## 6. Módulo de Usuarios y Asignación de Sedes (`src/features/usuarios/`)

### 6.1. Dominio y Contratos (`src/features/usuarios/domain/usuario.ts` y `src/features/usuarios/infrastructure/usuarios.repository.ts`)
1. Actualizar las interfaces de dominio y DTOs en `src/features/usuarios/` para incluir:
   - `allHeadquarters: boolean`
   - `headquartersId: string | null`
   - `headquartersIds: string[]`
   - Metadatos de auditoría: `createdBy`, `createdAt`, `updatedBy`, `updatedAt`.
2. En `usuarios.repository.ts`:
   - Eliminar el valor hardcodeado `created_by: 'user_system'`.
   - Enviar `all_headquarters`, `headquarters_id` y `headquarters_ids` en `POST /users` y `PUT /users/{id}`.

### 6.2. Formulario de Creación/Edición de Usuario (`src/features/usuarios/ui/molecules/usuario-registro-form.tsx`)
Actualizar [`src/features/usuarios/ui/molecules/usuario-registro-form.tsx`](file:///d:/Nexora/nexora/src/features/usuarios/ui/molecules/usuario-registro-form.tsx) y [`src/features/usuarios/ui/organisms/registro-usuario-panel.tsx`](file:///d:/Nexora/nexora/src/features/usuarios/ui/organisms/registro-usuario-panel.tsx):

1. **Filtro de Roles Disponibles**:
   - Cuando el usuario logueado es `admin`, filtrar la lista de roles para **ocultar `super_admin`** (el dueño del hotel solo puede crear `reception`, `housekeeping`, `manager`, `admin` o `guest`).
2. **Selector Inteligente de Sedes para el Usuario (Recepcionista / Operador)**:
   - **Caso 1: El hotel tiene 1 sola sede**:
     - Preseleccionar automáticamente esa única sede (`headquartersIds = [unicaSede.id]`, `headquartersId = unicaSede.id`) y mostrarla como campo informativo pre-asignado para no agregar fricción innecesaria al administrador.
   - **Caso 2: El hotel tiene más de 1 sede**:
     - Mostrar un control con dos modos claros:
       - Opción A: **Checkbox / Switch "Todas las sedes (`all_headquarters`)"** — permite que el mismo recepcionista pueda ingresar y operar en cualquiera de las sedes del hotel.
       - Opción B: **Selección de sede(s) específica(s)** — permite marcar una o varias sedes concretas en las que trabajará ese recepcionista, y definir cuál es su sede predeterminada al iniciar sesión.

---

## 7. Limpieza de Auditoría Hardcodeada y Aislamiento en Todos los Módulos del Frontend

1. **Eliminar `'user_system'` y `'u-123'`** en todos los repositorios de `src/features/`:
   - `src/features/usuarios/infrastructure/usuarios.repository.ts`
   - `src/features/habitaciones/infrastructure/`
   - `src/features/tarifas/infrastructure/`
   - `src/features/reservas/infrastructure/`
   - `src/features/recepcion/infrastructure/`
   - `src/features/servicios/infrastructure/`
   - `src/features/configuracion/infrastructure/`
2. **Estandarizar Tipos de Auditoría (`src/shared/audit.ts`)**:
   - Crear la interfaz compartida `AuditFields`:
     ```typescript
     export interface AuditFields {
       createdBy: string;
       createdAt: string;
       updatedBy?: string | null;
       updatedAt: string;
       deletedBy?: string | null;
       deletedAt?: string | null;
     }
     ```
   - Crear un átomo reutilizable `<AuditBadge />` (`src/shared/ui/atoms/audit-badge.tsx`) para mostrar de forma limpia quién registró y quién actualizó por última vez cada registro (con fecha y hora formateadas).
3. **Configuraciones y Paletas por Sede (`src/features/configuracion/`)**:
   - Asegurar que al consultar o guardar la paleta de colores / configuración del hotel, se envíe bajo el contexto de la sede activa (`X-Headquarter-ID`) para que cada sede conserve su propia configuración sin afectar a otras sedes.

---

## 8. Checklist de Verificación Frontend

- [ ] **Login e Hidratación de Sesión**: Al iniciar sesión con `admin` o `reception`, `auth-storage` guarda `roleName`, `allHeadquarters`, `allowedHeadquarters` y establece `activeHeadquarterId`.
- [ ] **Cabecera `X-Headquarter-ID`**: Todas las llamadas HTTP de `src/lib/api.ts` incluyen `X-Headquarter-ID` y `Authorization: Bearer <token>`.
- [ ] **Vista de Sedes según Rol**: `super_admin` puede crear y eliminar sedes; `admin` ve sus sedes en modo lectura con el mensaje comercial de cotización para nuevas sedes; `reception` no tiene acceso al módulo de configuración de sedes.
- [ ] **Formulario de Creación de Recepcionistas**: `admin` puede crear un recepcionista y asignarle una sede específica, múltiples sedes o "Todas las sedes" (si el hotel cuenta con más de una sede), y nunca puede asignarle el rol `super_admin`.
- [ ] **Cambio de Sede en Vivo**: Al cambiar la sede activa en el `HeadquarterSwitcher`, las listas de clientes, habitaciones, reservas, estadías y configuraciones muestran únicamente los datos de la sede seleccionada.
- [ ] **Cero Auditoría Hardcodeada**: Ningún archivo en `src/` envía `'user_system'` ni `'u-123'`; todas las vistas muestran el `created_by` y `updated_by` reales devueltos por el backend.

---

## 9. Prompt Maestro para Ejecución del Agente (Frontend)

> Copia o referencia este archivo cuando indiques al agente que ejecute la implementación del Plan 01 en `nexora`:
>
> *"Ejecuta íntegramente el plan `d:\Nexora\nexora\prompt\plan-01-roles-sedes-aislamiento-auditoria-frontend.md` respetando la arquitectura Screaming + Atomic Design definida en `d:\Nexora\nexora\src\agent.md`. Implementa en orden: (1) `AuthSession` y helpers de rol/sede activa en `src/shared/auth-storage.ts`, (2) Inyección de `X-Headquarter-ID` en `src/lib/api.ts`, (3) Filtrado de navegación por rol y componente `HeadquarterSwitcher` en `src/features/dashboard/`, (4) Restricción del módulo de Sedes (`src/features/sedes/`) para que solo `super_admin` cree/elimine sedes, (5) Selector de sede única / multi-sede / 'Todas las sedes' y filtro de roles en `src/features/usuarios/`, y (6) Eliminación de `'user_system'`/`'u-123'` y visualización de metadatos de auditoría (`createdBy`, `createdAt`, `updatedBy`, `updatedAt`). Verifica que `npm run build` compile sin errores de TypeScript."*
