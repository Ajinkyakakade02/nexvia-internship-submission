import swaggerJSDoc from 'swagger-jsdoc';
import env from './env.js';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: `${env.PLATFORM_NAME} API Documentation`,
    version: '1.0.0',
    description: 'Multi-Vendor E-Commerce Marketplace REST API Documentation',
    contact: {
      name: 'API Support',
      email: env.ADMIN_EMAIL
    }
  },
  servers: [
    {
      url: `${env.API_BASE_URL}/api`,
      description: 'API Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT Bearer token'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const swaggerOptions: swaggerJSDoc.Options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts', './dist/routes/*.js']
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
export default swaggerSpec;
