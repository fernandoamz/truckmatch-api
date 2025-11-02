# Dockerfile
FROM node:20-alpine

# Instalar dumb-init para manejo correcto de señales
RUN apk add --no-cache dumb-init

# Crear directorio de trabajo
WORKDIR /app

# Crear directorios necesarios
RUN mkdir -p uploads/documents

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --only=production && npm cache clean --force

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar código fuente
COPY --chown=nodejs:nodejs . .

# Cambiar permisos del directorio de uploads
RUN chown -R nodejs:nodejs /app/uploads

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
