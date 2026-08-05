# ARCHITECTURE.md

# San Andreas Emergency Department Management System

Versión: 1.0

Documento Técnico

---

# Índice

1. Filosofía de la Arquitectura
2. Objetivos Técnicos
3. Arquitectura General
4. Tecnologías
5. Arquitectura del Frontend
6. Arquitectura del Backend
7. Arquitectura de la Base de Datos
8. Arquitectura de Comunicación
9. Flujo General del Sistema
10. Autenticación
11. Gestión de Cuentas
12. Gestión de Personajes
13. Sistema de Roles y Permisos
14. Módulos del Sistema
15. Organización del Proyecto

---

# 1. Filosofía de la Arquitectura

El sistema ha sido diseñado bajo una arquitectura modular, escalable y desacoplada.

Cada funcionalidad importante estará encapsulada dentro de su propio módulo, evitando dependencias innecesarias entre componentes.

La arquitectura deberá facilitar:

- Escalabilidad.
- Mantenimiento.
- Legibilidad.
- Reutilización.
- Pruebas.
- Desarrollo paralelo.

Toda nueva funcionalidad deberá implementarse como un módulo independiente.

El sistema nunca deberá depender de un único archivo o servicio centralizado.

---

# 2. Objetivos Técnicos

La arquitectura deberá cumplir los siguientes objetivos.

## Escalable

Agregar un nuevo módulo no deberá afectar los existentes.

---

## Modular

Cada módulo tendrá:

- Controladores
- Servicios
- DTOs
- Entidades
- Interfaces

---

## Desacoplada

Los módulos se comunicarán mediante servicios.

Nunca accederán directamente a la lógica interna de otro módulo.

---

## Mantenible

Todo el código deberá seguir una estructura consistente.

---

## Segura

Toda petición deberá pasar por:

- Autenticación
- Autorización
- Validación

---

## Tiempo Real

La comunicación mediante Socket.IO será parte fundamental del sistema.

No será una funcionalidad opcional.

---

# 3. Arquitectura General

La arquitectura estará dividida en cuatro capas principales.

```

Frontend

↓

REST API

↓

NestJS

↓

Prisma ORM

↓

PostgreSQL

↑

Socket.IO

```

Cada capa tendrá responsabilidades claramente definidas.

---

# Frontend

Responsable de:

- Interfaz.
- Navegación.
- Renderizado.
- Consumo de API.
- Comunicación Socket.IO.

Nunca contendrá lógica de negocio.

---

# Backend

Responsable de:

- Lógica del negocio.
- Validaciones.
- Permisos.
- Comunicación con la base de datos.
- Eventos Socket.IO.

---

# Base de Datos

Responsable únicamente del almacenamiento.

No contendrá lógica de negocio.

---

# Socket.IO

Responsable de todas las actualizaciones en tiempo real.

---

# 4. Tecnologías

## Frontend

HTML5

Tailwind CSS

Flowbite

JavaScript ES6

Axios

Socket.IO Client

---

## Backend

NestJS

Prisma ORM

Socket.IO

Passport

JWT

Arquitectura multi-proveedor de autenticación

Discord OAuth2

Proveedor LOCAL (usuario/correo + contraseña con Argon2)

---

## Base de Datos

PostgreSQL

---

# 5. Arquitectura del Frontend

El frontend será completamente estático.

Toda la información será obtenida desde el backend.

La aplicación funcionará como una SPA ligera.

La navegación se realizará sin recargar la página.

---

## Organización

```

web/

assets/

css/

js/

img/

fonts/

icons/

components/

layouts/

pages/

services/

utils/

```

---

# Components

Contendrá componentes reutilizables.

Ejemplos:

Navbar

Sidebar

Modal

Toast

Table

Card

Notification

---

# Layouts

Definirá la estructura visual.

Ejemplos.

Dashboard

Authentication

Landing

---

# Pages

Cada página será independiente.

Ejemplo.

Landing

Login

Dashboard

Academy

Settings

---

# Services

Responsables de consumir la API.

Ejemplo.

AuthService

