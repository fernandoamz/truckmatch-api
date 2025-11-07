-- init-db.sql
-- Script de inicialización de base de datos para Docker

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurar timezone
SET timezone = 'UTC';

-- Mensaje de confirmación
SELECT 'TruckMatch database initialized successfully' AS status;

-- Crear usuarios de aplicación (si no existen) y asignarles contraseña
DO $$
BEGIN
	IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'truckmatch_user') THEN
		CREATE ROLE truckmatch_user WITH LOGIN PASSWORD 'truckmatch_pass_2024';
	ELSE
		ALTER ROLE truckmatch_user WITH ENCRYPTED PASSWORD 'truckmatch_pass_2024';
	END IF;
  
	IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'truckmatch_dev') THEN
		CREATE ROLE truckmatch_dev WITH LOGIN PASSWORD 'truckmatch_dev_pass';
	ELSE
		ALTER ROLE truckmatch_dev WITH ENCRYPTED PASSWORD 'truckmatch_dev_pass';
	END IF;
END$$;

-- Asegurar que la base declarada (POSTGRES_DB) sea propiedad del usuario de la aplicación
-- En docker-entrypoint-initdb.d esta consulta se ejecuta contra la BD indicada por POSTGRES_DB
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_database WHERE datname = current_database()) THEN
		-- Intentar asignar la propiedad de la base al usuario app (no falla si ya es dueño)
		BEGIN
			EXECUTE format('ALTER DATABASE %I OWNER TO %I', current_database(), 'truckmatch_user');
		EXCEPTION WHEN others THEN
			-- si no se puede cambiar el owner por algún motivo, ignorar para no detener la inicialización
			RAISE NOTICE 'Could not change owner of database to truckmatch_user: %', SQLERRM;
		END;
	END IF;
END$$;

-- Otorgar permisos básicos al usuario de la aplicación sobre la BD y futuros esquemas
GRANT CONNECT ON DATABASE "truckmatch_db" TO truckmatch_user;
\connect truckmatch_db
GRANT USAGE ON SCHEMA public TO truckmatch_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO truckmatch_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO truckmatch_user;