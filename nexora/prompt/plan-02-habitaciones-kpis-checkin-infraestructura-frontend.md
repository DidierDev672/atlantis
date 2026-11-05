# Plan 02 (Frontend): Módulo Operativo de Habitaciones, KPIs en Tiempo Real, Check-In Directo y Separación de Infraestructura en Configuración

> **Estado:** Aprobado para ejecución secuencial (sincronizado con el Plan 02 Backend).
> **Repositorio objetivo:** `d:\Nexora\nexora` (React 19 + TypeScript + Vite + Tailwind CSS).
> **Arquitectura base:** Screaming Architecture + Atomic Design (`src/features/<modulo>/{domain,application,infrastructure,ui}`).

---

## 1. Objetivo de Experiencia de Usuario y Reorganización de Módulos

1. **Pantalla Inicial del Recepcionista = Módulo Operativo de Habitaciones (`habitacion`)**:
   - Cuando un usuario con rol `reception` inicia sesión, el sistema lo lleva directamente al **Módulo de Habitaciones** (`activeId = 'habitacion'`).
   - El módulo de Habitaciones se convierte en un **Centro de Control Operativo 100% limpio**: muestra arriba los **KPIs en tiempo real** del hotel/sede y abajo el **Rack de Habitaciones** (en vista Cuadrícula de Tarjetas o Tabla).

2. **Check-In, Consulta de Huéspedes y Check-Out Sin Cambiar de Pantalla y Sin Clics Innecesarios**:
   - **Se elimina la pantalla intermedia "Cozy" (`AsignarHuespedPage` con el paisaje, la cama ilustrada y el modal de presentación)** que obligaba al recepcionista a cambiar de vista y abrir 3 modales anidados.
   - Ahora, al hacer clic sobre cualquier habitación en el módulo de Habitaciones, se abre directamente un **Drawer / Modal Operativo Unificado** sobre la misma pantalla:
     - **Si la habitación está Disponible (`available`)**: Abre directamente el **Formulario Express de Check-In** (donde digita la cédula del huésped, si ya existe se autocompleta al instante, o llena sus datos ahí mismo en una sola vista, define la hora de entrada/salida, método de pago y confirma el ingreso en **1 solo clic**).
     - **Si la habitación está Ocupada (`busy`)**: Muestra la **Ficha Activa de la Habitación** con los huéspedes alojados, hora exacta en que ingresaron, hora programada de salida, quién los registró, y el botón directo para **Realizar Check-Out / Entregar Habitación** o agregar un acompañante.
     - **Si la habitación está En Limpieza (`cleaning`)**: Muestra el botón directo **"Marcar Habitación Lista (Disponible)"** en 1 clic.

3. **Separación Total: La Estructura Física del Hotel Pasa a Configuración (Solo `admin`)**:
   - Del módulo operativo de Habitaciones **se retiran** las pestañas y botones de *"Registrar habitación"*, *"Crear edificio"*, *"Crear tipo de habitación"* y *"Crear tipo de cama"*.
   - Toda la creación y administración de la estructura física del hotel (**Edificios y Pisos, Tipos de Habitación, Tipos de Cama, Inventario de Habitaciones y Camas de cada Habitación, y Tarifas**) se ubica dentro del **Módulo de Configuración (`configuracion`)**, accesible **únicamente para el rol `admin` (y `super_admin`)**.

---

## 2. Reorganización de la Navegación y Aterrizaje por Rol (`src/features/dashboard/`)

### 2.1. Aterrizaje Inteligente en `DashboardPage` (`src/features/dashboard/dashboard-page.tsx`)
- Al montar `DashboardPage`, leer el rol del usuario desde `getAuthSession()` (`src/shared/auth-storage.ts`):
  - Si `roleName === 'reception'` (o `'housekeeping'`): inicializar `activeId` directamente en `'habitacion'`.
  - Si `roleName === 'admin'` o `'super_admin'`: inicializar en `'home'` (o permitir ir con 1 clic tanto a `'habitacion'` para ver la operación en vivo como a `'configuracion'` para administrar la estructura del hotel).

