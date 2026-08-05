# Product Requirements Document (PRD)

# San Andreas Emergency Department Management System

**Versión:** 1.0.0

**Estado:** En desarrollo

**Proyecto:** SAED Management System

**Documento:** Product Requirements Document

**Última actualización:** Agosto 2026

---

# Tabla de Contenidos

1. Introducción
2. Objetivos del Producto
3. Alcance
4. Tecnologías
5. Arquitectura General
6. Usuarios del Sistema
7. Autenticación
8. Gestión de Cuentas
9. Gestión de Personajes
10. Sistema de Roles y Permisos
11. Dashboard
12. Noticias y Comunicados
13. Gestión del Personal Médico
14. Departamentos Médicos
15. Academia
16. Especializaciones
17. Historial Profesional
18. Pacientes
19. Expedientes Médicos
20. Informes Médicos
21. Establecimientos
22. Convenios
23. Licencias Médicas
24. Notificaciones
25. Comunicación en Tiempo Real
26. Sistema de Auditoría
27. Configuración
28. Requisitos Funcionales
29. Requisitos No Funcionales
30. Diseño
31. Roadmap
32. Funcionalidades Futuras
33. Conclusión

---

# 1. Introducción

## Objetivo

Desarrollar una plataforma web moderna destinada a la gestión integral del **San Andreas Emergency Department (SAED)** dentro de un servidor FiveM Roleplay.

La plataforma será el sistema oficial utilizado por el departamento para administrar toda la información médica e institucional.

No será únicamente un sistema de expedientes médicos, sino una plataforma institucional completa que permita gestionar:

- Personal médico.
- Organización interna.
- Pacientes.
- Expedientes médicos.
- Informes médicos.
- Hospitalizaciones.
- Departamentos médicos.
- Academia.
- Especializaciones.
- Historial profesional.
- Noticias.
- Convenios con establecimientos.
- Licencias médicas.

El objetivo es centralizar todos los procesos administrativos y médicos en una única aplicación moderna.

Aunque la primera versión estará enfocada exclusivamente en el ámbito hospitalario, la arquitectura deberá permitir incorporar en el futuro nuevas ramas del SAED como:

- Fire Department.
- Rescue Department.
- Air Rescue.
- HazMat.
- Search & Rescue.
- Otras departmentes de emergencias.

Sin necesidad de rediseñar la arquitectura principal del sistema.

---

# 2. Objetivos del Producto

La plataforma deberá permitir:

- Centralizar toda la información médica.
- Reducir procesos administrativos manuales.
- Facilitar la gestión del personal sanitario.
- Mantener un historial profesional completo de cada médico.
- Gestionar expedientes médicos de los pacientes.
- Registrar consultas e informes médicos.
- Gestionar convenios con establecimientos.
- Automatizar procesos internos.
- Mejorar la experiencia de Roleplay.
- Mantener una interfaz moderna, rápida y escalable.

---

# 3. Alcance

La primera versión del sistema incluirá:

- Gestión de cuentas.
- Gestión de personajes.
- Dashboard.
- Gestión del personal médico.
- Gestión de departamentos médicos.
- Gestión de pacientes.
- Expedientes médicos.
- Informes médicos.
- Noticias.
- Convenios.
- Establecimientos.
- Especializaciones.
- Historial profesional.
- Academia.
- Notificaciones en tiempo real.

Quedan fuera de esta primera versión las integraciones directas con FiveM para sincronizar automáticamente información del servidor.

Toda la información será administrada desde la propia plataforma.

---

# 4. Tecnologías

## Frontend

- HTML5
- Tailwind CSS
- Flowbite
- JavaScript ES6+

## Backend

- NestJS

## Base de Datos

- PostgreSQL

## ORM

- Prisma

## Comunicación en tiempo real

- Socket.IO

## Autenticación

- Arquitectura multi-proveedor.
- Usuario y contraseña (proveedor LOCAL).
- JWT (Access Token).
- Refresh Token opaco (almacenado en base de datos).
- Argon2 para el hash de contraseñas del proveedor LOCAL.

---

# 5. Arquitectura General

La plataforma estará dividida en módulos independientes.

Cada módulo será responsable de una funcionalidad específica.

Todos compartirán el mismo sistema de autenticación y permisos.

La comunicación entre frontend y backend se realizará mediante una API REST.

Todas las acciones que requieran actualización inmediata utilizarán Socket.IO.

La arquitectura deberá permitir incorporar nuevos módulos sin afectar los existentes.

