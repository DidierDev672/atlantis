# Nexora

**Plataforma Web Integral para la Gestión y Operación Hotelera**

---

## 1. Descripción

**Nexora** es una plataforma web moderna diseñada para centralizar, automatizar y optimizar las operaciones de recepción, administración de inventario físico, reservas, estadías (*check-in* / *check-out*), tarifas, servicio a la habitación (*room service*) y auditoría operativa de establecimientos hoteleros.

La plataforma permite al personal de recepción y administración consultar en tiempo real el estado de cada habitación, registrar huéspedes y acompañantes, gestionar reservas individuales o grupales, controlar el ciclo completo de hospedaje, despachar pedidos a la habitación y auditar la trazabilidad de todas las operaciones por sede.

Nexora está construida sobre una arquitectura desacoplada que utiliza **React 19 + TypeScript + Tailwind CSS v4** en el frontend y **Go (Golang) + PostgreSQL** en el backend, aplicando **Vertical Slicing**, **Arquitectura Hexagonal (Puertos y Adaptadores)**, **Atomic Design** y los principios **SOLID**.

---

## 2. Objetivo General

Desarrollar una plataforma web integral para la gestión hotelera que permita administrar las operaciones de recepción, el inventario multicapa de infraestructura (sedes, edificios, habitaciones y camas), la tarificación dinámica, los servicios al huésped y el control de accesos mediante una interfaz interactiva e intuitiva, respaldada por servicios de backend seguros, resilientes y escalables.

---

## 3. Objetivos Específicos

- Centralizar la información de las habitaciones, camas y sus estados operativos en tiempo real.
- Facilitar el registro, búsqueda por documento y gestión del directorio de huéspedes y personal.
- Gestionar reservas con soporte para múltiples huéspedes (`person_ids`) y asignación flexible de habitaciones.
- Controlar los procesos de entrada (*check-in* directo o desde reserva) y salida (*check-out*) mediante el registro de estadías (`/stay`).
- Identificar visualmente habitaciones disponibles (`free`), ocupadas (`occupied`), reservadas (`reserved`), en limpieza (`cleaning`) o en mantenimiento (`maintenance`).
- Administrar tarifas dinámicas por modalidad (por noche, por hora, promocionales, por días de la semana) y vincularlas al inventario de habitaciones.
- Gestionar el catálogo gastronómico/servicios y el ciclo de vida de solicitudes de servicio a la habitación (*room service*).
- Garantizar la seguridad mediante autenticación JWT, control de acceso basado en roles (RBAC), permisos granulares por módulo/recurso y límites operativos por rol y usuario.
- Auditar en tiempo real brechas operativas (habitaciones sin tarifa asignada, tarifas inactivas en uso, distribución de estados y trazabilidad de cambios).

---

## 4. Módulos Principales del Sistema

### 4.1 Recepción y Estadías (*Check-in* / *Check-out*)

Punto neurálgico de operación diaria para el personal de recepción:

- **Panel de control de recepción**: Vista consolidada de ocupación y movimientos del día.
- **Check-in directo (*Walk-in*) o con reserva**: Registro de estadías asociando directamente la habitación (`room_id`) y la lista de huéspedes (`person_ids`) sin obligar a una reserva previa.
- **Gestión de pagos y garantías**: Control de método de pago (`cash`, `card`, `bank transfer`), depósito de seguridad (`security_deposit`) y observaciones operativas.
- **Consulta de huéspedes por estadía**: Visualización de todos los ocupantes vinculados a una habitación activa (`/stay/reception/{room_id}` y `/stays_person/{stay_id}`).
- **Ciclo de vida de la estadía**: Estados en progreso (`progress`), completada (`completed`) y cancelada (`canceled`).

### 4.2 Gestión de Habitaciones e Inventario Físico

Administración detallada de la infraestructura física del hotel organizada jerárquicamente:

- **Sedes y Sub-sedes (`Headquarters` / `Sub-headquarters`)**: Soporte multi-sede con filtrado contextual automático por sede activa.
- **Edificios y Bloques (`Buildings`)**: Agrupación física de pisos y áreas del establecimiento.
- **Tipos de Habitación (`Room Types`)**: Categorización comercial y capacidad sugerida.
- **Habitaciones (`Rooms`)**:
  - Número o código identificador con sugerencia automática de correlativo (`/room/next-number`).
  - Piso, edificio, tipo de habitación y capacidad máxima.
  - Estado operativo diferenciado (`free`, `occupied`, `reserved`, `cleaning`, `maintenance`).
  - Características, equipamiento y observaciones.