### 2.2. Menú Lateral (`Sidebar`) Claro y Separado por Rol
Actualizar [`src/features/dashboard/ui/navigation.ts`](file:///d:/Nexora/nexora/src/features/dashboard/ui/navigation.ts) y [`src/features/dashboard/ui/organisms/sidebar.tsx`](file:///d:/Nexora/nexora/src/features/dashboard/ui/organisms/sidebar.tsx):
- **Módulos Operativos (Visibles para `reception` y `admin`)**:
  - **Habitaciones (`habitacion`)**: Rack en vivo, KPIs de capacidad/camas/ocupación, Check-In y Check-Out directo.
  - **Reservas (`reservas`)**: Calendario y listado de reservas futuras.
  - **Huéspedes / Clientes (`personas`)**: Directorio histórico de clientes de la sede.
  - **Servicios a la Habitación (`servicios`)**: Pedidos y room service.
- **Módulos de Administración y Estructura Física (Visibles SOLO para `admin` y `super_admin` dentro de `configuracion`)**:
  - **Infraestructura Física del Hotel** (Nueva sección unificada en Configuración):
    1. **Edificios y Pisos**: Crear/editar edificios y su número de pisos.
    2. **Tipos de Habitación y Tipos de Cama**: Definir categorías, capacidades de personas por tipo de cama (Sencilla = 1, Doble = 2, King = 2, Camarote = 2, etc.) y precios base.
    3. **Catálogo de Habitaciones y Camas**: Crear cada habitación asignándole su edificio, piso, tipo de habitación, tarifa y **configurando las camas exactas que tiene dentro** (ej. Habitación 201 -> Cama A: Doble [2 pers] + Cama B: Sencilla [1 pers] = 2 camas, capacidad 3 personas).
  - **Tarifas (`tarifas`)**, **Usuarios y Recepcionistas (`usuarios`)**, **Sedes (`sedes`)**, **Auditoría (`auditoria`)** y **Personalización (`paletas`)**.

---

## 3. Diseño del Nuevo Módulo Operativo de Habitaciones (`src/features/habitaciones/`)

### 3.1. Barra Superior de KPIs en Tiempo Real (`HabitacionesKpiStrip`)
Crear el organismo `src/features/habitaciones/ui/organisms/habitaciones-kpi-strip.tsx` conectado a `GET /rooms/operational-rack`, mostrando 4 tarjetas de alto impacto visual en la parte superior de la pantalla:

1. **Capacidad del Hotel (Personas)**:
   - Valor principal: **`currentGuestsHosted / totalCapacityGuests` huéspedes** (ej. `32 / 60 personas en el hotel`).
   - Indicador secundario: Porcentaje de aforo ocupado y capacidad libre disponible.
2. **Camas Ocupadas vs. Disponibles**:
   - Valor principal: **`occupiedBeds / totalBeds` camas ocupadas** (ej. `21 / 38 camas`).
   - Indicador secundario: **`availableBeds` camas libres** listas para alojar.
3. **Estado de Habitaciones**:
   - Valor principal: **`occupiedRooms / totalRooms` habitaciones ocupadas** (`occupancyRatePercent%`).
   - Chips interactivos de filtro rápido:
     - 🟢 `Disponibles (X)`
     - 🔴 `Ocupadas (Y)`
     - 🧹 `En Limpieza (Z)`
     - 🛠️ `Mantenimiento (W)`
4. **Flujo Horario de Hoy (Entradas y Salidas)**:
   - **Ingresos hoy (Check-In)**: `X ingresos registrados hoy`.
   - **Salidas hoy (Check-Out)**: `Y salidas programadas hoy`.
   - **Alerta de Salida Vencida (Overstay)**: Badge resaltado si hay habitaciones cuya hora de salida (`checkOutDate`) ya se cumplió para que el recepcionista gestione la salida o renovación.

### 3.2. Tarjetas de Habitación Operativas (`HabitacionCardItem` y Vista Tabla)
Refactorizar [`src/features/habitaciones/ui/molecules/habitacion-card-item.tsx`](file:///d:/Nexora/nexora/src/features/habitaciones/ui/molecules/habitacion-card-item.tsx) y [`src/features/habitaciones/ui/organisms/habitaciones-lista-table.tsx`](file:///d:/Nexora/nexora/src/features/habitaciones/ui/organisms/habitaciones-lista-table.tsx) para mostrar toda la información operativa sin clics extra:

- **En todas las habitaciones**:
  - Número de habitación (`Hab. 101`), Edificio y Piso (`Torre A · Piso 1`), Tipo (`Estándar Doble`).
  - **Camas y Capacidad**: Badge claro `🛏️ 2 Camas · 👥 Cap. 3 pers.` (mostrando el desglose ej. *1 Doble, 1 Sencilla*).
  - **Tarifa / Precio**: `$150.000 / noche`.
- **Cuando está DISPONIBLE (`available`)**:
  - Borde e indicador esmeralda.
  - Acción principal de 1 clic en la tarjeta: **`+ Registrar Huésped (Check-In)`**.
- **Cuando está OCUPADA (`busy`)**:
  - Borde e indicador ámbar/coral (o rojo pulsante si tiene salida vencida `isOverstay`).
  - **Huésped Titular + Acompañantes**: `👤 Carlos Ramírez (+1 acompañante) · 2/3 pers.`
  - **Horario de Ingreso y Salida visible en la misma tarjeta**:
    - `🟢 Entrada: 01 Nov, 02:15 PM`
    - `🏁 Salida: 03 Nov, 12:00 PM`
  - Acción principal de 1 clic en la tarjeta: **`Ver Estancia / Check-Out`**.
- **Cuando está EN LIMPIEZA (`cleaning`)**:
  - Borde azul/celeste con botón directo: **`✓ Marcar Disponible`**.

---

## 4. Modal / Drawer Operativo Directo de Check-In y Check-Out (`HabitacionOperacionModal`)

Crear `src/features/habitaciones/ui/organisms/habitacion-operacion-modal.tsx` (reemplazando `AsignarHuespedPage` y los 3 sub-modales anidados):

### 4.1. Flujo A: Habitación Disponible -> Check-In Express en 1 Sola Vista
Cuando el recepcionista selecciona una habitación disponible, se abre el panel lateral/modal con:
1. **Resumen de la Habitación en Cabecera**:
   - `Habitación 101 · Torre A (Piso 1) · 2 Camas (Capacidad máx: 3 huéspedes) · Tarifa: $150.000`.
2. **Sección 1: Datos de los Huéspedes (Inline, Sin Abrir Sub-Modales)**:
   - Por defecto muestra la fila del **Huésped Titular** y un botón `+ Agregar acompañante` (hasta el límite `totalBedCapacity` de la habitación).
   - **Autocompletado Instantáneo por Documento**:
     - Al escribir el `Número de Documento` (o presionar Enter/Tab), consulta `GET /persons/by-document`.
     - Si el huésped ya existe en la sede, llena automáticamente `Nombre completo`, `Teléfono`, `Correo` y `Nacionalidad` con un aviso verde *"✓ Cliente frecuente encontrado"*.
     - Si es un huésped nuevo, el recepcionista escribe ahí mismo su `Nombre completo` y `Teléfono` (con `Correo` y `Nacionalidad` opcionales con valores por defecto limpios).
3. **Sección 2: Horario de Entrada, Salida y Pago**:
   - `Fecha y Hora de Entrada (Check-In)`: Pre-llenada automáticamente con la fecha y hora actual exacta (`getCurrentLocalDateTime()`).
   - `Fecha y Hora de Salida (Check-Out)`: Con botones rápidos de 1 clic (`+1 Noche`, `+2 Noches`, `+3 Noches`, `Personalizado`) que calculan automáticamente la fecha de salida a las `12:00 PM` y el total estimado.
   - `Método de Pago` (`Efectivo`, `Tarjeta`, `Transferencia`), `Depósito / Abono` y `Observaciones`.
4. **Botón Único de Confirmación**:
   - **`Confirmar Check-In y Ocupar Habitación`** -> Envía `POST /rooms/{id}/check-in`.
   - Al responder `201 Created`, cierra el modal, actualiza instantáneamente la tarjeta de la habitación a **Ocupada** y refresca los KPIs superiores sin recargar la página.

### 4.2. Flujo B: Habitación Ocupada -> Ficha Activa y Check-Out en 1 Clic
Cuando el recepcionista selecciona una habitación ocupada, el mismo modal muestra:
1. **Detalle de Horarios y Estadía**:
   - Hora exacta de ingreso (`check_in_date`), hora programada de salida (`check_out_date`), tiempo transcurrido/restante, método de pago, depósito y qué recepcionista registró el ingreso (`registered_by`).
2. **Lista de Huéspedes Alojados en la Habitación**:
   - Nombre, documento y teléfono de cada huésped alojado.
3. **Acciones Directas**:
   - Botón principal: **`Realizar Check-Out (Entregar Habitación)`** -> Ejecuta `POST /rooms/{id}/check-out`, registra la hora real de salida y pasa la habitación a **En Limpieza (`cleaning`)** o **Disponible (`available`)**.
   - Botón secundario: **`Extender Estadía / Editar Observaciones`**.

---

## 5. Módulo de Infraestructura Física dentro de Configuración (Exclusivo `admin`)

Crear/reorganizar dentro de `src/features/configuraciones/` (o sub-rutas de configuración protegidas para `admin` / `super_admin`) el **Panel de Estructura Física del Hotel**:

1. **Pestaña 1: Edificios y Pisos (`EdificiosConfigPanel`)**:
   - Crear, editar y desactivar edificios de la sede indicando su nombre y cantidad de pisos (`floor_number`).
2. **Pestaña 2: Tipos de Cama y Tipos de Habitación (`CatalogosHabitacionConfigPanel`)**:
   - Crear/editar **Tipos de Cama** indicando `Nombre` (ej. Sencilla, Doble, Queen, King, Camarote) y **`Capacidad de personas` (`capacity_people`)**.
   - Crear/editar **Tipos de Habitación** indicando `Nombre`, `Capacidad base` y `Precio base`.
3. **Pestaña 3: Habitaciones y Camas por Habitación (`HabitacionesInventarioConfigPanel`)**:
   - Permite al administrador registrar o editar las habitaciones de cada edificio/piso, asignar su tarifa y **agregar/quitar las camas físicas de esa habitación** (ej. agregar 2 camas sencillas o 1 cama doble + 1 sencilla), calculando en vivo cuántas camas y cuántas personas caben en esa habitación y sumándolas a la capacidad total del hotel.

---

## 6. Checklist de Verificación Frontend

- [ ] **Aterrizaje directo del Recepcionista**: Al iniciar sesión como `reception`, la primera pantalla que ve es el módulo de **Habitaciones** con los KPIs superiores y todas las habitaciones de su sede.
- [ ] **KPIs Exactos en Cabecera**: Se visualizan claramente Capacidad del Hotel (personas alojadas vs capacidad total), Camas Ocupadas vs Total Camas, Habitaciones Ocupadas vs Disponibles/Limpieza, y Horas de Ingreso/Salida del día.
- [ ] **Tarjetas con Horarios y Huéspedes**: Las habitaciones ocupadas muestran en su tarjeta el nombre del huésped, cantidad de personas, hora de entrada y hora de salida.
- [ ] **Check-In Directo en 1 Modal (Sin vista Cozy intermedia)**: Al hacer clic en una habitación disponible se abre directamente el formulario de Check-In con autocompletado por documento y botones rápidos de noches (`+1 Noche`, `+2 Noches`), completando el registro sin cambiar de módulo ni abrir sub-modales.
- [ ] **Check-Out en 1 Clic**: Al hacer clic en una habitación ocupada se puede ejecutar el Check-Out inmediato y pasar la habitación a limpieza/disponible.
- [ ] **Infraestructura Exclusiva en Configuración para el Admin**: El recepcionista no ve botones para crear edificios, pisos, tipos de cama ni habitaciones; el administrador gestiona toda esa estructura desde el módulo de **Configuración**.

---

## 7. Prompt Maestro para Ejecución del Agente (Frontend)

> *"Ejecuta íntegramente el plan `d:\Nexora\nexora\prompt\plan-02-habitaciones-kpis-checkin-infraestructura-frontend.md` respetando la arquitectura definida en `src/agent.md`. Implementa en orden: (1) Redirección inicial del rol `reception` al módulo `habitacion` y separación de permisos en navegación, (2) Traslado de los formularios de creación de Edificios, Pisos, Tipos de Habitación, Tipos de Cama e Inventario de Habitaciones+Camas al módulo de Configuración exclusivo para `admin`, (3) Componente `HabitacionesKpiStrip` con métricas de capacidad del hotel, camas ocupadas, habitaciones ocupadas y flujo de entradas/salidas, (4) Enriquecimiento de `HabitacionCardItem` y tabla con datos de camas, huésped actual y horas de ingreso/salida consumiendo `GET /rooms/operational-rack`, y (5) Nuevo `HabitacionOperacionModal` directo para hacer Check-In (con búsqueda instantánea por cédula) y Check-Out sin cambiar de pantalla ni pasar por la vista Cozy. Verifica que `npm run build` compile sin errores."*
