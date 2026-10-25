# Nexora

Plataforma web para la gestión hotelera

## 1. Descripción

Nexora es una plataforma web diseñada para gestionar las operaciones de recepción y administración de habitaciones de un hotel. Su propósito es centralizar la información operativa del establecimiento en un sistema digital que facilite el control de las habitaciones, la disponibilidad, la ocupación y la atención de los huéspedes.

La plataforma permitirá al personal de recepción consultar el estado de las habitaciones, registrar huéspedes, gestionar reservas y controlar los procesos de entrada (check-in) y salida (check-out). Asimismo, proporcionará herramientas para actualizar el estado operativo de las habitaciones y mantener organizada la información necesaria para el funcionamiento diario del hotel.

Nexora se desarrollará utilizando **React** para la construcción de la interfaz de usuario y **Go (Golang)** para implementar la lógica del servidor y los servicios de backend. Esta arquitectura permitirá separar las responsabilidades de presentación, procesamiento de información y acceso a los datos.

## 2. Objetivo general

Desarrollar una plataforma web para la gestión hotelera que permita administrar las operaciones de recepción y el inventario de habitaciones mediante una interfaz intuitiva, una estructura de datos organizada y servicios de backend seguros y eficientes.

## 3. Objetivos específicos

- Centralizar la información de las habitaciones y sus estados operativos.
- Facilitar el registro y la consulta de huéspedes.
- Gestionar reservas, asignaciones de habitaciones y disponibilidad.
- Controlar los procesos de entrada y salida de huéspedes.
- Identificar habitaciones disponibles, ocupadas, reservadas, en limpieza o fuera de servicio.
- Proporcionar al personal autorizado herramientas para consultar y actualizar la información.
- Mantener la integridad y consistencia de los datos durante las operaciones hoteleras.
- Establecer una arquitectura escalable que permita incorporar nuevos módulos en el futuro.

## 4. Módulos principales

### 4.1 Recepción

Este módulo será el punto central de operación del personal de recepción. Permitirá consultar información relevante para atender a los huéspedes y gestionar las actividades diarias.

Funciones principales:

- Panel de control de recepción.
- Registro y consulta de huéspedes.
- Gestión de reservas.
- Registro de entradas y salidas.
- Asignación y reasignación de habitaciones.
- Consulta de disponibilidad.
- Historial de estancias y movimientos.

### 4.2 Gestión de habitaciones

Permitirá administrar el inventario físico de habitaciones del establecimiento.

Cada habitación podrá contar con información como:

- Número o código identificador.
- Nombre o descripción.
- Tipo de habitación.
- Capacidad máxima.
- Número de camas.
- Estado operativo.
- Características y observaciones.
- Historial de ocupación.

Los estados deberán diferenciar la disponibilidad comercial de la condición operativa. Por ejemplo, una habitación puede estar libre de huéspedes, pero permanecer bloqueada por mantenimiento.
