# Plan 02 (Backend): Módulo Operativo de Habitaciones, KPIs en Tiempo Real, Check-In/Check-Out Directo e Infraestructura Física

> **Estado:** Aprobado para ejecución secuencial (posterior al Plan 01).
> **Repositorio objetivo:** `d:\Nexora\nexora-api-rest` (Go 1.25 + PostgreSQL `pgx/v5`).
> **Arquitectura base:** Hexagonal / Clean Architecture (`internal/domain`, `internal/application`, `internal/infrastructure`, `internal/api`).

---

## 1. Objetivo de Negocio y Reglas Invariantes

1. **Separación Estricta entre Configuración de Infraestructura (Solo `admin` / `super_admin`) y Operación de Habitaciones (`reception` / `admin`)**:
   - **Infraestructura Física del Hotel**: La creación, actualización y baja lógica de Edificios (`building`), Tipos de Habitación (`room-types`), Tipos de Cama (`types-bed`), Habitaciones (`room`), Camas por Habitación (`beds`) y Tarifas (`rates`, `room_tariffs`) es **exclusiva del rol `admin` (y `super_admin`)**.
   - El rol `reception` (Recepcionista) tiene **prohibido (`403 Forbidden`)** crear, editar estructura o eliminar edificios, pisos, tipos de habitación, habitaciones o camas. Su rol sobre las habitaciones es 100% operativo: consultar el Rack en vivo, registrar el ingreso de huéspedes (**Check-In**), gestionar la estancia activa, dar salida (**Check-Out**) y cambiar el estado operativo de limpieza (`cleaning` -> `available`).

2. **Creación Integral de Habitación con sus Camas por el Administrador**:
   - Al crear o actualizar una habitación (`POST /room`, `PUT /room/{id}`), el administrador debe poder definir directamente la lista de camas físicas (`beds`) que contiene esa habitación (con su etiqueta/código y su `bed_type_id`), o gestionarlas en el mismo flujo transaccional, para que la capacidad total de camas y personas de la habitación sea siempre exacta.

3. **Endpoint Consolidado de Rack Operativo + KPIs en Tiempo Real (`GET /rooms/operational-rack`)**:
   - Elimina el problema `N+1` del frontend. En una sola llamada filtrada por la **Sede Activa (`headquarters_id`)**, devuelve:
     - **KPIs Globales de la Sede Activa (`kpis`)**:
       - `total_rooms`, `occupied_rooms`, `available_rooms`, `cleaning_rooms`, `maintenance_rooms`, `occupancy_rate_percent`.
       - `total_beds` (total de camas físicas activas en la sede), `occupied_beds` (camas en habitaciones ocupadas / asignadas a huéspedes activos), `available_beds`.
       - `total_capacity_guests` (capacidad máxima de personas del hotel sumando la capacidad de las camas/habitaciones de la sede) vs `current_guests_hosted` (total de huéspedes actualmente alojados en estancias con `status = 'progress'`).
       - `check_ins_today` (ingresos realizados hoy), `check_outs_today` (salidas programadas o completadas hoy), `overstay_rooms_count` (habitaciones cuya hora de salida `check_out_date` ya venció y siguen en `progress`).
     - **Listado Enriquecido de Habitaciones (`rooms`)**:
       - Datos de la habitación (`id`, `number`, `floor`, `status`, `price_override`).
       - Datos del edificio (`building_id`, `building_name`, `building_floors`).
       - Datos del tipo de habitación (`room_type_id`, `room_type_name`, `base_price`).
       - Resumen y lista de camas de la habitación (`beds_count`, `total_bed_capacity`, `beds: [{ id, etiquette, bed_type_id, bed_type_name, capacity_people }]`).
       - Tarifa vigente (`active_tariff: { id, rate_id, rate_name, price, modality }`).
       - **Estancia Activa (`active_stay`, si `status == 'busy'` o tiene estancia en `progress`)**:
         - `stay_id`, `check_in_date` (hora exacta de ingreso), `check_out_date` (hora programada de salida), `is_overstay` (`now() > check_out_date`), `payment_method`, `security_deposit`, `remarks`.
         - `guests_count` y lista de huéspedes alojados (`guests: [{ id, document_type, document_number, name, phone_number, email }]`).
         - Auditoría: `registered_by` (`created_by` del recepcionista que registró el ingreso) y `created_at`.

