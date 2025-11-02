
# TruckMatch API 🚛

Backend completo para plataforma logística que maneja la operación web hasta la asignación de viajes.

## 📋 Características

- **Gestión de Transportistas**: Registro, validación y documentación
- **Gestión de Unidades**: Vehículos con capacidades y asignaciones
- **Sistema de Documentos**: Upload y validación con fechas de vencimiento
- **Órdenes de Servicio**: Creación y seguimiento de carga
- **Asignaciones de Viaje**: Validación automática y asignación inteligente
- **Autenticación JWT**: Sistema seguro de autenticación
- **API REST completa**: Endpoints bien estructurados
- **GraphQL**: Compatibilidad con GraphQL existente

## 🚀 Instalación Rápida

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd truckmatch-api

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de base de datos

# 4. Ejecutar en modo desarrollo
npm run dev

# 5. (Opcional) Poblar con datos de prueba
npm run seed
```

## 📊 Estructura de Base de Datos

### Modelos Principales

- **Users**: Usuarios del sistema (clientes, administradores)
- **Drivers**: Transportistas con licencias y documentación
- **Units**: Vehículos con capacidades y especificaciones
- **Documents**: Documentos asociados a drivers o units
- **Orders**: Órdenes de servicio con origen/destino
- **Assignments**: Asignaciones de viaje con validaciones

## 🛣️ API Endpoints

### Autenticación
```
POST /auth/register    - Registro de usuarios
POST /auth/login       - Inicio de sesión
```

### Transportistas (Drivers)
```
POST   /api/drivers         - Crear transportista
GET    /api/drivers         - Listar transportistas (paginado)
GET    /api/drivers/:id     - Obtener transportista
PUT    /api/drivers/:id     - Actualizar transportista
DELETE /api/drivers/:id     - Eliminar transportista
```

### Unidades (Units)
```
POST   /api/units                           - Crear unidad
GET    /api/units                           - Listar unidades (paginado)
GET    /api/units/:id                       - Obtener unidad
PUT    /api/units/:id                       - Actualizar unidad
PUT    /api/units/:id/assign-driver/:driverId - Asignar conductor
PUT    /api/units/:id/unassign-driver       - Desasignar conductor
DELETE /api/units/:id                       - Eliminar unidad
```

### Documentos (Documents)
```
POST   /api/documents/upload   - Subir documento
GET    /api/documents          - Listar documentos (filtros)
GET    /api/documents/:id      - Obtener documento
PATCH  /api/documents/:id      - Actualizar documento
DELETE /api/documents/:id      - Eliminar documento
```

### Órdenes (Orders)
```
POST   /api/orders            - Crear orden
GET    /api/orders            - Listar órdenes (paginado)
GET    /api/orders/statistics - Estadísticas de órdenes
GET    /api/orders/:id        - Obtener orden
PATCH  /api/orders/:id        - Actualizar orden
DELETE /api/orders/:id        - Eliminar orden
```

### Asignaciones (Assignments)
```
POST   /api/assignments               - Crear asignación
GET    /api/assignments               - Listar asignaciones
GET    /api/assignments/:id           - Obtener asignación
PATCH  /api/assignments/:id           - Actualizar asignación
POST   /api/assignments/:id/revalidate - Revalidar asignación
DELETE /api/assignments/:id           - Eliminar asignación
```

## 📝 Scripts Disponibles

```bash
npm start          # Iniciar en producción
npm run dev        # Iniciar en desarrollo (con nodemon)
npm run seed       # Poblar base de datos con datos demo
npm run migrate    # Ejecutar migraciones (si usas Sequelize CLI)
```

## 🔧 Configuración

### Variables de Entorno Requeridas

```env
# Base de datos
DATABASE_URL=postgresql://user:pass@localhost:5432/truckmatch_db

# JWT
JWT_SECRET=your-super-secret-key