ReportsService

CasesService

ComplaintService

NotificationService

---

# Utils

Funciones auxiliares.

---

# 6. Arquitectura del Backend

El backend utilizará una arquitectura modular propia de NestJS.

Cada módulo será completamente independiente.

Ejemplo.

```

src/

modules/

auth/

accounts/

characters/

permissions/

roles/

staff/

reports/

cases/

evidence/

complaints/

notifications/

academy/

awards/

news/

audit/

```

---

Cada módulo contendrá.

Controller

Service

DTO

Entity

Repository

Interfaces

Gateway (si utiliza Socket.IO)

---

# Controllers

Responsables de recibir peticiones HTTP.

No contendrán lógica.

---

# Services

Contendrán toda la lógica del negocio.

---

# DTO

Validación de datos de entrada.

---

# Repository

Comunicación con Prisma.

---

# Gateway

Comunicación Socket.IO.

---

# 7. Arquitectura de Base de Datos

Toda la persistencia utilizará PostgreSQL.

El acceso a la base de datos será exclusivamente mediante Prisma.

Nunca se escribirán consultas SQL desde los controladores.

Toda consulta deberá pasar por un servicio.

---

# 8. Arquitectura de Comunicación

El sistema utilizará dos formas de comunicación.

## REST API

Operaciones tradicionales.

Ejemplo.

GET

POST

PATCH

DELETE

---

## Socket.IO

Actualizaciones inmediatas.

Ejemplo.

Nuevo mensaje.

Nueva evidencia.

Nueva notificación.

Cambio de personaje.

Cambio de permisos.

Caso actualizado.

---

Cada tecnología tendrá responsabilidades diferentes.

REST nunca reemplazará Socket.

Socket nunca reemplazará REST.

Ambas convivirán.

---

# 9. Flujo General del Sistema

Usuario

↓

Proveedor de autenticación (LOCAL | DISCORD | futuros)

↓

AuthService (cuenta + identidades)

↓

Access Token JWT + Refresh Token opaco

↓

Selector de Personajes

↓

Contexto de sesión (personaje activo + roles + permisos)

↓

Dashboard / Módulos

↓

API REST + Socket.IO

↓

Base de Datos

---

Toda acción importante generará un evento Socket.IO.

---

# 10. Autenticación

La autenticación utilizará una arquitectura multi-proveedor.

El núcleo (`AuthService`) orquestará la sesión, los tokens y el personaje activo.

Los proveedores concretos implementarán un contrato común (`IAuthProvider`) y se registrarán de forma desacoplada.

## Proveedores iniciales

### LOCAL

- Registro e inicio de sesión mediante usuario o correo y contraseña.
- Las contraseñas se almacenarán únicamente como hash Argon2.
- Nunca se almacenará la contraseña en texto plano.

### DISCORD

- OAuth2.
- Creación o vinculación de cuenta a partir del perfil Discord.
- Actualización de datos de identidad Discord cuando proceda.

## Proveedores futuros

Nuevos proveedores (Google, Steam, FiveM, etc.) deberán:

1. Implementar `IAuthProvider`.
2. Registrarse en el módulo de autenticación.
3. Persistir una `AuthIdentity` asociada a la cuenta.

Sin modificar la lógica de emisión de JWT, refresh tokens, RBAC ni selección de personaje.

## Tokens

### Access Token (JWT)

- Corta duración.
- Contiene: cuenta, personaje activo (si existe), roles y permisos efectivos (o la información necesaria para resolverlos).
- Se utiliza en REST y en el handshake de Socket.IO.

### Refresh Token (opaco)

- Larga duración.
- Valor aleatorio opaco.
- Se almacena hasheado en base de datos.
- Se rota en cada renovación.
- Se revoca en logout o compromiso de sesión.

## Almacenamiento en el frontend

El frontend nunca almacenará información sensible de negocio.

Únicamente podrá almacenar:

- Access Token JWT
- Refresh Token
- Personaje activo (referencia)
- Preferencias visuales

---

# 11. Gestión de Cuentas

