# Plan 01 (Backend): Roles, Usuarios, Sedes, Aislamiento Multi-Sede y Auditoría Integral

> **Estado:** Aprobado para ejecución secuencial.
> **Repositorio objetivo:** `d:\Nexora\nexora-api-rest` (Go 1.25 + PostgreSQL `pgx/v5`).
> **Arquitectura base:** Hexagonal / Clean Architecture (`internal/domain`, `internal/application`, `internal/infrastructure`, `internal/api`).

---

## 1. Objetivo de Negocio y Reglas Invariantes

1. **Instalación Limpia (Bootstrap en Servidor Nuevo)**:
   - Al iniciar el servidor por primera vez sobre una base de datos vacía, el sistema debe aprovisionar automáticamente:
     - Los **6 roles base**: `super_admin` (Soporte Técnico), `admin` (Dueño del Hotel), `reception` (Operador / Recepcionista), `housekeeping` (Personal de Aseo), `manager` (Gerente de Sede) y `guest` (Huésped).
     - La **Sede Principal inicial** (`headquarters`) del hotel (configurable por variables de entorno).
     - El usuario **`super_admin`** exclusivo para el equipo de soporte técnico (`all_headquarters = true`).
     - El usuario **`admin`** inicial que se entrega al dueño del hotel para que empiece a operar y crear a sus recepcionistas.

2. **Restricción Comercial de Sedes (`headquarters`)**:
   - El sistema se comercializa para una única sede inicial. Las sedes adicionales se cotizan aparte.
   - **Únicamente el rol `super_admin`** (equipo de soporte técnico) tiene permiso para crear (`POST /headquarters`) o eliminar (`DELETE /headquarters/{id}`) sedes.
   - El rol `admin` (dueño del hotel) **NO puede crear ni eliminar sedes** (`403 Forbidden`), pero puede consultar las sedes habilitadas en su hotel y asignar a sus operadores (`reception`, `housekeeping`, `manager`) a **una sede específica**, **varias sedes**, o **"Todas las sedes" (`all_headquarters = true`)**.

3. **Aislamiento Estricto por Sede (`headquarters_id` Tenant Partitioning)**:
   - **Ninguna información puede mezclarse entre sedes.**
   - Todo registro creado en el sistema (usuarios, clientes/huéspedes `persons`, edificios, tipos de habitación, tipos de cama, habitaciones, camas, tarifas, reservas, estadías/check-in, categorías de menú, ítems de menú, solicitudes de servicio, asignaciones, acompañantes y configuraciones/paletas) debe quedar vinculado a la sede (`headquarters_id`) donde se registró.
   - Toda consulta (`GET`), creación (`POST`), modificación (`PUT`/`PATCH`) y eliminación (`DELETE`) debe filtrar y validar el `headquarters_id` activo del usuario autenticado.

4. **Trazabilidad y Auditoría Integral (Quién y Cuándo Creó, Actualizó y Eliminó)**:
   - Cada entidad del sistema debe registrar obligatoriamente los 6 campos de auditoría:
     - `created_by` (`VARCHAR(100) NOT NULL`): Identificador/email del usuario autenticado que creó el registro (extraído del JWT en el servidor, **prohibido** confiar en valores hardcodeados del frontend como `'user_system'` o `'u-123'`).
     - `created_at` (`TIMESTAMPTZ NOT NULL DEFAULT now()`): Fecha y hora exacta de creación.
     - `updated_by` (`VARCHAR(100) NULL`): Identificador/email del último usuario autenticado que modificó el registro.
     - `updated_at` (`TIMESTAMPTZ NOT NULL DEFAULT now()`): Fecha y hora exacta de la última modificación.
     - `deleted_by` (`VARCHAR(100) NULL`): Identificador/email del usuario autenticado que eliminó el registro.
     - `deleted_at` (`TIMESTAMPTZ NULL`): Fecha y hora exacta de eliminación (**Soft Delete / Borrado Lógico**).
   - **Prohibido el `DELETE FROM` físico** en entidades de negocio: toda operación `Delete` debe ejecutar un `UPDATE ... SET deleted_at = now(), deleted_by = $actor, updated_at = now(), updated_by = $actor WHERE id = $id AND deleted_at IS NULL`, y todas las consultas activas deben incluir `WHERE deleted_at IS NULL`.