# Servidor
PORT=5000
NODE_ENV=development
```

### Datos de Prueba

Después de ejecutar `npm run seed`, tendrás:

- **2 usuarios demo**: 
  - `client@truckmatch.com` / `admin@truckmatch.com`
  - Contraseña: `demo123`
- **2 transportistas** con documentos válidos
- **2 unidades** asignadas a los transportistas  
- **1 orden pendiente** lista para asignar

## 🏗️ Arquitectura

```
├── controllers/     # Lógica de negocio
├── middleware/      # Autenticación, errores, respuestas
├── models/          # Modelos Sequelize con relaciones
├── routes/          # Definición de rutas REST
├── seeders/         # Datos de prueba
├── uploads/         # Archivos subidos
├── config/          # Configuración de base de datos
└── app.js          # Aplicación principal
```

## 🔒 Autenticación

Todas las rutas API requieren token JWT en el header:
```
Authorization: Bearer <your-jwt-token>
```

## 📤 Subida de Archivos

Los documentos se suben a `/api/documents/upload` y se almacenan en `/uploads/documents/`.

Formatos soportados: JPG, PNG, PDF, DOC, DOCX (máximo 5MB)

## ✅ Validaciones Automáticas

### Asignaciones de Viaje
- Documentos de transportista válidos y vigentes
- Documentos de unidad válidos y vigentes  
- Disponibilidad (sin asignaciones activas)
- Estado activo de transportista y unidad

### Documentos
- Verificación automática de vencimiento
- Cambio de estado a "expired" cuando corresponde

## 🎯 Endpoints de Utilidad

```
GET /health          # Estado del servicio
GET /uploads/*       # Servir archivos subidos
POST /graphql        # Endpoint GraphQL (compatibilidad)
```

## 📊 Respuestas API

### Formato Estándar de Respuesta
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "timestamp": "2024-10-23T15:30:00.000Z"
}
```

### Respuestas Paginadas
```json
{
  "success": true,
  "message": "Data retrieved successfully", 
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🚦 Estados del Sistema

### Estados de Transportista
- `active`: Disponible para asignaciones
- `inactive`: No disponible  
- `under_review`: En proceso de validación

### Estados de Unidad
- `active`: Disponible
- `inactive`: No disponible
- `maintenance`: En mantenimiento
- `assigned`: Asignada a viaje

### Estados de Orden
- `pending`: Esperando asignación
- `assigned`: Asignada a transportista
- `in_progress`: En tránsito
- `completed`: Entregada
- `cancelled`: Cancelada

### Estados de Asignación
- `pending`: Pendiente validación
- `ready`: Lista para iniciar
- `started`: En progreso
- `completed`: Completada
- `cancelled`: Cancelada

## � Docker

### Desarrollo con Docker

```bash
# Iniciar entorno completo de desarrollo
./docker-commands.sh dev
# O usando npm
npm run docker:dev

# Ver logs en tiempo real
./docker-commands.sh logs

# Acceder al contenedor
./docker-commands.sh shell

# Poblar base de datos
./docker-commands.sh seed
```

### Producción con Docker

```bash
# Construir imagen
./docker-commands.sh build

# Iniciar en producción
./docker-commands.sh prod

# Ver estado de servicios
./docker-commands.sh status
```

### Servicios Docker Disponibles

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **API (prod)** | 5000 | Servidor principal |
| **API (dev)** | 5001 | Servidor desarrollo |
| **PostgreSQL** | 5432 | Base de datos |
| **pgAdmin** | 8080 | Administrador DB |

### Comandos Docker Útiles

```bash
./docker-commands.sh help    # Ver todos los comandos
./docker-commands.sh stop    # Parar servicios
./docker-commands.sh clean   # Limpiar todo
./docker-commands.sh db-shell # Acceder a PostgreSQL
```

## �🔧 Desarrollo

Para desarrollo, el servidor incluye:
- Recarga automática con nodemon
- GraphQL Playground en `/graphql`
- Logs detallados de errores
- Middleware de respuestas estandarizadas
- **Hot reload** en Docker (modo dev)
- **Health checks** automáticos

---

**Versión**: 1.0.0  
**Autor**: TruckMatch Team  
**Licencia**: ISC