4. **Check-In y Check-Out Atómicos desde la Habitación (1 Sola Transacción SQL)**:
   - **`POST /rooms/{room_id}/check-in`**:
     - Recibe los datos de la estancia (`check_in_date`, `check_out_date`, `payment_method`, `security_deposit`, `remarks`) y la lista de huéspedes (permitiendo enviar tanto IDs de huéspedes ya existentes en la sede como datos básicos de huéspedes nuevos para crearlos/actualizarlos al vuelo en la misma transacción).
     - **Validaciones invariantes**:
       - La habitación debe pertenecer a la sede activa (`headquarters_id`) y estar en estado `available`.
       - La cantidad de huéspedes no debe exceder la capacidad máxima de la habitación/camas.
       - Si el documento de un huésped ya existe en la sede (`persons`), se reutiliza/actualiza su ficha sin lanzar error bloqueante; si no existe, se inserta en `persons` con `headquarters_id` y `created_by = actor`.
     - **Efecto transaccional**:
       1. Upsert de fichas en `persons` (con rol `guest`).
       2. Inserción en `stays` (`status = 'progress'`, `headquarters_id`, `created_by = actor`).
       3. Inserción de pivotes en `stays_persons`.
       4. Actualización automática de `rooms` -> `SET status = 'busy', updated_by = actor, updated_at = now()`.
   - **`POST /rooms/{room_id}/check-out`**:
     - Cierra la estancia activa de la habitación en una sola transacción:
       1. Actualiza `stays` -> `SET status = 'completed', check_out_date = now(), updated_by = actor, updated_at = now()`.
       2. Actualiza `rooms` -> `SET status = 'cleaning'` (o `'available'` si se indica liberación inmediata), `updated_by = actor, updated_at = now()`.
   - **`PATCH /rooms/{room_id}/operational-status`**:
     - Permite al recepcionista cambiar rápidamente una habitación de `cleaning` -> `available` (o reportar `maintenance`) registrando `updated_by = actor` y `updated_at = now()`.

---

## 2. Permisos por Endpoint en `internal/api/router.go`

Aplicar el middleware `RequireRoles` del Plan 01 sobre los endpoints de infraestructura vs operación:

| Grupo | Endpoints | Roles Permitidos |
| :--- | :--- | :--- |
| **Infraestructura Física (Solo Admin en Configuración)** | `POST/PUT/DELETE /building`, `POST/PUT/DELETE /room-types`, `POST/PUT/DELETE /types-bed`, `POST/PUT/DELETE /room`, `POST/PUT/DELETE /beds`, `POST/PUT/DELETE /rates`, `POST/PUT/DELETE /room_tariffs` | `super_admin`, `admin` |
| **Consultas de Catálogos Base** | `GET /building`, `GET /room-types`, `GET /types-bed`, `GET /room`, `GET /beds`, `GET /rates`, `GET /room_tariffs` | `super_admin`, `admin`, `manager`, `reception`, `housekeeping` |
| **Operación Diaria en Módulo de Habitaciones** | `GET /rooms/operational-rack`, `POST /rooms/{id}/check-in`, `POST /rooms/{id}/check-out`, `PATCH /rooms/{id}/operational-status`, `GET /persons/search` | `super_admin`, `admin`, `manager`, `reception` (`housekeeping` permitido en `GET` y `operational-status`) |

---

## 3. Especificación Técnica de Casos de Uso y Queries SQL