- **Camas y Tipos de Cama (`Beds` / `Bed Types`)**:
  - Inventario individual de camas por habitación y visualización interactiva en 3D (`cama3d`).

### 4.3 Gestión de Reservas

Control de reservaciones anticipadas y planificación de ocupación:

- **Registro de reservas multi-huésped**: Soporte nativo para múltiples personas por reserva mediante un arreglo de identificadores (`person_ids`) persistido en tabla pivote N:N (`reserves_persons`).
- **Reserva sin bloqueo prematuro de habitación**: Permite crear reservas definiendo fechas de entrada/salida, cantidad de huéspedes y tarifa acordada, asignando la habitación física en el momento de la recepción.
- **Estados de reserva**: Seguimiento de reservas activas, confirmadas, en espera o canceladas.

### 4.4 Directorio de Personas y Huéspedes

Gestión unificada de clientes, huéspedes, acompañantes y personal:

- **Datos de identidad**: Tipo de documento (`DNI`, `PASSPORT`, `CE`, `RUC`), número de documento, nombre completo, fecha de nacimiento, género y nacionalidad.
- **Búsqueda instantánea por documento**: Endpoint especializado (`/persons/by-document`) para autocompletar datos del huésped durante el *check-in* o la reserva.
- **Asignación de roles por persona**: Vínculo con perfiles dentro del ecosistema del hotel.

### 4.5 Tarifas y Asignación Tarifaria (`Rates` & `Room Tariffs`)

Motor flexible para la configuración comercial de precios:

- **Modalidades de tarifa**: Por noche, por horas, bloques horarios o días específicos de la semana (`days_of_week`, `start_time`, `duration_units`).
- **Vinculación Habitación-Tarifa (`Room Tariffs`)**: Permite asociar múltiples tarifas a cada habitación y activar o desactivar esquemas tarifarios según temporada.

### 4.6 Servicio a la Habitación (*Room Service*)

Módulo completo para la atención gastronómica y de servicios adicionales durante la estadía:

- **Categorías e Ítems de Menú (`Menu Categories` / `Item Menu`)**: Administración de la carta de productos, precios base, impuestos y disponibilidad.
- **Solicitudes de Servicio (`/service-request`)**:
  - Creación de pedidos vinculados directamente a la estadía (`stay_id`) y al huésped (`person_id`) con numeración automática (`SR-<timestamp>-<rand>`).
  - Múltiples canales de origen: tablet en habitación (`room_tablet`), app móvil (`mobile_app`), teléfono (`phone`), recepción (`front_desk`) o código QR (`qr_code`).
  - Cálculo automático en servidor de `subtotal`, `taxes` (impuestos por línea), `tip` (propina) y `total`.
  - Bitácora inmutable de estados (`pending` → `confirmed` → `in_preparation` → `delivering` → `delivered` / `canceled`) y calificación del servicio (`grade` de 1 a 5).
- **Asignación de Personal de Atención (`Service Assignments` & `Guest Attendants`)**: Control del personal encargado de preparar y entregar cada solicitud.

### 4.7 Auditoría Operativa y Dashboard

Supervisión gerencial y detección preventiva de inconsistencias:

- **Resumen ejecutivo (`/audit/summary`)**: Indicadores clave (KPIs) de habitaciones, tarifas y ocupación.
- **Detección de brechas operativas**:
  - Habitaciones sin tarifa asignada (`/audit/rooms-without-tariff`).
  - Tarifas inactivas que continúan vinculadas a habitaciones operativas (`/audit/inactive-tariffs-in-use`).
  - Distribución de habitaciones por estado (`/audit/rooms-by-status`).
- **Trazabilidad por actor**: Registro automático de auditoría (`created_by`, `updated_by`, `deleted_by`) y borrado lógico (*soft delete*).

### 4.8 Seguridad, Roles, Permisos y Límites

Arquitectura de control de acceso multicapa:

- **Autenticación JWT (`/login`, `/auth/me`)**: Sesiones firmadas con contraseñas cifradas mediante `bcrypt`.
- **RBAC y Permisos por Recurso (`Modules`, `Resources`, `Role Permissions`, `Permission Assignments`)**: Control granular de qué acciones puede ejecutar cada rol o usuario sobre cada módulo del sistema.
- **Límites Operativos (`Role Limits` / `User Limits`)**: Cuotas configurables por rol o usuario.

### 4.9 Sistema de Diseño Cósmico y Tematización (`Palettes` & Planetas)