Una cuenta representa a un usuario real.

Una cuenta podrá:

- Tener múltiples personajes.
- Tener múltiples identidades de autenticación (`AuthIdentity`).
- Mantener opcionalmente un personaje activo persistido para restaurar contexto.

Ejemplo.

Cuenta

↓

John

↓

Emily

↓

Michael

↓

Sarah

---

La cuenta nunca almacenará información médica ni institucional del SAED.

---

# 12. Gestión de Personajes

Cada personaje será completamente independiente.

El estado del personaje se modelará mediante una enumeración extensible (`CharacterStatus`), por ejemplo:

- CIVIL
- MEDICAL_STAFF
- RETIRED
- SUSPENDED

No se utilizarán flags booleanos del tipo `isMedicalStaff`.

Si el personaje tiene estado institucional (por ejemplo MEDICAL_STAFF) se habilitarán los módulos internos según sus roles y permisos.

Si es CIVIL únicamente verá funcionalidades públicas autorizadas.

---

## Cambio de personaje

El usuario podrá cambiar de personaje sin cerrar sesión.

El backend recalculará:

Permisos efectivos

Roles

Información disponible

Notificaciones

Sidebar

Dashboard

Socket Rooms

Access Token

Todo será actualizado mediante Socket.IO (`character:changed`) y un nuevo Access Token.

---

# 13. Sistema de Roles y Permisos

La arquitectura utilizará RBAC (Role Based Access Control).

Relación.

Cuenta

↓

Personaje

↓

CharacterRole (N:N)

↓

Roles

↓

Permisos

↓

Módulos

---

Los permisos nunca estarán asociados directamente a un personaje.

Los personajes podrán tener **múltiples roles** a través de `CharacterRole`.

Los roles definirán los permisos mediante `RolePermission`.

## Permisos específicos y comodines

Formato base: `recurso.acción`

Ejemplos específicos:

- `reports.read`
- `reports.create`
- `cases.assign`

Comodines soportados:

- `reports.*` → todas las acciones del recurso `reports`
- `*` → permiso global

La resolución de permisos (incluyendo comodines) será responsabilidad exclusiva del backend.

Ejemplo.

Detective

↓

reports.read

↓

reports.create

↓

cases.assign

↓

cases.close

↓

complaints.reply

---

El frontend únicamente mostrará módulos autorizados.

El backend validará nuevamente todos los permisos.

Nunca se confiará en el frontend.

---

# 14. Módulos del Sistema

La aplicación estará formada por módulos independientes.

Módulos iniciales.

- Authentication
- Accounts
- Characters
- Roles
- Permissions
- Dashboard
- Staff
- Departments
- Academy
- Reports
- Cases
- Evidence
- Complaints
- Awards
- Notifications
- News
- Audit
- Settings

Cada módulo podrá evolucionar de forma independiente.

---

# 15. Organización del Proyecto

```

SAED/

api/

src/

modules/

common/

config/

database/

web/

assets/

components/

layouts/

pages/

services/

utils/

database/

docs/

README.md

```

---

# Principios Arquitectónicos

Todo desarrollo futuro deberá respetar los siguientes principios.

- Modularidad.
- Escalabilidad.
- Código desacoplado.
- Separación de responsabilidades.
- Comunicación mediante servicios.
- Uso de REST para operaciones tradicionales.
- Uso de Socket.IO para tiempo real.
- Persistencia mediante Prisma.
- Seguridad mediante JWT y OAuth2.
- Permisos mediante RBAC.
- Reutilización de componentes.
- Código limpio y documentado.

Todo nuevo módulo deberá integrarse respetando esta arquitectura.

# 16. Flujo de una Petición HTTP

Todas las peticiones seguirán exactamente el mismo recorrido.

Cliente

↓

Middleware

↓

Guard

↓

Controller

↓

Validation Pipe

↓

Service

↓

Repository (Prisma)

↓

PostgreSQL

↓

Service

↓

Controller

↓

Cliente

Cada capa tendrá una única responsabilidad.

## Middleware

Responsable de:

- Logging
- Rate Limiting
- Request ID
- Información de contexto

No contendrá lógica de negocio.

---

## Guards

Responsables de:

- Validar JWT.
- Validar autenticación.
- Validar permisos.
- Validar acceso al módulo.

---

## Validation Pipes

Toda petición será validada.

Nunca se aceptarán datos sin validar.

---

## Services

Toda la lógica del negocio deberá implementarse aquí.

Nunca en Controllers.

Nunca en Gateways.

---

## Repository

Único punto autorizado para acceder a la base de datos.

Toda consulta utilizará Prisma.

---

# 17. Comunicación REST

REST será utilizado únicamente para operaciones CRUD.

Ejemplos.

GET

POST

PUT

PATCH

DELETE

Ejemplos reales.

GET /reports

GET /reports/:id

POST /reports

PATCH /reports/:id

DELETE /reports/:id

---

REST nunca será utilizado para sincronización en tiempo real.

---

# 18. Comunicación Socket.IO

Socket.IO será el sistema oficial para toda comunicación en tiempo real.

No reemplazará REST.

Lo complementará.

Eventos previstos.

## Authentication

connected

disconnected

characterChanged

---

## Reports

reportCreated

reportUpdated

reportDeleted

---

## Cases

caseCreated

caseUpdated

caseAssigned

caseClosed

---

## Evidence

evidenceAdded

evidenceUpdated

evidenceDeleted

---

## Complaints

complaintCreated

complaintAssigned

complaintUpdated

complaintClosed

newComplaintMessage

typing

stopTyping

---

## Notifications

notificationCreated

notificationRead

---

## News

newsPublished

newsUpdated

---

## Staff

staffUpdated

promotionGranted

departmentChanged

awardGranted

---

# 19. Gestión del Estado

El frontend nunca será la fuente de la verdad.

Toda la información oficial pertenecerá al backend.

El frontend únicamente almacenará información temporal.

Ejemplos.

- JWT.
- Personaje activo.
- Preferencias.
- Estado visual.

Toda la información crítica será solicitada al backend.

---

# 20. Gestión de Errores

Todas las respuestas seguirán un formato unificado.

Ejemplo.

Success

{
    success: true,
    data: {}
}

Error

{
    success: false,
    message: "",
    errors: []
}

Nunca se devolverán excepciones sin controlar.

---

# 21. Gestión de Archivos

El sistema permitirá almacenar archivos asociados a distintos módulos.

Ejemplos.

Fotografías

Vídeos

PDF

Documentos

Imágenes

Todos los archivos deberán disponer de:

- UUID
- Nombre original
- Tipo MIME
- Tamaño
- Fecha
- Autor

Los archivos nunca pertenecerán exclusivamente a un módulo.

Podrán reutilizarse.

---

# 22. Sistema de Notificaciones

Todas las notificaciones serán generadas desde el backend.

Nunca desde el frontend.

Cada notificación almacenará.

- Título
- Descripción
- Tipo
- Prioridad
- Usuario
- Personaje
- Fecha
- Estado

Las notificaciones llegarán mediante Socket.IO.

---

# 23. Auditoría

Toda acción importante será registrada.

Ejemplos.

Creación

Edición

Eliminación

Asignación

Cambio de permisos

Cambio de rango

Publicación

Inicio de sesión

Cambio de personaje

Derivación

Cada registro almacenará.

- Usuario
- Personaje
- Acción
- Fecha
- Dirección IP
- Recurso afectado
- Valores anteriores
- Valores nuevos

La auditoría nunca podrá modificarse.

---

# 24. Seguridad

Toda petición deberá cumplir.

JWT válido.

Permisos válidos.

Rol válido.

Personaje válido.

No bastará con estar autenticado.

También deberá verificarse el personaje activo.

---

Nunca se confiará en el frontend.

Toda validación crítica será realizada nuevamente por el backend.

---

# 25. Gestión de Sesión

Una cuenta puede tener múltiples personajes.

La sesión pertenece a la cuenta.

El contexto pertenece al personaje.

Al cambiar de personaje.