---

## 2. Diseño del Modelo de Datos y Migraciones (`internal/infrastructure/persistence/postgres/migrations.go`)

### 2.1. Estructura Estándar de Auditoría (`domain.AuditMetadata`)

Crear el archivo `internal/domain/audit.go` para estandarizar los metadatos de auditoría en todas las entidades del dominio:

```go
package domain

import "time"

type AuditMetadata struct {
    CreatedBy string     `json:"created_by"`
    CreatedAt time.Time  `json:"created_at"`
    UpdatedBy *string    `json:"updated_by,omitempty"`
    UpdatedAt time.Time  `json:"updated_at"`
    DeletedBy *string    `json:"deleted_by,omitempty"`
    DeletedAt *time.Time `json:"deleted_at,omitempty"`
}
```

### 2.2. Asignación Multi-Sede para Usuarios (`users` y `users_headquarters`)

En `internal/infrastructure/persistence/postgres/migrations.go`:
1. En la tabla `users`:
   - Añadir `all_headquarters BOOLEAN NOT NULL DEFAULT FALSE`.
   - Mantener `headquarters_id VARCHAR(36) NULL REFERENCES headquarters(id)` como sede principal/por defecto.
   - Añadir columnas de auditoría faltantes: `updated_by VARCHAR(100) NULL`, `deleted_by VARCHAR(100) NULL`, `deleted_at TIMESTAMPTZ NULL`.
2. Crear la tabla pivote `users_headquarters`:
   ```sql
   CREATE TABLE IF NOT EXISTS users_headquarters (
       user_id         VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       headquarter_id  VARCHAR(36) NOT NULL REFERENCES headquarters(id) ON DELETE CASCADE,
       assigned_by     VARCHAR(100) NOT NULL DEFAULT 'system',
       assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
       PRIMARY KEY (user_id, headquarter_id)
   );
   CREATE INDEX IF NOT EXISTS idx_users_headquarters_hq ON users_headquarters(headquarter_id);
   ```

### 2.3. Matriz de Aislamiento por Sede (`headquarters_id`) y Auditoría por Tabla

