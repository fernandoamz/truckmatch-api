# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Local Development
```bash
npm install              # Install dependencies
npm run dev             # Start development server with nodemon (port 5000)
npm start               # Start production server
npm run seed            # Populate database with demo data
npm run migrate         # Run Sequelize migrations
```

### Docker Development
```bash
# On Windows (PowerShell)
.\docker-commands.ps1 dev     # Start dev environment (port 5001)
.\docker-commands.ps1 prod    # Start production (port 5000)
.\docker-commands.ps1 seed    # Populate database in Docker
.\docker-commands.ps1 logs    # View logs
.\docker-commands.ps1 shell   # Access container
.\docker-commands.ps1 stop    # Stop services
.\docker-commands.ps1 clean   # Clean all containers and volumes

# Using npm
npm run docker:dev      # Start dev environment
npm run docker:prod     # Start production
npm run docker:stop     # Stop all services
npm run docker:clean    # Clean volumes
```

## Architecture Overview

### Core Entities & Relationships

This is a logistics platform API with a specific hierarchy:

```
Users (clientId) → Orders → Assignments ← Drivers (with Units)
                                     ↑
                              Documents (polymorphic)
```

**Key relationships:**
- `User` has many `Orders` (via `clientId`)
- `Driver` has many `Units` (one-to-many: a driver can have multiple vehicles)
- `Order` has one `Assignment` (one-to-one)
- `Assignment` references one `Order`, one `Driver`, and one `Unit`
- `Documents` use polymorphic association: belong to either `Driver` or `Unit` via `entityType` and `entityId`

### Assignment Validation System

**Critical business logic:** Assignments undergo automatic validation before being created. The system checks:

1. **Driver validation:**
   - Status must be `active`
   - License expiration date must be valid (not expired)
   - Must have at least one valid, non-expired document
   - Cannot have another active assignment (`ready` or `started` status)

2. **Unit validation:**
   - Status must be `active` or `assigned`
   - Must have at least one valid, non-expired document
   - Cannot have another active assignment (`ready` or `started` status)

3. **Order availability:**
   - Order must exist and have `pending` status
   - Cannot already have an assignment

The validation logic is centralized in `validateAssignmentRequirements()` in `assignmentController.js`. Results are stored in the `validationResults` JSON field.

### Status State Machines

**Driver status flow:**
- `under_review` → `active` → `inactive`

**Unit status flow:**
- `active` ↔ `assigned` (when trip assigned)
- `maintenance` (can transition from active/inactive)
- `inactive`

**Order status flow:**
- `pending` → `assigned` → `in_progress` → `completed`
- Any → `cancelled`

**Assignment status flow:**
- `pending` → `ready` → `started` → `completed`
- Any → `cancelled`

### Document Expiration System

- Automatic background check runs every 24 hours (started in `app.js`)
- Documents with `expirationDate` past current date are marked as `expired`
- Function: `checkExpiredDocuments()` in `documentController.js`
- Expired documents block new assignments

### Response Format

All endpoints use standardized response handlers (middleware/responseHandler.js):

**Success:**
```javascript
res.success(data, message, statusCode)
```

**Paginated:**
```javascript
res.paginated(data, { page, limit, total }, message)
```

**Error:**
```javascript
res.error(message, statusCode, errors)
```

### Authentication

- JWT-based authentication (middleware/auth.js)
- All `/api/*` routes require `Authorization: Bearer <token>` header
- Middleware: `authenticateToken` (enforced) or `attachUserFromAuthHeader` (optional, used for GraphQL)
- Token contains: `userId`, `email`, `role`

### GraphQL Support

- Legacy GraphQL endpoint exists at `/graphql` for backwards compatibility
- GraphQL Playground enabled in development mode
- New development should prefer REST endpoints

## File Structure

```
controllers/     # Business logic for each entity (driver, unit, order, assignment, document)
middleware/      # auth.js (JWT), errorHandler.js, responseHandler.js
models/          # Sequelize models with relationships defined in index.js
routes/          # Express route definitions
seeders/         # demo-data.js creates test users, drivers, units, orders
config/          # db.js (Sequelize), swagger.js
graphql/         # Legacy GraphQL schema
uploads/         # File storage (documents/, served at /uploads/*)
```

## Environment Variables

Required variables (see .env.example):
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: development or production

## Testing Demo Data

After running `npm run seed`, test credentials:
- Users: `client@truckmatch.com` or `admin@truckmatch.com`
- Password: `demo123`
- Includes 2 drivers, 2 units, 1 pending order

## API Documentation

- Swagger UI available at: `http://localhost:5000/api-docs`
- Interactive API testing with "Try it out" feature
- Authentication: Click "Authorize" button and add Bearer token

## Key Implementation Notes

- **Always use UUIDs for primary keys** (all models use UUID v4)
- **Sequelize sync:** Models auto-create tables on startup (`syncModels()` in models/index.js)
- **File uploads:** Use multer middleware, max 5MB, stored in `uploads/documents/`
- **Error handling:** All async controller methods use `next(error)` for centralized error handling
- **Validation:** Uses express-validator for input validation
- **Database:** PostgreSQL with Sequelize ORM (no raw SQL queries)