Interfaz visual con soporte para modo claro/oscuro, paletas personalizables y componentes interactivos inspirados en el sistema solar:

- **Alertas Planetarias Reutilizables (`PlanetAlert`)**: Construidas bajo **Atomic Design** en `src/shared/alert`:
  - **Tierra (`Success`)**: Confirmaciones y operaciones exitosas.
  - **Júpiter (`Warning`)**: Advertencias operativas y estados preventivos.
  - **Neptuno (`Info`)**: Información contextual y avisos del sistema.
  - **Marte (`Danger` / `Error`)**: Errores de validación y diagnósticos detallados de endpoints HTTP (400, 422, 500).

---

## 5. Arquitectura del Software

### 5.1 Backend (`nexora-api-rest`) — Go + Arquitectura Hexagonal

El servidor HTTP está implementado en **Go 1.23+** utilizando el enrutador nativo `net/http.ServeMux` y `pgx/v5` para PostgreSQL, estructurado en **Vertical Slices** con **Arquitectura Hexagonal (Puertos y Adaptadores)**:

1. **`domain` (Núcleo de Negocio)**: Entidades puras (`Stay`, `Reserve`, `Room`, `Person`, `Rate`, `ServiceRequest`), objetos de valor, invariantes de validación y contratos de repositorios (puertos secundarios). Cero dependencias externas.
2. **`application` (Casos de Uso)**: Orquestación de reglas de negocio (`CreateStayUseCase`, `CreateReserveUseCase`, etc.) aplicando el principio de Responsabilidad Única (SRP) e Inversión de Dependencias (DIP).
3. **`infrastructure` (Adaptadores Secundarios)**: Implementaciones concretas de persistencia en PostgreSQL con aprovisionamiento e inicialización idempotente de tablas (`EnsureTable`), generación de identificadores criptográficos, hashing `bcrypt` y emisión de tokens JWT.
4. **`api` / `handler` (Adaptadores Primarios HTTP)**: Controladores REST, serialización JSON, middlewares de autenticación/CORS y mapeo estricto de errores de dominio a códigos de estado HTTP (`400`, `401`, `404`, `422`, `500`).

### 5.2 Frontend (`nexora`) — React + Vertical Slicing + Atomic Design

La aplicación cliente está organizada por módulos de negocio en `src/features/` y componentes transversales en `src/shared/`:

- **Vertical Slicing por Funcionalidad**: Cada módulo (`habitaciones`, `recepciones`, `reservas`, `personas`, `tarifas`, `servicio-habitaciones`, `auditoria`, `sedes`, `edificios`, `usuarios`, `roles`, `recursos`) encapsula sus propias capas:
  - `domain/`: Modelos, tipos e interfaces de repositorio.
  - `application/`: Custom hooks y casos de uso de interfaz.
  - `infrastructure/`: Clientes HTTP Axios y adaptadores de datos.
  - `ui/`: Vistas y componentes estructurados con **Atomic Design** (`atoms/`, `molecules/`, `organisms/`).

---

## 6. Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | React 19, TypeScript 6, Vite 8, Tailwind CSS v4, Motion (Framer Motion), Three.js (`@react-three/fiber`, `@react-three/drei`), Zustand, Axios, FontAwesome |
| **Backend** | Go (Golang) 1.23+, `net/http` stdlib router, `jackc/pgx/v5` (`pgxpool`), JWT (`golang-jwt`), `bcrypt` |
| **Base de Datos** | PostgreSQL (con migraciones automáticas e idempotentes y tablas relacionales N:N) |

---

## 7. Estructura del Proyecto

