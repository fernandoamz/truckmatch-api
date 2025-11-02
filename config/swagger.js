// config/swagger.js
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TruckMatch API',
      version: '1.0.0',
      description: 'API completa para plataforma logística TruckMatch - Gestión de transportistas, unidades, órdenes y asignaciones de viaje',
      contact: {
        name: 'TruckMatch Team',
        email: 'api@truckmatch.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Servidor de desarrollo',
      },
      {
        url: 'http://localhost:5001',
        description: 'Servidor de desarrollo (Docker)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido del endpoint de login',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único del usuario',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario',
            },
            role: {
              type: 'string',
              enum: ['driver', 'employer'],
              description: 'Rol del usuario',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Driver: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              description: 'Nombre completo del transportista',
            },
            license: {
              type: 'string',
              description: 'Número de licencia',
            },
            licenseExpirationDate: {
              type: 'string',
              format: 'date',
              description: 'Fecha de vencimiento de la licencia',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'under_review'],
              description: 'Estado del transportista',
            },
            phone: {
              type: 'string',
              description: 'Teléfono de contacto',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email de contacto',
            },
            address: {
              type: 'string',
              description: 'Dirección',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['name', 'license', 'licenseExpirationDate'],
        },
        Unit: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            plateNumber: {
              type: 'string',
              description: 'Número de placa',
            },
            model: {
              type: 'string',
              description: 'Modelo del vehículo',
            },
            type: {
              type: 'string',
              enum: ['truck', 'trailer', 'van', 'pickup'],
              description: 'Tipo de unidad',
            },
            capacity: {
              type: 'number',
              description: 'Capacidad de carga',
            },
            capacityUnit: {
              type: 'string',
              enum: ['tons', 'kg', 'm3'],
              description: 'Unidad de capacidad',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'maintenance', 'assigned'],
              description: 'Estado de la unidad',
            },
            year: {
              type: 'integer',
              description: 'Año del vehículo',
            },
            brand: {
              type: 'string',
              description: 'Marca del vehículo',
            },
            driverId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del transportista asignado',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['plateNumber', 'model', 'type', 'capacity'],
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            orderNumber: {
              type: 'string',
              description: 'Número de orden generado automáticamente',
            },
            origin: {
              type: 'object',
              properties: {
                address: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zipCode: { type: 'string' },
                coordinates: {
                  type: 'object',
                  properties: {
                    lat: { type: 'number' },
                    lng: { type: 'number' },
                  },
                },
              },
              required: ['address', 'city', 'state'],
            },
            destination: {
              type: 'object',
              properties: {
                address: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zipCode: { type: 'string' },
                coordinates: {
                  type: 'object',
                  properties: {
                    lat: { type: 'number' },
                    lng: { type: 'number' },
                  },
                },
              },
              required: ['address', 'city', 'state'],
            },
            cargoDescription: {
              type: 'string',
              description: 'Descripción de la carga',
            },
            cargoWeight: {
              type: 'number',
              description: 'Peso de la carga',
            },
            cargoWeightUnit: {
              type: 'string',
              enum: ['tons', 'kg', 'lbs'],
              description: 'Unidad de peso',
            },
            requirements: {
              type: 'array',
              items: { type: 'string' },
              description: 'Requerimientos especiales',
            },
            status: {
              type: 'string',
              enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
              description: 'Estado de la orden',
            },
            pickupDate: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de recolección',
            },
            deliveryDate: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de entrega',
            },
            rate: {
              type: 'number',
              description: 'Tarifa del servicio',
            },
            currency: {
              type: 'string',
              description: 'Moneda (USD, MXN, etc.)',
            },
            notes: {
              type: 'string',
              description: 'Notas adicionales',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['origin', 'destination', 'cargoDescription', 'cargoWeight'],
        },
        Assignment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            orderId: {
              type: 'string',
              format: 'uuid',
              description: 'ID de la orden',
            },
            driverId: {
              type: 'string',
              format: 'uuid',
              description: 'ID del transportista',
            },
            unitId: {
              type: 'string',
              format: 'uuid',
              description: 'ID de la unidad',
            },
            status: {
              type: 'string',
              enum: ['pending', 'ready', 'started', 'completed', 'cancelled'],
              description: 'Estado de la asignación',
            },
            assignedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de asignación',
            },
            startedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de inicio',
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de finalización',
            },
            notes: {
              type: 'string',
              description: 'Notas de la asignación',
            },
            validationResults: {
              type: 'object',
              description: 'Resultados de validación automática',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['orderId', 'driverId', 'unitId'],
        },
        Document: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            entityType: {
              type: 'string',
              enum: ['driver', 'unit'],
              description: 'Tipo de entidad asociada',
            },
            entityId: {
              type: 'string',
              format: 'uuid',
              description: 'ID de la entidad asociada',
            },
            type: {
              type: 'string',
              enum: ['license', 'insurance', 'registration', 'inspection', 'permit', 'medical_certificate', 'identification', 'other'],
              description: 'Tipo de documento',
            },
            url: {
              type: 'string',
              description: 'URL del archivo',
            },
            fileName: {
              type: 'string',
              description: 'Nombre original del archivo',
            },
            expirationDate: {
              type: 'string',
              format: 'date',
              description: 'Fecha de vencimiento',
            },
            status: {
              type: 'string',
              enum: ['valid', 'expired', 'rejected', 'pending_review'],
              description: 'Estado del documento',
            },
            notes: {
              type: 'string',
              description: 'Notas adicionales',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['entityType', 'entityId', 'type', 'url'],
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indica si la operación fue exitosa',
            },
            message: {
              type: 'string',
              description: 'Mensaje descriptivo',
            },
            data: {
              description: 'Datos de respuesta',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp de la respuesta',
            },
          },
        },
        PaginatedResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiResponse' },
            {
              type: 'object',
              properties: {
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' },
                    hasNext: { type: 'boolean' },
                    hasPrev: { type: 'boolean' },
                  },
                },
              },
            },
          ],
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Mensaje de error',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                  value: {},
                },
              },
              description: 'Errores de validación detallados',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './routes/*.js',
    './routes/*-swagger.js', 
    './controllers/*.js',
    './app.js'
  ],
};

const specs = swaggerJSDoc(options);

module.exports = specs;