Todas las tablas de PostgreSQL deben actualizar su DDL e incluir migraciones idempotentes (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`) según esta matriz:

| Tabla | Alcance de Sede (`headquarters_id`) | Restricciones de Unicidad por Sede (Con Soft-Delete) | Columnas de Auditoría a Garantizar |
| :--- | :--- | :--- | :--- |
| `roles` | Global del sistema (`NULL`) | `UNIQUE (name) WHERE deleted_at IS NULL` | `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_by`, `deleted_at` |
| `headquarters` | Raíz de Sede (`id`) | `UNIQUE (code) WHERE deleted_at IS NULL`, `UNIQUE (email) WHERE deleted_at IS NULL` | `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_by`, `deleted_at` |
| `sub_headquarters` | `headquarter_id NOT NULL` | `UNIQUE (headquarter_id, code) WHERE deleted_at IS NULL` | `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_by`, `deleted_at` |
| `users` | `all_headquarters` + `headquarters_id` + `users_headquarters` | `UNIQUE (email) WHERE deleted_at IS NULL`, `UNIQUE (username) WHERE deleted_at IS NULL` | `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_by`, `deleted_at` |
| `permission_assignments` | `headquarters_id NOT NULL` | `UNIQUE (headquarters_id, role_id, module_code) WHERE deleted_at IS NULL` | `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_by`, `deleted_at` |
| `persons` *(Clientes / Personal)* | **Añadir** `headquarters_id VARCHAR(36) NOT NULL REFERENCES headquarters(id)` | Reemplazar constraint global por `UNIQUE (headquarters_id, document_type, document_number) WHERE deleted_at IS NULL` | `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_by`, `deleted_at` |
| `palettes` *(Configuraciones)* | **Añadir** `headquarters_id VARCHAR(36) NOT NULL REFERENCES headquarters(id)` | Reemplazar `name UNIQUE` global por `UNIQUE (headquarters_id, name) WHERE deleted_at IS NULL` | `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_by`, `deleted_at` |
| `buildings` | Ya tiene `headquarters_id NOT NULL` | `UNIQUE (headquarters_id, name) WHERE deleted_at IS NULL` | Añadir `updated_by`, `deleted_by`, `deleted_at` |
| `room_types` | **Añadir** `headquarters_id VARCHAR(36) NOT NULL REFERENCES headquarters(id)` | Reemplazar `name UNIQUE` global por `UNIQUE (headquarters_id, name) WHERE deleted_at IS NULL` | Añadir `updated_by`, `deleted_by`, `deleted_at` |
| `bed_types` | **Añadir** `headquarters_id VARCHAR(36) NOT NULL REFERENCES headquarters(id)` | Reemplazar `name UNIQUE` global por `UNIQUE (headquarters_id, name) WHERE deleted_at IS NULL` | Añadir `updated_by`, `deleted_by`, `deleted_at` |
| `rooms` | Ya tiene `headquarters_id NOT NULL` | `UNIQUE (headquarters_id, number) WHERE deleted_at IS NULL` | Añadir `updated_by`, `deleted_by`, `deleted_at` |
| `beds` | **Añadir** `headquarters_id VARCHAR(36) NOT NULL REFERENCES headquarters(id)` | `UNIQUE (room_id, code) WHERE deleted_at IS NULL` | Añadir `updated_by`, `deleted_by`, `deleted_at` |
| `rates` | Ya tiene `headquarter_id NOT NULL` | `UNIQUE (headquarter_id, name) WHERE deleted_at IS NULL` | Añadir `updated_by`, `deleted_by`, `deleted_at` |
| `room_tariffs` | **Añadir** `headquarters_id VARCHAR(36) NOT NULL REFERENCES headquarters(id)` | Índices por `(headquarters_id, room_id)` | Añadir `updated_by`, `deleted_by`, `deleted_at` |
| `reserves` *(Reservas)* | **Añadir** `headquarters_id VARCHAR(36) NOT NULL REFERENCES headquarters(id)` | Índice `idx_reserves_hq_dates (headquarters_id, check_in_date, check_out_date)` | Añadir `updated_by`, `deleted_by`, `deleted_at` |
| `stays` *(Recepción / Estadías)* | **Añadir** `headquarters_id VARCHAR(36) NOT NULL REFERENCES headquarters(id)` | Índice `idx_stays_hq_status (headquarters_id, status)` | Añadir `updated_by`, `deleted_by`, `deleted_at` |
| `menu_categories` | Ya tiene `headquarters_id NOT NULL` | `UNIQUE (headquarters_id, name) WHERE deleted_at IS NULL` | Añadir `updated_by`, `deleted_by`, `deleted_at` |
| `item_menus` | **Añadir** `headquarters_id VARCHAR(36) NOT NULL REFERENCES headquarters(id)` | `UNIQUE (category_id, name) WHERE deleted_at IS NULL` | Añadir `updated_by`, `deleted_by`, `deleted_at` |
| `service_requests` | **Añadir** `headquarters_id VARCHAR(36) NOT NULL REFERENCES headquarters(id)` | Índice `idx_service_requests_hq (headquarters_id, status)` | Añadir `updated_by`, `deleted_by`, `deleted_at` |
| `service_assignments` | **Añadir** `headquarters_id VARCHAR(36) NOT NULL REFERENCES headquarters(id)` | Índice `idx_service_assignments_hq (headquarters_id)` | Añadir `created_by`, `updated_by`, `deleted_by`, `deleted_at` |
| `guest_attendants` | **Añadir** `headquarters_id VARCHAR(36) NOT NULL REFERENCES headquarters(id)` | Índice `idx_guest_attendants_hq (headquarters_id)` | Añadir `created_by`, `updated_by`, `deleted_by`, `deleted_at` |

---

## 3. Bootstrap Seeder para Servidor Nuevo (`internal/infrastructure/persistence/postgres/seeder.go`)

Crear `internal/infrastructure/persistence/postgres/seeder.go` e invocarlo en [`internal/app/app.go`](file:///d:/Nexora/nexora-api-rest/internal/app/app.go) inmediatamente después de `postgres.RunMigrations(ctx, pool)`.

### 3.1. Variables de Entorno en `internal/infrastructure/config/config.go`
Añadir a `Config`:
- `BootstrapSuperAdminEmail` (`BOOTSTRAP_SUPERADMIN_EMAIL`, default `"soporte@nexora.com"`)
- `BootstrapSuperAdminPassword` (`BOOTSTRAP_SUPERADMIN_PASSWORD`, default `"SoporteNexora2026*"`)
- `BootstrapAdminEmail` (`BOOTSTRAP_ADMIN_EMAIL`, default `"admin@hotel.com"`)
- `BootstrapAdminPassword` (`BOOTSTRAP_ADMIN_PASSWORD`, default `"AdminHotel2026*"`)
- `BootstrapHeadquarterName` (`BOOTSTRAP_HQ_NAME`, default `"Sede Principal"`)
- `BootstrapHeadquarterCode` (`BOOTSTRAP_HQ_CODE`, default `"HQ-001"`)

### 3.2. Secuencia Idempotente del Seeder (en Transacción SQL)
1. **Semilla de Roles Base**:
   - Insertar `super_admin`, `admin`, `reception`, `housekeeping`, `manager`, `guest` con `ON CONFLICT (name) DO NOTHING` y `created_by = 'system_bootstrap'`.
2. **Semilla de Sede Principal**:
   - Si `SELECT COUNT(*) FROM headquarters WHERE deleted_at IS NULL` es `0`, crear la sede inicial con `BootstrapHeadquarterName` y `BootstrapHeadquarterCode`, `status = 'active'`, `created_by = 'system_bootstrap'`.
3. **Semilla de Usuario `super_admin` (Soporte Técnico)**:
   - Si no existe un usuario con rol `super_admin`, crear su registro en `persons` (asociado a la sede inicial), crear el usuario con `all_headquarters = true`, `headquarters_id = initialHQ.ID`, contraseña hasheada con `BcryptPasswordHasher`, y `created_by = 'system_bootstrap'`.
4. **Semilla de Usuario `admin` (Dueño del Hotel)**:
   - Si no existe un usuario con rol `admin`, crear su registro en `persons` (asociado a la sede inicial), crear el usuario con `all_headquarters = true`, `headquarters_id = initialHQ.ID`, vincularlo en `users_headquarters`, y `created_by = 'system_bootstrap'`.
5. **Semilla de Matriz de Permisos (`permission_assignments`)**:
   - Poblar los permisos por defecto para la sede inicial distinguiendo claramente:
     - `super_admin`: acceso total + creación/eliminación de sedes (`sedes:create`, `sedes:delete`).
     - `admin`: acceso completo de gestión del hotel (`usuarios`, `habitaciones`, `reservas`, `recepcion`, `tarifas`, `clientes`, `servicios`, `configuracion`), lectura/edición básica de sus sedes (`sedes:view`), pero **sin** creación ni eliminación de sedes.
     - `reception`: operación diaria (`dashboard`, `reservas`, `recepcion`, `habitaciones:view`, `clientes`, `servicios`), sin acceso a crear usuarios ni sedes.

---

## 4. Contexto de Autenticación, Autorización (RBAC) y Aislamiento de Sede (Middleware HTTP)

### 4.1. Actor de Contexto (`internal/domain/actor.go`)
Definir la estructura `Actor` que viaja en `context.Context` en cada request HTTP autenticado:

```go
package domain

type Actor struct {
    UserID                 UserID
    Email                  string
    Username               string
    RoleID                 RoleID
    RoleName               string // "super_admin", "admin", "reception", etc.
    AllHeadquarters        bool
    PrimaryHeadquarterID   *HeadquarterID
    AllowedHeadquartersIDs []HeadquarterID
    ActiveHeadquarterID    HeadquarterID // Sede activa seleccionada en la sesión/request
}
```

Funciones helper en `internal/domain/actor.go`:
- `WithActor(ctx context.Context, actor Actor) context.Context`
- `ActorFromContext(ctx context.Context) (Actor, bool)`
- `MustActorID(ctx context.Context) string` (retorna `actor.Email` o `string(actor.UserID)` para poblar `created_by`, `updated_by`, `deleted_by`).
- `(a Actor) CanAccessHeadquarter(hqID HeadquarterID) bool`: retorna `true` si `a.RoleName == "super_admin"` o `a.AllHeadquarters == true` o si `hqID` está en `a.AllowedHeadquartersIDs`.

### 4.2. Enriquecimiento de `POST /login` y JWT (`internal/application/auth/login.go` y `internal/infrastructure/auth/token.go`)
1. Actualizar `JWTTokenGenerator` para incluir en los claims del JWT:
   - `sub`: `user.ID`
   - `email`: `user.Email`
   - `role_id`: `user.RoleID`
   - `role_name`: `role.Name`
   - `all_hq`: `user.AllHeadquarters`
   - `hq_ids`: lista de IDs de sedes permitidas (`[]string`)
2. Actualizar `LoginOutput` en [`internal/application/auth/login.go`](file:///d:/Nexora/nexora-api-rest/internal/application/auth/login.go) y `loginResponse` en [`internal/api/auth/login.go`](file:///d:/Nexora/nexora-api-rest/internal/api/auth/login.go) para devolver el perfil completo al hacer login:
   ```json
   {
     "token": "eyJhbG...",
     "user": {
       "id": "uuid",
       "username": "admin",
       "email": "admin@hotel.com",
       "role_id": "uuid",
       "role_name": "admin",
       "all_headquarters": true,
       "headquarters_id": "hq-uuid-1",
       "headquarters_ids": ["hq-uuid-1"],
       "allowed_headquarters": [
         { "id": "hq-uuid-1", "name": "Sede Principal", "code": "HQ-001" }
       ]
     }
   }
   ```
3. Crear endpoint `GET /auth/me` para reconstruir o refrescar la sesión del usuario autenticado y sus sedes habilitadas.

### 4.3. Middleware de Autenticación y Sede Activa (`internal/api/middleware/auth.go`)
1. **`Authenticate` Middleware**:
   - Lee `Authorization: Bearer <token>`, valida firma y expiración del JWT.
   - Lee la cabecera `X-Headquarter-ID` (o query param `headquarters_id`).
   - Si se envía `X-Headquarter-ID`, verifica que `actor.CanAccessHeadquarter(hqID)` sea `true`; si no tiene permiso sobre esa sede, responde inmediatamente `403 Forbidden` (`ErrHeadquarterAccessDenied`).
   - Si no se envía `X-Headquarter-ID` y el usuario tiene una única sede asignada (o `PrimaryHeadquarterID`), la asigna como `ActiveHeadquarterID`.
   - Inyecta `domain.Actor` en `r.Context()`.
2. **`RequireRoles(roles ...string)` Middleware**:
   - Protege rutas por rol en [`internal/api/router.go`](file:///d:/Nexora/nexora-api-rest/internal/api/router.go):
     - `POST /headquarters` y `DELETE /headquarters/{id}` -> `RequireRoles("super_admin")`.
     - `POST /users`, `PUT /users/{id}`, `DELETE /users/{id}` -> `RequireRoles("super_admin", "admin")`.

---

## 5. Reglas de Creación de Usuarios y Asignación de Sedes (`internal/application/user/create.go`)

Actualizar el caso de uso de creación y actualización de usuarios (`CreateService` / `UpdateService`):

1. **Jerarquía de Creación de Roles**:
   - Un usuario con rol `admin` **no puede** crear ni asignar el rol `super_admin` (`ErrCannotAssignSuperAdminRole` -> `403 Forbidden`).
   - Un usuario con rol `admin` puede crear usuarios con rol `reception`, `housekeeping`, `manager`, `guest` o `admin`.
2. **Asignación de Sedes al Crear/Editar un Recepcionista (`reception`) u Operador**:
   - El payload de `POST /users` y `PUT /users/{id}` aceptará:
     - `all_headquarters` (`bool`): indica si el recepcionista puede operar en todas las sedes del hotel.
     - `headquarters_id` (`*string`): sede principal por defecto.
     - `headquarters_ids` (`[]string`): lista de sedes específicas donde puede trabajar.
   - **Validación**:
     - Si `all_headquarters == false`, `headquarters_ids` debe tener al menos 1 sede válida (o usar `headquarters_id`).
     - Todas las sedes enviadas en `headquarters_ids` deben existir en la tabla `headquarters` (`deleted_at IS NULL`) y el creador (`actor`) debe tener acceso a ellas.
     - El campo `created_by` del nuevo usuario y de su registro `persons` asociado se toma obligatoriamente de `actor.Email` / `actor.UserID` en el contexto.

---

## 6. Aplicación del Aislamiento por Sede y Auditoría en Todos los Repositorios y Casos de Uso

### 6.1. Reglas de Escritura (`Save` / `Create`)
- En todos los casos de uso (`CreateUser`, `CreatePerson`, `CreateRoom`, `CreateReserve`, `CreateStay`, `CreateRate`, `CreateBuilding`, `CreatePalette`, `CreateMenuCategory`, `CreateItemMenu`, `CreateServiceRequest`, etc.):
  1. `entity.HeadquartersID` se resuelve desde `actor.ActiveHeadquarterID` (o el `headquarters_id` enviado en el body, validando siempre `actor.CanAccessHeadquarter(entity.HeadquartersID)`).
  2. `entity.CreatedBy` se asigna desde `domain.MustActorID(ctx)` (ignorando o sobreescribiendo cualquier valor falso enviado desde el cliente).
  3. **Validación Cross-Sede en Relaciones**:
     - Al crear una `Reserve` o `Stay`: verificar que la habitación (`room_id`) y los huéspedes (`person_id` / `person_ids`) pertenezcan al **mismo `headquarters_id`** de la reserva/estadía. Si pertenecen a otra sede, rechazar con `409 Conflict` / `403 Forbidden`.
     - Al crear una `Room`: verificar que `building_id` y `room_type_id` pertenezcan al mismo `headquarters_id`.
     - Al crear un `RoomTariff`: verificar que `room_id` y `rate_id` pertenezcan al mismo `headquarters_id`.

### 6.2. Reglas de Lectura (`FindAll` / `FindByID`)
- Todo método `FindAll(ctx)` en los repositorios de PostgreSQL debe:
  1. Incluir `WHERE deleted_at IS NULL`.
  2. Filtrar por la sede activa en el contexto (`AND headquarters_id = $activeHQ`), o si el administrador solicita consolidado de sus sedes autorizadas, filtrar por `AND headquarters_id = ANY($allowedHQs)`. Un usuario nunca puede leer registros de una sede a la que no está asignado.
- Todo método `FindByID(ctx, id)` debe:
  1. Incluir `WHERE id = $1 AND deleted_at IS NULL`.
  2. Validar que el registro pertenezca a una sede permitida para el `actor` en contexto.

### 6.3. Reglas de Actualización (`Update`) y Eliminación (`Delete` -> Soft Delete)
- Todo método `Update(ctx, entity)` debe:
  1. Tomar `updated_by` desde `domain.MustActorID(ctx)`.
  2. Ejecutar `UPDATE <table> SET ..., updated_by = $n, updated_at = now() WHERE id = $1 AND deleted_at IS NULL`.
- Todo método `Delete(ctx, id)` debe:
  1. Tomar `deleted_by` desde `domain.MustActorID(ctx)`.
  2. Ejecutar `UPDATE <table> SET deleted_by = $2, deleted_at = now(), updated_by = $2, updated_at = now() WHERE id = $1 AND deleted_at IS NULL`.

---

## 7. Checklist de Verificación y Pruebas Automatizadas

- [ ] **Test de Bootstrap (`seeder_test.go`)**: Verificar en base de datos limpia que se crean los 6 roles, la sede inicial, el usuario `super_admin` y el usuario `admin`, y que re-ejecutar el seeder es 100% idempotente.
- [ ] **Test de Restricción de Sedes (`headquarter_rbac_test.go`)**: Verificar que un token de `admin` o `reception` recibe `403 Forbidden` al intentar `POST /headquarters` o `DELETE /headquarters/{id}`, mientras que `super_admin` recibe `201 Created` / `204 No Content`.
- [ ] **Test de Creación de Recepcionista Multi-Sede (`user_headquarters_test.go`)**: Verificar que `admin` puede crear un usuario `reception` asignado a una sede, múltiples sedes o `all_headquarters = true`, y que no puede crear un usuario `super_admin`.
- [ ] **Test de Aislamiento Estricto entre Sedes (`tenant_isolation_test.go`)**:
  - Crear Sede A y Sede B.
  - Registrar un cliente (`person`), una habitación (`room`), una reserva (`reserve`), una estadía (`stay`) y una paleta (`palette`) en la Sede A.
  - Autenticarse con un usuario operando en la Sede B (o enviando `X-Headquarter-ID: <Sede B>`) y verificar que `GET /persons`, `GET /rooms`, `GET /reserves`, `GET /stays`, `GET /palettes` **no devuelven ningún registro de la Sede A**, y que `GET /persons/{id_sede_A}` devuelve `404`/`403`.
  - Verificar que dos sedes distintas pueden tener un cliente con el mismo documento o una habitación con el mismo número (`101`) sin colisión de clave única.
- [ ] **Test de Auditoría Completa y Soft Delete (`audit_soft_delete_test.go`)**:
  - Crear un registro con el Usuario A -> verificar `created_by = Usuario A` y `created_at != nil`.
  - Actualizar el registro con el Usuario B -> verificar `updated_by = Usuario B` y `updated_at > created_at`.
  - Eliminar el registro con el Usuario C (`DELETE`) -> verificar que `GET` ya no lo lista (`404`), pero al consultar la fila en PostgreSQL sigue existiendo con `deleted_by = Usuario C` y `deleted_at != nil`.

---

## 8. Prompt Maestro para Ejecución del Agente (Backend)

> Copia o referencia este archivo cuando indiques al agente que ejecute la implementación del Plan 01 en `nexora-api-rest`:
>
> *"Ejecuta íntegramente el plan `d:\Nexora\nexora-api-rest\prompt\plan-01-roles-sedes-aislamiento-auditoria-backend.md` respetando la arquitectura hexagonal definida en `d:\Nexora\nexora-api-rest\SKILL.md`. Implementa en orden: (1) `domain.AuditMetadata` y `domain.Actor`, (2) Migraciones SQL de `users_headquarters`, `headquarters_id` en todas las tablas y columnas `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_by`, `deleted_at` con Soft Delete, (3) Bootstrap Seeder para instalación limpia (`super_admin`, `admin`, sede inicial y roles), (4) JWT enriquecido + Middleware HTTP de autenticación, RBAC y aislamiento por `X-Headquarter-ID`, (5) Casos de uso de creación de usuarios multi-sede y restricción de creación de sedes solo a `super_admin`, y (6) Filtrado por `headquarters_id` y auditoría en todos los repositorios y handlers. Ejecuta `go test ./...` al finalizar cada bloque."*
