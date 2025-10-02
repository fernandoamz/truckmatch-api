# Comandos útiles para la base de datos

## Conectarse a PostgreSQL
docker exec -it truckmatch-api-postgres-1 psql -U postgres -d truckmatch

## Comandos SQL útiles
\dt                     # Listar todas las tablas
\d users               # Describir tabla users
SELECT * FROM users;   # Ver todos los usuarios
SELECT * FROM units;   # Ver todas las unidades

## Ver logs de la API
docker logs truckmatch-api-truckmatch-api-1 -f

## Ver estado de todos los contenedores
docker-compose ps

## Reiniciar la API
docker-compose restart truckmatch-api