↓

El backend recalcula.

↓

Permisos.

↓

Sidebar.

↓

Dashboard.

↓

Notificaciones.

↓

Socket Rooms.

↓

Información disponible.

Todo sin cerrar sesión.

---

# 26. Socket Rooms

Cada conexión Socket.IO pertenecerá a distintas salas.

Ejemplo.

Usuario

↓

account:15

↓

character:42

↓

department:Trauma

↓

role:DepartmentChief

↓

case:128

↓

complaint:93

Esto permitirá enviar eventos únicamente a quienes corresponda.

Ejemplo.

Una denuncia.

↓

Solo el personal médico asignado.

↓

No todo el departamento.

---

# 27. Escalabilidad

Todo módulo nuevo deberá cumplir.

Controller

↓

Service

↓

Repository

↓

DTO

↓

Gateway (si utiliza Socket.IO)

↓

Entity

No podrán existir módulos especiales.

Todos deberán seguir exactamente la misma estructura.

---

# 28. Convenciones

## Variables

camelCase

## Clases

PascalCase

## Archivos

kebab-case

## Carpetas

kebab-case

## Interfaces

Prefijo I

Ejemplo.

IReportService

---

# 29. Dependencias

Los módulos nunca dependerán directamente unos de otros.

La comunicación se realizará mediante servicios públicos.

No se permitirán dependencias circulares.

---

# 30. Inyección de Dependencias

Toda dependencia utilizará el sistema de Inyección de Dependencias de NestJS.

Nunca se crearán instancias manualmente mediante "new".

---

# 31. Rendimiento

El sistema deberá priorizar.

- Consultas optimizadas.
- Reutilización.
- Lazy Loading cuando sea posible.
- Paginación.
- Caché para consultas frecuentes.
- Compresión HTTP.

---

# 32. Logging

Todas las acciones importantes deberán generar logs.

Ejemplos.

Login.

Logout.

Errores.

Cambios de permisos.

Consultas críticas.

Errores de autenticación.

Errores de Socket.IO.

---

# 33. Testing

Cada módulo deberá permitir pruebas unitarias.

La lógica de negocio nunca dependerá del controlador.

Esto facilitará el testing.

---

# 34. Escenarios de Futuro

La arquitectura deberá permitir integrar sin rediseños.

- SAFD
- DOJ
- Gobierno
- Tribunal
- CAD
- Aplicación móvil
- API pública
- Integraciones con FiveM
- Sistemas externos

---

# 35. Decisiones Arquitectónicas

Las siguientes decisiones forman parte de la arquitectura oficial del proyecto.

✓ Arquitectura modular.

✓ NestJS como backend.

✓ PostgreSQL como base de datos.

✓ Prisma como ORM.

✓ Socket.IO para tiempo real.

✓ Arquitectura multi-proveedor de autenticación.

✓ Discord OAuth2 como proveedor inicial.

✓ Proveedor LOCAL (usuario/correo + contraseña con Argon2).

✓ Access Token JWT + Refresh Token opaco rotativo en base de datos.

✓ RBAC con múltiples roles por personaje (`CharacterRole`).

✓ Permisos específicos y con comodines (`reports.*`, `*`).

✓ Estado de personaje extensible (sin flags booleanos).

✓ Frontend ligero basado en HTML, Tailwind CSS y JavaScript modular.

✓ API REST para operaciones CRUD.

✓ Socket.IO para sincronización.

✓ Comunicación desacoplada.

✓ Arquitectura preparada para crecer durante años.

---

# 36. Principios del Proyecto

Todo desarrollo deberá respetar estos principios.

1. Código limpio.

2. Una única responsabilidad por clase.

3. No duplicar lógica.

4. No duplicar información.

5. Modularidad.

6. Escalabilidad.

7. Seguridad.

8. Reutilización.

9. Consistencia.

10. Mantenibilidad.

11. Tiempo real como prioridad.

12. Experiencia de usuario por encima de la complejidad técnica.

Este documento servirá como referencia técnica para todo el desarrollo del proyecto.