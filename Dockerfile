# Dockerfile
FROM node:20-alpine

# Instalar dumb-init para manejo correcto de señales
RUN apk add --no-cache dumb-init

# Crear directorio de trabajo
WORKDIR /app

# Crear directorios necesarios
RUN mkdir -p uploads/documents
# Copiar archivos de dependencias (package.json + package-lock.json si existe)
COPY package.json package-lock.json* ./

# Instalar dependencias de producción de forma reproducible
# preferimos `npm ci` cuando existe package-lock.json, caeback a `npm install` si no
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      npm install --only=production; \
    fi \
    && npm cache clean --force

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar código fuente
# Copiar código fuente (propiedad al usuario no-root)
COPY --chown=nodejs:nodejs . .

# Asegurar permisos de todo /app para el usuario nodejs (incluye node_modules)
RUN chown -R nodejs:nodejs /app

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Comando de inicio con dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
