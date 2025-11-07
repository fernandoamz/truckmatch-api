## Resumen: roles, rutas y flujo de datos

Este documento resume cómo fluye la información en la API, qué roles existen y qué rutas deberían usar cada uno. Útil para desarrolladores, QA y operaciones.

## Roles (modelo `User.role`)
- `driver` — conductor: recibe asignaciones (assignments), sube documentos, inicia/termina viajes.
- `employer` — cliente/contratante: crea órdenes (orders) y consulta sus órdenes.

Nota: Actualmente el enum en `models/user.js` define sólo `driver` y `employer`. En el código hay soporte para middleware de autorización (`authorize(...)`) que podemos usar para añadir `admin` si se requiere.

## Mapa de rutas y quién debería usarlas

Las rutas están agrupadas por recurso. Aquí indico la intención/semántica y la recomendación de autorización.

- Autenticación
  - POST `/auth/register` — registrar cuenta (role en payload: `driver`|`employer`). Público.
  - POST `/auth/login` — login, devuelve `accessToken` y `refreshToken`. Público.
  - POST `/auth/refresh` — refrescar token. Requiere refresh token.
  - GET `/auth/me` — perfil del usuario actual. Requiere token.

- Orders (`/api/orders`) — principalmente `employer`
  - POST `/api/orders` — crear orden (recomiendo `authorize('employer')`).
  - GET `/api/orders` — listar órdenes (employer para ver sus órdenes; admin para ver todo).
  - GET `/api/orders/:id` — detalle (propietario o admin).
  - PATCH `/api/orders/:id`, DELETE `/api/orders/:id` — actualizar/eliminar según reglas de negocio.
  - GET `/api/orders/statistics` — estadísticas (admin/operator).

- Assignments (`/api/assignments`) — operadores/admin y drivers
  - POST `/api/assignments` — crear una asignación (recomiendo `authorize('admin')`).
  - GET `/api/assignments` — listar. Drivers deben ver sólo sus assignments; admin puede ver todos.
  - PATCH `/api/assignments/:id` — cambio de estado (driver autorizado para cambiar su assignment a `started`/`completed`; admin puede modificar).
  - POST `/api/assignments/:id/revalidate` — revalidar (admin/operator).

- Drivers (`/api/drivers`) — gestión de transportistas (admin/operator o self-service)
  - POST `/api/drivers` — crear driver.
  - GET `/api/drivers`, GET `/api/drivers/:id` — listar/obtener.
  - PUT `/api/drivers/:id`, DELETE `/api/drivers/:id` — actualizar/eliminar.

- Units (`/api/units`) — flota
  - POST `/api/units`, GET `/api/units`, GET `/api/units/:id`, PUT `/api/units/:id`, DELETE `/api/units/:id`.
  - PUT `/api/units/:id/assign-driver/:driverId` — asignar driver a unidad (admin/operator).

- Documents (`/api/documents`) — drivers y admin
  - POST `/api/documents/upload` — subir documento (driver o admin).
  - GET `/api/documents`, GET `/api/documents/:id` — listar/obtener.
  - PATCH `/api/documents/:id` — actualizar estado (admin).

- GraphQL
  - POST `/graphql` — endpoint GraphQL. Expuesto por compatibilidad; usa `attachUserFromAuthHeader` para permitir resolvers dependientes de usuario (ej. `me`, `registerUnit`).

## Flujo típico de datos (secuencia): crear orden → asignar → viaje → completar

1. Employer inicia sesión y obtiene `accessToken`.
2. Employer crea una orden: POST `/api/orders` con Authorization header.
3. Operator/Admin crea una assignment a partir de la orden: POST `/api/assignments` (valida driver, unidad y documentos).
4. Driver recibe la asignación (GET `/api/assignments?driverId=<me>`).
5. Driver inicia el viaje: PATCH `/api/assignments/:id` { status: 'started' } (sólo si es el driver asignado).
6. Driver completa el viaje: PATCH `/api/assignments/:id` { status: 'completed' } → se actualiza `order.status` y `unit.status`.

## Validaciones importantes
- `Driver.licenseExpirationDate` debe ser fecha en el futuro (el modelo valida con `isAfter`). El seeder puede fallar si la fecha es pasada respecto al momento de ejecución.
- Antes de crear una asignación se validan: documentos vigentes del driver, documentos de la unidad, que driver/unit no tengan assignments activas.

## Comandos útiles
- Levantar stack (Docker Compose):
  ```powershell
  docker compose up -d
  ```
- Ejecutar seeder dentro del contenedor:
  ```powershell
  docker compose exec truckmatch-api npm run seed
  ```
- Migraciones (sequelize):
  ```powershell
  npm run migrate
  ```

## Recomendaciones y próximos pasos
- Aplicar autorización por rol usando `authorize(...)` en endpoints críticos (por ejemplo: `POST /api/orders` → `authorize('employer')`; `POST /api/assignments` → `authorize('admin')`).
- Añadir role `admin` al enum si necesitas un operador con permisos administrativos.
- Añadir ownership checks: por ejemplo, sólo el driver asignado puede cambiar su assignment a `started`/`completed`.
- Para producción: mover secretos a `Secret`/Vault, usar StatefulSet/PVC para Postgres o DB gestionada.

Si quieres, puedo:
- crear un PR que aplique `authorize('employer')` en `POST /api/orders` y `authorize('admin')` en `POST /api/assignments`,
- actualizar el seeder para crear `User` con role `driver` y asociarlos a `Driver` records,
- o añadir una matriz de permisos por endpoint en este mismo archivo.

---
Fecha: 2025-11-04
