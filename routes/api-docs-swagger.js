/**
 * @swagger
 * tags:
 *   name: Assignments
 *   description: Gestión de asignaciones de viaje
 */

/**
 * @swagger
 * /api/assignments:
 *   post:
 *     summary: Crear nueva asignación de viaje
 *     tags: [Assignments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - driverId
 *               - unitId
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la orden a asignar
 *               driverId:
 *                 type: string
 *                 format: uuid
 *                 description: ID del transportista
 *               unitId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la unidad
 *               notes:
 *                 type: string
 *                 description: Notas adicionales
 *                 example: "Asignación especial - carga frágil"
 *     responses:
 *       201:
 *         description: Asignación creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Assignment'
 *       400:
 *         description: Error de validación o requisitos no cumplidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Orden, transportista o unidad no encontrados
 *   get:
 *     summary: Listar asignaciones de viaje
 *     tags: [Assignments]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Elementos por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, ready, started, completed, cancelled]
 *         description: Filtrar por estado
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por transportista
 *       - in: query
 *         name: unitId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por unidad
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtrar por orden
 *     responses:
 *       200:
 *         description: Lista de asignaciones
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 * 
 * /api/assignments/{id}:
 *   get:
 *     summary: Obtener asignación por ID
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la asignación
 *     responses:
 *       200:
 *         description: Asignación encontrada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/Assignment'
 *                         - type: object
 *                           properties:
 *                             order:
 *                               $ref: '#/components/schemas/Order'
 *                             driver:
 *                               $ref: '#/components/schemas/Driver'
 *                             unit:
 *                               $ref: '#/components/schemas/Unit'
 *       404:
 *         description: Asignación no encontrada
 *   patch:
 *     summary: Actualizar asignación
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, ready, started, completed, cancelled]
 *                 description: Nuevo estado de la asignación
 *               notes:
 *                 type: string
 *                 description: Notas actualizadas
 *     responses:
 *       200:
 *         description: Asignación actualizada
 *       400:
 *         description: Transición de estado inválida
 *       404:
 *         description: Asignación no encontrada
 *   delete:
 *     summary: Eliminar asignación
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Asignación eliminada
 *       400:
 *         description: No se puede eliminar asignación iniciada
 *       404:
 *         description: Asignación no encontrada
 * 
 * /api/assignments/{id}/revalidate:
 *   post:
 *     summary: Revalidar asignación
 *     tags: [Assignments]
 *     description: Ejecuta nuevamente las validaciones de documentos y disponibilidad
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Asignación revalidada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/Assignment'
 *                         - type: object
 *                           properties:
 *                             validationResults:
 *                               type: object
 *                               description: Resultados actualizados de validación
 *       404:
 *         description: Asignación no encontrada
 */

/**
 * @swagger
 * tags:
 *   name: Units
 *   description: Gestión de unidades de transporte
 */

/**
 * @swagger
 * /api/units:
 *   post:
 *     summary: Crear nueva unidad
 *     tags: [Units]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plateNumber
 *               - model
 *               - type
 *               - capacity
 *             properties:
 *               plateNumber:
 *                 type: string
 *                 example: "TRK-001-MX"
 *               model:
 *                 type: string
 *                 example: "Kenworth T680"
 *               type:
 *                 type: string
 *                 enum: [truck, trailer, van, pickup]
 *                 example: "truck"
 *               capacity:
 *                 type: number
 *                 example: 25.5
 *               capacityUnit:
 *                 type: string
 *                 enum: [tons, kg, m3]
 *                 example: "tons"
 *               year:
 *                 type: integer
 *                 example: 2022
 *               brand:
 *                 type: string
 *                 example: "Kenworth"
 *     responses:
 *       201:
 *         description: Unidad creada exitosamente
 *   get:
 *     summary: Listar unidades
 *     tags: [Units]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, maintenance, assigned]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [truck, trailer, van, pickup]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por placa, modelo o marca
 *     responses:
 *       200:
 *         description: Lista de unidades
 * 
 * /api/units/{id}/assign-driver/{driverId}:
 *   put:
 *     summary: Asignar conductor a unidad
 *     tags: [Units]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la unidad
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del transportista
 *     responses:
 *       200:
 *         description: Conductor asignado exitosamente
 *       400:
 *         description: Conductor no disponible o unidad ya asignada
 *       404:
 *         description: Unidad o conductor no encontrados
 * 
 * /api/units/{id}/unassign-driver:
 *   put:
 *     summary: Desasignar conductor de unidad
 *     tags: [Units]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Conductor desasignado exitosamente
 *       400:
 *         description: Unidad tiene asignaciones activas
 *       404:
 *         description: Unidad no encontrada
 */

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Gestión de documentos
 */

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     summary: Subir documento
 *     tags: [Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - document
 *               - entityType
 *               - entityId
 *               - type
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Archivo a subir (JPG, PNG, PDF, DOC, DOCX)
 *               entityType:
 *                 type: string
 *                 enum: [driver, unit]
 *                 description: Tipo de entidad
 *               entityId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la entidad
 *               type:
 *                 type: string
 *                 enum: [license, insurance, registration, inspection, permit, medical_certificate, identification, other]
 *                 description: Tipo de documento
 *               expirationDate:
 *                 type: string
 *                 format: date
 *                 description: Fecha de vencimiento (opcional)
 *               notes:
 *                 type: string
 *                 description: Notas adicionales
 *     responses:
 *       201:
 *         description: Documento subido exitosamente
 *       400:
 *         description: Error de validación o archivo inválido
 *       404:
 *         description: Entidad no encontrada
 * 
 * /api/documents:
 *   get:
 *     summary: Listar documentos
 *     tags: [Documents]
 *     parameters:
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *           enum: [driver, unit]
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [license, insurance, registration, inspection, permit, medical_certificate, identification, other]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [valid, expired, rejected, pending_review]
 *     responses:
 *       200:
 *         description: Lista de documentos
 * 
 * /api/documents/{id}:
 *   patch:
 *     summary: Actualizar documento
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [valid, expired, rejected, pending_review]
 *               expirationDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Documento actualizado
 *       404:
 *         description: Documento no encontrado
 */