Aunque inicialmente el sistema estará orientado a la gestión hospitalaria, la arquitectura deberá ser lo suficientemente flexible para incorporar nuevas departmentes del SAED sin modificar la base del sistema.

---

# 6. Usuarios del Sistema

Todos los usuarios iniciarán sesión mediante alguno de los proveedores de autenticación soportados (credenciales LOCAL u otros futuros).

Una cuenta podrá tener **como máximo dos personajes**.

Cada personaje será completamente independiente.

Dependiendo del personaje seleccionado, el sistema mostrará funcionalidades distintas.

## Ciudadano

Un ciudadano es cualquier personaje que no pertenezca al SAED.

Podrá:

- Iniciar sesión.
- Registrar personajes.
- Cambiar entre personajes.
- Consultar su expediente médico.
- Consultar sus informes médicos.
- Consultar sus hospitalizaciones.
- Consultar sus licencias médicas.
- Consultar noticias públicas.

No tendrá acceso a los módulos internos del departamento.

---

## Personal Médico

Cuando un personaje pertenezca al SAED obtendrá acceso a la plataforma interna.

Podrá:

- Consultar pacientes.
- Crear informes médicos.
- Gestionar expedientes médicos.
- Registrar hospitalizaciones.
- Consultar información institucional.
- Acceder únicamente a los módulos permitidos por sus permisos.

---

## Supervisor

Además de las funciones del personal médico podrá:

- Supervisar miembros de su departamento.
- Gestionar informes.
- Aprobar documentación.
- Administrar departamentos.
- Supervisar expedientes.

---

## Alto Mando

Dispondrá de acceso prácticamente completo.

Podrá:

- Gestionar rangos.
- Gestionar departamentos.
- Publicar noticias.
- Administrar convenios.
- Gestionar establecimientos.
- Gestionar especializaciones.
- Administrar permisos.
- Gestionar personal médico.

---

## Administrador del Sistema

Acceso técnico completo.

Podrá administrar toda la plataforma sin formar parte necesariamente del Roleplay.

---

# 7. Autenticación

La autenticación utilizará una arquitectura multi-proveedor.

El núcleo del sistema de autenticación no dependerá de un proveedor concreto.

Cada proveedor implementará el mismo contrato y podrá añadirse sin modificar la lógica principal de sesión, tokens o autorización.

## Proveedores iniciales

- **LOCAL:** usuario y contraseña (hash con Argon2).

## Proveedores futuros

La arquitectura deberá permitir incorporar fácilmente nuevos proveedores, por ejemplo:

- Google.
- Steam.
- FiveM.
- Otros proveedores OAuth o identidad externa.

## Sesión

Tras autenticarse correctamente el backend emitirá:

- **Access Token (JWT):** corta duración. Incluye la cuenta y, si existe, el personaje activo con sus permisos efectivos.
- **Refresh Token (opaco):** larga duración. Se almacena hasheado en base de datos, se rota en cada renovación y puede revocarse (logout).

Tras autenticarse, si la cuenta no tiene un personaje activo, el usuario accederá al selector de personajes.

El sistema deberá permitir cambiar de personaje sin necesidad de cerrar sesión, emitiendo un nuevo Access Token con el contexto actualizado.

# 8. Gestión de Cuentas

Cada cuenta representará a un usuario real.

La cuenta nunca almacenará información médica ni institucional.

Su única responsabilidad será representar la identidad del usuario dentro de la plataforma.

Una cuenta podrá registrar **como máximo dos personajes**.

Este límite será configurable en futuras versiones del sistema sin necesidad de modificar la arquitectura.

Ejemplo:

Cuenta (Miguel)

↓

Thomas Graves

↓

Grant Mercer

Cada personaje tendrá una identidad completamente independiente.

El sistema nunca asumirá que todos los personajes pertenecen al SAED.

Una cuenta será responsable únicamente de:

- Autenticación.
- Proveedores de inicio de sesión.
- Configuración global.
- Preferencias del usuario.
- Gestión de personajes.

Toda la información institucional estará asociada al personaje y nunca a la cuenta.

---

# 9. Gestión de Personajes

Los personajes representan la identidad utilizada dentro del servidor.

El estado del personaje NO se representará mediante flags booleanos (`isDoctor`, etc.).

Cada personaje dispondrá de un **estado** extensible (enumeración), por ejemplo:

- CIVIL
- MEDICAL_STAFF
- RETIRED
- SUSPENDED

Podrán añadirse nuevos estados en el futuro sin rediseñar el modelo.