### 3.1. Caso de Uso: `GetOperationalRackUseCase` (`internal/application/room/operational_rack.go`)
Implementar en `RoomRepository` una consulta SQL optimizada con `LEFT JOIN` (filtrada por `r.headquarters_id = $1 AND r.deleted_at IS NULL`) que traiga en un solo round-trip:
- Habitación (`rooms r`) + Edificio (`buildings b`) + Tipo (`room_types rt`)
- Subconsulta agregada `JSONB` de camas activas (`beds` + `bed_types` donde `deleted_at IS NULL`)
- Subconsulta de tarifa por defecto activa (`room_tariffs` + `rates` donde `deleted_at IS NULL`)
- Subconsulta de estancia activa (`stays s` con `s.status = 'progress' AND s.deleted_at IS NULL` + `stays_persons` + `persons`)

A partir de las filas retornadas, calcular en memoria de forma determinista el objeto `OperationalRackKPIs`:
- `TotalRooms`: total de habitaciones activas de la sede.
- `OccupiedRooms`: habitaciones con `status == 'busy'` (o estancia activa en `progress`).
- `AvailableRooms`: habitaciones con `status == 'available'`.
- `CleaningRooms`: habitaciones con `status == 'cleaning'`.
- `MaintenanceRooms`: habitaciones con `status == 'maintenance'`.
- `TotalBeds`: suma de todas las camas físicas (`beds`) de las habitaciones de la sede.
- `OccupiedBeds`: suma de camas ocupadas en las habitaciones actualmente ocupadas (acotado por los huéspedes alojados o las camas de habitaciones ocupadas).
- `TotalCapacityGuests`: suma de la capacidad de personas de todas las habitaciones/camas de la sede.
- `CurrentGuestsHosted`: suma de `len(room.ActiveStay.Guests)` en estancias activas.
- `CheckInsToday`: conteo de estancias de la sede con `check_in_date` en el día actual.
- `CheckOutsToday`: conteo de estancias de la sede con `check_out_date` en el día actual.
- `OverstayRoomsCount`: conteo de habitaciones ocupadas donde `ActiveStay.CheckOutDate < time.Now()`.

### 3.2. Caso de Uso: `CheckInRoomUseCase` (`internal/application/room/check_in.go`)
Input del endpoint `POST /rooms/{id}/check-in`:
```json
{
  "check_in_date": "2026-11-01T15:00:00Z",
  "check_out_date": "2026-11-03T12:00:00Z",
  "payment_method": "cash",
  "security_deposit": 50000,
  "remarks": "Ingreso directo en recepción",
  "guests": [
    {
      "person_id": "",
      "document_type": "national_id",
      "document_number": "1020304050",
      "name": "Carlos Ramírez",
      "phone_number": "3001234567",
      "email": "carlos@correo.com",
      "nationality": "Colombia"
    }
  ]
}
```
Ejecución dentro de `tx, err := pool.Begin(ctx)`:
1. `SELECT ... FROM rooms WHERE id = $1 AND headquarters_id = $2 AND deleted_at IS NULL FOR UPDATE` (bloqueo pesimista para evitar doble Check-In concurrente en la misma habitación).
2. Verificar que la habitación esté disponible y no tenga otra estancia con `status = 'progress'`.
3. Para cada huésped en `guests`:
   - Si viene `person_id`, verificar que exista en la sede (`headquarters_id`).
   - Si no viene `person_id`, buscar por `(headquarters_id, document_type, document_number)`. Si existe, actualizar sus datos de contacto (`updated_by = actor`); si no existe, crearlo en `persons` (`created_by = actor`, `headquarters_id = activeHQ`) y asignarle el rol `guest`.
4. Insertar la estancia en `stays` (`status = 'progress'`, `headquarters_id = activeHQ`, `created_by = actor`) y vincular a todos los huéspedes en `stays_persons`.
5. Actualizar `rooms SET status = 'busy', updated_by = $actor, updated_at = now() WHERE id = $room_id`.
6. `tx.Commit(ctx)` y retornar el detalle completo de la habitación y la estancia recién creada (`201 Created`).

