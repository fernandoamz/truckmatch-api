-- init-db.sql
-- Script de inicialización de base de datos para Docker

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurar timezone
SET timezone = 'UTC';

-- Mensaje de confirmación
SELECT 'TruckMatch database initialized successfully' AS status;