## Personajes en estado CIVIL

Dispondrán únicamente de funcionalidades públicas.

Podrán:

- Consultar su expediente médico.
- Consultar sus informes médicos.
- Consultar hospitalizaciones.
- Consultar licencias médicas.
- Consultar noticias públicas.

No tendrán acceso a módulos internos.

---

## Personajes pertenecientes al SAED

Cuando un personaje forme parte del SAED dispondrá de información institucional adicional.

Ejemplo:

- Número de empleado.
- Departamento.
- Rango.
- Cargo.
- Fecha de ingreso.
- Especializaciones.
- Certificaciones.
- Historial profesional.

Toda esta información pertenecerá al expediente profesional del empleado.

---

## Cambio de personaje

El usuario podrá cambiar de personaje en cualquier momento.

No será necesario cerrar sesión.

Al cambiar:

- Se emitirá un nuevo Access Token con el contexto actualizado.
- Se actualizarán los permisos efectivos.
- Se actualizará el Dashboard.
- Se actualizarán las notificaciones.
- Se actualizarán las Socket Rooms.
- Se actualizará la información mostrada en toda la aplicación.
- Se actualizarán los módulos disponibles.

Todo deberá ocurrir sin recargar la aplicación.

---

# 10. Sistema de Roles y Permisos

La autorización utilizará RBAC (Role Based Access Control).

Los permisos NO pertenecen a la cuenta.

Los permisos pertenecen al personaje mediante sus roles.

Un personaje podrá tener **múltiples roles** mediante la relación `CharacterRole`.

Aunque inicialmente un personaje utilice un único rol, la arquitectura deberá soportar múltiples roles sin modificaciones estructurales.

Relación:

Cuenta

↓

Personaje activo

↓

Roles (CharacterRole)

↓

Permisos

↓

Módulos

## Formato de permisos

Los permisos utilizarán el formato:

`recurso.acción`

Ejemplos:

- `patients.read`
- `patients.update`
- `medical-records.read`
- `medical-records.create`
- `medical-reports.create`
- `medical-reports.update`
- `departments.manage`
- `establishments.read`
- `agreements.manage`
- `staff.manage`

---

## Comodines

El sistema deberá soportar permisos globales y con comodines para facilitar la administración.

Ejemplos:

`patients.*`

Concede todas las acciones relacionadas con pacientes.

`medical-records.*`

Concede acceso completo al módulo de expedientes médicos.

`*`

Concede acceso global.

La resolución de permisos deberá realizarse íntegramente desde el backend.

---

## Roles de ejemplo

Intern

Acceso limitado.

Resident

Acceso a pacientes e informes.

Doctor

Acceso completo a la atención médica.

Specialist

Permisos avanzados dentro de su especialidad.

Department Chief

Administración de un departamento.

Medical Director

Administración completa del SAED.

Administrator

Administración técnica del sistema.

Los módulos para los cuales el personaje no posea permisos no deberán mostrarse en la interfaz.

El sistema deberá permitir crear nuevos roles y nuevos permisos sin modificar el código fuente.

---

# 11. Dashboard

El Dashboard será la pantalla principal tras seleccionar un personaje.

Mostrará información distinta según los permisos efectivos del personaje activo.

Podrá incluir:

- Noticias institucionales.
- Comunicados.
- Actividad reciente.
- Pacientes recientes.
- Informes pendientes.
- Expedientes actualizados recientemente.
- Accesos rápidos.
- Notificaciones.
- Información del personaje activo.

Toda la información deberá actualizarse en tiempo real siempre que sea posible.

El Dashboard deberá ser modular, permitiendo añadir nuevos widgets sin modificar la arquitectura existente.

---

# 12. Noticias y Comunicados

El sistema permitirá publicar noticias internas.

Cada noticia incluirá:

- Título.
- Imagen.
- Contenido.
- Autor.
- Fecha de publicación.
- Estado.

Las noticias podrán ser:

- Públicas.
- Exclusivas para el SAED.
- Exclusivas para determinados departamentos.

La publicación de una noticia generará automáticamente una notificación para los personajes que tengan acceso a visualizarla.

Los comunicados permitirán compartir información institucional relevante, como:

- Cambios administrativos.
- Nuevos protocolos médicos.
- Avisos internos.
- Incorporación de personal.
- Eventos institucionales.
- Actualizaciones del hospital.

Los usuarios únicamente visualizarán las noticias y comunicados permitidos según los permisos de su personaje activo.