```text
Nexora/
├── nexora-api-rest/                 # Backend API REST en Go
│   ├── cmd/api/main.go              # Punto de entrada del servidor (:8080)
│   └── internal/
│       ├── app/                     # Inicialización de base de datos, migraciones y servidor
│       ├── api/                     # Adaptadores HTTP, router principal y middlewares
│       ├── application/             # Casos de uso por vertical slice
│       ├── domain/                  # Entidades de negocio, errores centinela y puertos
│       ├── infrastructure/          # Repositorios PostgreSQL, JWT, bcrypt, configuración
│       ├── servicerequest/          # Vertical slice de órdenes de servicio a la habitación
│       ├── serviceassignment/       # Vertical slice de asignaciones de servicio
│       ├── itemmenu/                # Vertical slice de carta y productos
│       ├── menucategory/            # Vertical slice de categorías de menú
│       ├── guestattendant/          # Vertical slice de personal de atención
│       ├── rolelimit/               # Vertical slice de límites por rol
│       └── userlimit/               # Vertical slice de límites por usuario
│
├── nexora/                          # Frontend Web en React + TypeScript + Vite
│   └── src/
│       ├── features/                # Módulos de negocio (Vertical Slices)
│       │   ├── auditoria/
│       │   ├── cama3d/
│       │   ├── configuraciones/
│       │   ├── dashboard/
│       │   ├── edificios/
│       │   ├── habitaciones/
│       │   ├── login/
│       │   ├── personas/
│       │   ├── recepciones/
│       │   ├── recursos/
│       │   ├── reservas/
│       │   ├── roles/
│       │   ├── sedes/
│       │   ├── servicio-habitaciones/
│       │   ├── tarifas/
│       │   ├── tema/
│       │   └── usuarios/
│       └── shared/                  # Componentes reutilizables (Atomic Design)
│           ├── alert/               # Sistema de alertas planetarias (Tierra, Júpiter, Neptuno, Marte)
│           ├── date-picker/         # Selector de fechas interactivo
│           ├── loading/             # Indicadores de carga animados
│           ├── ui/                  # Inputs, Textarea, InfiniteScroll, ResourceCard
│           └── *-planet/            # Globos y paletas cósmicas interactivas
└── README.md                        # Documentación general del proyecto
```

---

## 8. Principales Endpoints de la API REST

| Módulo | Rutas Principales | Métodos Soportados |
| :--- | :--- | :--- |
| **Autenticación** | `/login`, `/auth/me` | `POST`, `GET` |
| **Estadías (Recepción)** | `/stay`, `/stays`, `/stay/reception/{room_id}`, `/stays_person/{stay_id}` | `GET`, `POST`, `PUT`, `DELETE` |
| **Reservas** | `/reserve`, `/reserve/{id}` | `GET`, `POST`, `PUT`, `DELETE` |
| **Habitaciones** | `/room`, `/room/{id}`, `/room/next-number`, `/room/{id}/reception` | `GET`, `POST`, `PUT`, `DELETE` |
| **Tipos de Habitación** | `/room-types`, `/room-types/{id}` | `GET`, `POST`, `PUT`, `DELETE` |
| **Camas y Tipos** | `/beds`, `/beds/{id}`, `/types-bed`, `/types-bed/{id}` | `GET`, `POST`, `PUT`, `DELETE` |
| **Personas / Huéspedes** | `/persons`, `/persons/{id}`, `/persons/by-document` | `GET`, `POST`, `PUT`, `DELETE` |
| **Tarifas** | `/rates`, `/rates/{id}`, `/room_tariffs`, `/room_tariffs/by-room/{room_id}` | `GET`, `POST`, `PUT`, `DELETE` |
| **Room Service** | `/service-request`, `/menu-category`, `/item-menu`, `/service-assignments` | `GET`, `POST`, `PUT`, `DELETE` |
| **Infraestructura** | `/headquarters`, `/sub-headquarters`, `/building` | `GET`, `POST`, `PUT`, `DELETE` |
| **Seguridad y Accesos** | `/users`, `/roles`, `/module`, `/resource`, `/role-permission`, `/user-limits` | `GET`, `POST`, `PUT`, `DELETE` |
| **Auditoría** | `/audit/summary`, `/audit/rooms`, `/audit/rates`, `/audit/rooms-without-tariff` | `GET` |

---

## 9. Configuración y Ejecución Local

### 9.1 Requisitos Previos

- **Go** `>= 1.23`
- **Node.js** `>= 20` y **npm**
- **PostgreSQL** `>= 14`

### 9.2 Ejecutar el Backend (`nexora-api-rest`)

1. Configurar las variables de entorno en `nexora-api-rest/.env` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`).
   *(Si la base de datos no existe en PostgreSQL, Nexora la creará y ejecutará las migraciones y semillas iniciales automáticamente al iniciar).*
2. Iniciar el servidor:

```bash
cd nexora-api-rest
go run ./cmd/api
```

El servidor quedará escuchando en `http://localhost:8080`.

3. Ejecutar pruebas unitarias del backend:

```bash
cd nexora-api-rest
go test ./...
```

### 9.3 Ejecutar el Frontend (`nexora`)

1. Instalar dependencias e iniciar el servidor de desarrollo Vite:

```bash
cd nexora
npm install
npm run dev
```

2. Compilar para producción:

```bash
cd nexora
npm run build
```
