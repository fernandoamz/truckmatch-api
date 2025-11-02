/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Gestión de órdenes de servicio
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Crear nueva orden de servicio
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin
 *               - destination
 *               - cargoDescription
 *               - cargoWeight
 *             properties:
 *               origin:
 *                 type: object
 *                 required: [address, city, state]
 *                 properties:
 *                   address:
 *                     type: string
 *                     example: "Warehouse Centro Logístico"
 *                   city:
 *                     type: string
 *                     example: "Ciudad de México"
 *                   state:
 *                     type: string
 *                     example: "CDMX"
 *                   zipCode:
 *                     type: string
 *                     example: "01000"
 *               destination:
 *                 type: object
 *                 required: [address, city, state]
 *                 properties:
 *                   address:
 *                     type: string
 *                     example: "Centro de Distribución Norte"
 *                   city:
 *                     type: string
 *                     example: "Monterrey"
 *                   state:
 *                     type: string
 *                     example: "Nuevo León"
 *                   zipCode:
 *                     type: string
 *                     example: "64000"
 *               cargoDescription:
 *                 type: string
 *                 example: "Productos electrónicos diversos"
 *               cargoWeight:
 *                 type: number
 *                 example: 15.5
 *               cargoWeightUnit:
 *                 type: string
 *                 enum: [tons, kg, lbs]
 *                 example: "tons"
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Transportista con experiencia", "Seguro de carga"]
 *               pickupDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-11-15T08:00:00Z"
 *               deliveryDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-11-16T18:00:00Z"
 *               rate:
 *                 type: number
 *                 example: 25000.00
 *               currency:
 *                 type: string
 *                 example: "MXN"
 *               notes:
 *                 type: string
 *                 example: "Carga frágil, manejo especial"
 *     responses:
 *       201:
 *         description: Orden creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *   get:
 *     summary: Listar órdenes de servicio
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, assigned, in_progress, completed, cancelled]
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista de órdenes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 * 
 * /api/orders/statistics:
 *   get:
 *     summary: Obtener estadísticas de órdenes
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Estadísticas de órdenes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 * 
 * /api/orders/{id}:
 *   get:
 *     summary: Obtener orden por ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Orden encontrada
 *       404:
 *         description: Orden no encontrada
 *   patch:
 *     summary: Actualizar orden
 *     tags: [Orders]
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
 *                 enum: [pending, assigned, in_progress, completed, cancelled]
 *               rate:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Orden actualizada
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Orden no encontrada
 *   delete:
 *     summary: Eliminar orden
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Orden eliminada
 *       400:
 *         description: No se puede eliminar (tiene asignaciones activas)
 */