### 3.3. Caso de Uso: `CheckOutRoomUseCase` (`internal/application/room/check_out.go`)
Input de `POST /rooms/{id}/check-out`:
```json
{
  "next_room_status": "cleaning",
  "remarks": "Entrega de llaves sin novedades"
}
```
Ejecución dentro de transacción SQL:
1. Bloquear la habitación (`FOR UPDATE`) y localizar su estancia activa (`status = 'progress'`).
2. Actualizar `stays SET status = 'completed', check_out_date = now(), remarks = COALESCE($remarks, remarks), updated_by = $actor, updated_at = now() WHERE id = $stay_id`.
3. Actualizar `rooms SET status = $next_room_status, updated_by = $actor, updated_at = now() WHERE id = $room_id` (por defecto `'cleaning'`, o `'available'` si se solicita).
4. Confirmar transacción y devolver el estado actualizado (`200 OK`).

### 3.4. Búsqueda Rápida de Huésped por Documento (`GET /persons/by-document`)
- Endpoint `GET /persons/by-document?document_type=national_id&document_number=1020304050`:
- Busca en la sede activa (`headquarters_id`) si el cliente ya estuvo hospedado antes y retorna sus datos en `< 50ms` para que el recepcionista autocompleta el formulario de Check-In con solo digitar la cédula/pasaporte.

---

## 4. Checklist de Verificación y Pruebas Automatizadas (Backend)

- [ ] **Test de Permisos de Infraestructura**: Un usuario `reception` recibe `403 Forbidden` al intentar crear/editar/eliminar un edificio (`POST /building`), tipo de habitación (`POST /room-types`), cama (`POST /beds`) o habitación (`POST /room`). Un usuario `admin` recibe `201 Created`.
- [ ] **Test de Rack y KPIs (`operational_rack_test.go`)**: Verificar que `GET /rooms/operational-rack` devuelve los conteos exactos de habitaciones, camas totales, camas ocupadas, capacidad máxima de personas, huéspedes alojados y horas de entrada/salida únicamente de la sede activa (`X-Headquarter-ID`).
- [ ] **Test de Check-In Transaccional (`check_in_test.go`)**: Verificar que `POST /rooms/{id}/check-in` crea/reutiliza los huéspedes en `persons`, crea la estancia en `stays`, pasa la habitación a `busy` en una sola transacción y registra `created_by` y `updated_by` con el recepcionista autenticado.
- [ ] **Test de Concurrencia en Check-In**: Si dos recepcionistas intentan hacer Check-In al mismo tiempo sobre la misma habitación, el segundo recibe `409 Conflict` (`ErrRoomAlreadyOccupied`).
- [ ] **Test de Check-Out Transaccional (`check_out_test.go`)**: Verificar que `POST /rooms/{id}/check-out` finaliza la estancia (`completed`), actualiza `check_out_date` real, cambia la habitación a `cleaning` y guarda el `updated_by` del recepcionista.

---

## 5. Prompt Maestro para Ejecución del Agente (Backend)

> *"Ejecuta íntegramente el plan `d:\Nexora\nexora-api-rest\prompt\plan-02-habitaciones-kpis-checkin-infraestructura-backend.md` siguiendo las directrices de `SKILL.md`. Implementa: (1) Restricción RBAC para que solo `admin`/`super_admin` creen o modifiquen edificios, pisos, tipos de habitación, tipos de cama, habitaciones, camas y tarifas, (2) Creación/actualización de habitación incluyendo la configuración de sus camas físicas, (3) Endpoint consolidado `GET /rooms/operational-rack` con cálculo exacto de KPIs de capacidad, camas ocupadas, habitaciones ocupadas y horas de ingreso/salida por sede, y (4) Endpoints transaccionales `POST /rooms/{id}/check-in`, `POST /rooms/{id}/check-out`, `PATCH /rooms/{id}/operational-status` y `GET /persons/by-document` con auditoría completa. Ejecuta `go test ./...` al terminar."*
