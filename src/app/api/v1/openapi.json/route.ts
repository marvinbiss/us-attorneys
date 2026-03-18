/**
 * GET /api/v1/openapi.json
 *
 * Serves the OpenAPI 3.0 specification for the US Attorneys public API.
 * Consumed by the docs page (Swagger UI / Redoc) and external integrations.
 */

import { NextResponse } from 'next/server'
import { SITE_URL, SITE_NAME } from '@/lib/seo/config'

function buildSpec() {
  return {
    openapi: '3.0.3',
    info: {
      title: `${SITE_NAME} API`,
      description:
        'Public API for the US Attorneys directory. Access aggregated attorney statistics, pricing data, and search attorneys across all 50 states.',
      version: '1.0.0',
      contact: {
        name: `${SITE_NAME} Support`,
        url: `${SITE_URL}/contact`,
      },
      license: {
        name: 'Attribution Required',
        url: `${SITE_URL}/api/v1/docs`,
      },
    },
    servers: [
      {
        url: SITE_URL || 'https://us-attorneys.com',
        description: 'Production',
      },
    ],
    paths: {
      '/api/search': {
        get: {
          operationId: 'searchAttorneys',
          summary: 'Search attorneys',
          description:
            'Full-text search across attorneys with filters for practice area, state, city, rating, and more. Supports geo-distance sorting and subscription-boosted ranking.',
          tags: ['Search'],
          parameters: [
            { name: 'q', in: 'query', description: 'Free-text search query', schema: { type: 'string' } },
            { name: 'pa', in: 'query', description: 'Practice area slug (e.g. `personal-injury`)', schema: { type: 'string' } },
            { name: 'state', in: 'query', description: 'State code (e.g. `CA`)', schema: { type: 'string', maxLength: 2 } },
            { name: 'city', in: 'query', description: 'City name', schema: { type: 'string' } },
            { name: 'rating', in: 'query', description: 'Minimum rating (1-5)', schema: { type: 'number', minimum: 1, maximum: 5 } },
            { name: 'sort', in: 'query', description: 'Sort order', schema: { type: 'string', enum: ['relevance', 'rating', 'reviews', 'distance', 'name'] } },
            { name: 'verified', in: 'query', description: 'Filter verified attorneys only', schema: { type: 'string', enum: ['true'] } },
            { name: 'free_consultation', in: 'query', description: 'Filter attorneys offering free consultations', schema: { type: 'string', enum: ['true'] } },
            { name: 'page', in: 'query', description: 'Page number (default 1)', schema: { type: 'integer', minimum: 1 } },
            { name: 'limit', in: 'query', description: 'Results per page (default 20, max 100)', schema: { type: 'integer', minimum: 1, maximum: 100 } },
          ],
          responses: {
            '200': {
              description: 'Search results with pagination',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } },
            },
            '400': {
              description: 'Invalid parameters',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            '429': {
              description: 'Rate limit exceeded',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
          },
        },
      },
      '/api/attorneys/{id}': {
        get: {
          operationId: 'getAttorneyById',
          summary: 'Get attorney profile',
          description:
            'Returns the full public profile of an attorney including specialties, bar admissions, case results, reviews summary, and contact information.',
          tags: ['Attorneys'],
          parameters: [
            { name: 'id', in: 'path', required: true, description: 'Attorney UUID or slug', schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Attorney profile retrieved',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/AttorneyProfileResponse' } } },
            },
            '404': {
              description: 'Attorney not found',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            '429': {
              description: 'Rate limit exceeded',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
          },
        },
      },
      '/api/reviews': {
        get: {
          operationId: 'getReviews',
          summary: 'Get reviews for an attorney',
          description:
            'Returns published reviews with stats (average rating, distribution, recommendation rate).',
          tags: ['Reviews'],
          parameters: [
            { name: 'attorneyId', in: 'query', description: 'Attorney UUID', schema: { type: 'string', format: 'uuid' } },
            { name: 'bookingId', in: 'query', description: 'Booking UUID (check if review exists)', schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': {
              description: 'Reviews retrieved',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ReviewsResponse' } } },
            },
            '429': {
              description: 'Rate limit exceeded',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
          },
        },
        post: {
          operationId: 'createReview',
          summary: 'Submit a review for an attorney',
          description:
            'Creates a new review. Requires authentication. Reviews are moderated before publication.',
          tags: ['Reviews'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateReviewRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Review submitted (pending moderation)',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } },
            },
            '400': {
              description: 'Validation error',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            '401': {
              description: 'Authentication required',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            '429': {
              description: 'Rate limit exceeded',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
          },
        },
      },
      '/api/availability': {
        get: {
          operationId: 'getAvailability',
          summary: 'Get attorney availability slots',
          description:
            'Returns available booking slots for an attorney. Useful for displaying a calendar of openings.',
          tags: ['Availability'],
          parameters: [
            { name: 'attorneyId', in: 'query', required: true, description: 'Attorney UUID', schema: { type: 'string', format: 'uuid' } },
            { name: 'date', in: 'query', description: 'Specific date (YYYY-MM-DD)', schema: { type: 'string', format: 'date' } },
            { name: 'month', in: 'query', description: 'Month (YYYY-MM)', schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Availability slots retrieved',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } },
            },
            '400': {
              description: 'Missing required attorneyId parameter',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            '429': {
              description: 'Rate limit exceeded',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
          },
        },
      },
      '/api/questions': {
        get: {
          operationId: 'getQuestions',
          summary: 'List legal questions',
          description:
            'Returns community legal questions, optionally filtered by specialty. Supports pagination.',
          tags: ['Q&A'],
          parameters: [
            { name: 'specialtyId', in: 'query', description: 'Filter by specialty UUID', schema: { type: 'string', format: 'uuid' } },
            { name: 'status', in: 'query', description: 'Filter by status', schema: { type: 'string', enum: ['open', 'answered', 'closed'] } },
            { name: 'page', in: 'query', description: 'Page number', schema: { type: 'integer', minimum: 1 } },
            { name: 'limit', in: 'query', description: 'Results per page', schema: { type: 'integer', minimum: 1, maximum: 50 } },
          ],
          responses: {
            '200': {
              description: 'Questions retrieved',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResponse' } } },
            },
            '429': {
              description: 'Rate limit exceeded',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
          },
        },
        post: {
          operationId: 'createQuestion',
          summary: 'Ask a legal question',
          description:
            'Submit a legal question to be answered by attorneys. Requires authentication.',
          tags: ['Q&A'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateQuestionRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Question submitted',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } },
            },
            '400': {
              description: 'Validation error',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            '401': {
              description: 'Authentication required',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            '429': {
              description: 'Rate limit exceeded',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
          },
        },
      },
      '/api/endorsements': {
        get: {
          operationId: 'getEndorsements',
          summary: 'Get peer endorsements for an attorney',
          description:
            'Returns peer endorsements from other attorneys, optionally filtered by specialty.',
          tags: ['Endorsements'],
          parameters: [
            { name: 'attorneyId', in: 'query', required: true, description: 'Attorney UUID', schema: { type: 'string', format: 'uuid' } },
            { name: 'specialtyId', in: 'query', description: 'Filter by specialty UUID', schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            '200': {
              description: 'Endorsements retrieved',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } },
            },
            '400': {
              description: 'Missing required attorneyId parameter',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            '429': {
              description: 'Rate limit exceeded',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
          },
        },
      },
      '/api/specialties': {
        get: {
          operationId: 'getSpecialties',
          summary: 'List all practice areas',
          description:
            'Returns all active legal practice areas (specialties) with their categories, slugs, and attorney counts.',
          tags: ['Specialties'],
          responses: {
            '200': {
              description: 'Specialties list retrieved',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } },
            },
            '429': {
              description: 'Rate limit exceeded',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
          },
        },
      },
      '/api/health': {
        get: {
          operationId: 'healthCheck',
          summary: 'Health check',
          description:
            'Returns the health status of the API, including database connectivity and uptime. No authentication required.',
          tags: ['System'],
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', enum: ['ok', 'degraded'] },
                      timestamp: { type: 'string', format: 'date-time' },
                      version: { type: 'string' },
                      database: { type: 'string', enum: ['connected', 'disconnected'] },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/stats': {
        get: {
          operationId: 'getStats',
          summary: 'Regional or state statistics',
          description:
            'Returns aggregated statistics for all practice areas in a region or state.',
          tags: ['Statistics'],
          parameters: [
            {
              name: 'region',
              in: 'query',
              description: 'Region slug (e.g. `california`, `new-york`)',
              schema: { type: 'string' },
            },
            {
              name: 'state',
              in: 'query',
              description: 'State code (e.g. `CA`, `NY`)',
              schema: { type: 'string', maxLength: 2 },
            },
          ],
          responses: {
            '200': {
              description: 'Statistics retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/StatsResponse' },
                },
              },
            },
            '400': {
              description: 'Missing required parameters',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/v1/pricing': {
        get: {
          operationId: 'getPricing',
          summary: 'Practice area statistics by location',
          description:
            'Returns aggregated barometer statistics for a practice area, optionally filtered by city, state, or region.',
          tags: ['Pricing'],
          parameters: [
            {
              name: 'specialty',
              in: 'query',
              required: true,
              description: 'Practice area slug (e.g. `personal-injury`, `criminal-defense`)',
              schema: { type: 'string' },
            },
            {
              name: 'city',
              in: 'query',
              description: 'City slug (e.g. `new-york`, `los-angeles`)',
              schema: { type: 'string' },
            },
            {
              name: 'state',
              in: 'query',
              description: 'State code (e.g. `CA`)',
              schema: { type: 'string', maxLength: 2 },
            },
            {
              name: 'region',
              in: 'query',
              description: 'Region slug',
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Pricing data retrieved successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PricingResponse' },
                },
              },
            },
            '400': {
              description: 'Missing required specialty parameter',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/v1/docs': {
        get: {
          operationId: 'getDocs',
          summary: 'API documentation page',
          description: 'Interactive API documentation rendered with Swagger UI.',
          tags: ['Documentation'],
          responses: {
            '200': {
              description: 'HTML documentation page',
              content: {
                'text/html': {
                  schema: { type: 'string' },
                },
              },
            },
          },
        },
      },
      '/api/bookings': {
        get: {
          operationId: 'getBookings',
          summary: 'Get attorney bookings or available slots',
          description:
            'Retrieves bookings for an attorney (requires authentication). Filter by date or month.',
          tags: ['Bookings'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'attorneyId', in: 'query', required: true, description: 'Attorney UUID', schema: { type: 'string', format: 'uuid' } },
            { name: 'date', in: 'query', description: 'Specific date (YYYY-MM-DD)', schema: { type: 'string', format: 'date' } },
            { name: 'month', in: 'query', description: 'Month for available slots (YYYY-MM)', schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Bookings or slots retrieved',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } },
            },
            '401': {
              description: 'Authentication required',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            '429': {
              description: 'Rate limit exceeded',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
          },
        },
        post: {
          operationId: 'createBooking',
          summary: 'Create a new booking',
          description:
            'Creates a video consultation booking using an atomic RPC to prevent double-booking. Supports idempotency via X-Idempotency-Key header.',
          tags: ['Bookings'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'X-Idempotency-Key', in: 'header', description: 'Client-generated idempotency key to prevent duplicate bookings', schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateBookingRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Booking confirmed',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } } },
            },
            '400': {
              description: 'Validation error',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            '401': {
              description: 'Authentication required',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            '409': {
              description: 'Slot unavailable or duplicate booking',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            '429': {
              description: 'Rate limit exceeded',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
          },
        },
      },
      '/api/auth/signin': {
        post: {
          operationId: 'signIn',
          summary: 'Sign in with email and password',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SignInRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Authentication successful',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' },
                },
              },
            },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            '429': {
              description: 'Rate limit exceeded',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/auth/signup': {
        post: {
          operationId: 'signUp',
          summary: 'Create a new account',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SignUpRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Account created (email verification required)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            '429': {
              description: 'Rate limit exceeded',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/contact': {
        post: {
          operationId: 'sendContactMessage',
          summary: 'Send a contact form message',
          tags: ['Contact'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ContactRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Message sent successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            '429': {
              description: 'Rate limit exceeded',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Supabase access token from /api/auth/signin',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: {
                code: {
                  type: 'string',
                  enum: [
                    'VALIDATION_ERROR',
                    'NOT_FOUND',
                    'UNAUTHORIZED',
                    'FORBIDDEN',
                    'RATE_LIMIT_EXCEEDED',
                    'CONFLICT',
                    'PAYMENT_REQUIRED',
                    'GATEWAY_TIMEOUT',
                    'EXTERNAL_SERVICE_ERROR',
                    'INTERNAL_ERROR',
                  ],
                  description: 'Machine-readable error code',
                },
                message: {
                  type: 'string',
                  description: 'Human-readable error description',
                },
                details: {
                  type: 'object',
                  additionalProperties: true,
                  description: 'Additional error context (e.g., field validation errors)',
                },
              },
            },
          },
          example: {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid email address',
              details: { fields: { email: 'Invalid email address' } },
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          required: ['success', 'data'],
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: { type: 'object', additionalProperties: true },
            meta: {
              type: 'object',
              additionalProperties: true,
              description: 'Optional metadata (pagination, source, etc.)',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          required: ['success', 'data', 'meta'],
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: { type: 'array', items: { type: 'object' } },
            meta: {
              type: 'object',
              required: ['pagination'],
              properties: {
                pagination: {
                  type: 'object',
                  required: ['page', 'limit', 'total', 'totalPages', 'hasNextPage', 'hasPrevPage'],
                  properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' },
                    hasNextPage: { type: 'boolean' },
                    hasPrevPage: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
        StatsResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [true] },
            summary: {
              type: 'object',
              properties: {
                zone: { type: 'string' },
                type: { type: 'string', enum: ['region', 'state'] },
                total_attorneys: { type: 'integer' },
                average_rating: { type: 'number', nullable: true },
                total_reviews: { type: 'integer' },
                specialty_count: { type: 'integer' },
              },
            },
            data: { type: 'array', items: { $ref: '#/components/schemas/BarometerEntry' } },
            attribution: { $ref: '#/components/schemas/Attribution' },
          },
        },
        PricingResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: { type: 'array', items: { $ref: '#/components/schemas/BarometerEntry' } },
            meta: {
              type: 'object',
              properties: {
                source: { type: 'string' },
                url: { type: 'string' },
                updated_at: { type: 'string', nullable: true },
              },
            },
            attribution: { $ref: '#/components/schemas/Attribution' },
          },
        },
        BarometerEntry: {
          type: 'object',
          properties: {
            metier: { type: 'string', description: 'Practice area name' },
            metier_slug: { type: 'string', description: 'Practice area slug' },
            ville: { type: 'string', nullable: true, description: 'City name' },
            ville_slug: { type: 'string', nullable: true },
            departement: { type: 'string', nullable: true, description: 'State name' },
            departement_code: { type: 'string', nullable: true, description: 'State code' },
            region: { type: 'string', nullable: true },
            region_slug: { type: 'string', nullable: true },
            nb_attorneys: { type: 'integer' },
            note_moyenne: { type: 'number', nullable: true, description: 'Average rating' },
            nb_avis: { type: 'integer', description: 'Review count' },
            taux_verification: { type: 'number', nullable: true, description: 'Verification rate (0-1)' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Attribution: {
          type: 'object',
          properties: {
            text: { type: 'string' },
            url: { type: 'string', format: 'uri' },
            licence: { type: 'string' },
          },
        },
        ReviewsResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: {
              type: 'object',
              properties: {
                reviews: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      rating: { type: 'integer', minimum: 1, maximum: 5 },
                      comment: { type: 'string', nullable: true },
                      would_recommend: { type: 'boolean' },
                      client_name: { type: 'string' },
                      created_at: { type: 'string', format: 'date-time' },
                    },
                  },
                },
                stats: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer' },
                    average: { type: 'number' },
                    recommendRate: { type: 'integer' },
                    distribution: {
                      type: 'array',
                      items: { type: 'integer' },
                      minItems: 5,
                      maxItems: 5,
                    },
                  },
                },
              },
            },
          },
        },
        SignInRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 1 },
            rememberMe: { type: 'boolean' },
          },
        },
        SignUpRequest: {
          type: 'object',
          required: ['email', 'password', 'confirmPassword', 'firstName', 'lastName', 'acceptTerms'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            confirmPassword: { type: 'string' },
            firstName: { type: 'string', minLength: 2 },
            lastName: { type: 'string', minLength: 2 },
            phone: { type: 'string' },
            acceptTerms: { type: 'boolean', enum: [true] },
          },
        },
        CreateBookingRequest: {
          type: 'object',
          required: ['attorneyId', 'slotId', 'clientName', 'clientPhone', 'clientEmail'],
          properties: {
            attorneyId: { type: 'string', format: 'uuid' },
            slotId: { type: 'string', format: 'uuid' },
            clientName: { type: 'string', minLength: 2 },
            clientPhone: { type: 'string', description: 'US phone number' },
            clientEmail: { type: 'string', format: 'email' },
            serviceDescription: { type: 'string', maxLength: 1000 },
            address: { type: 'string', maxLength: 500 },
            paymentIntentId: { type: 'string' },
            depositAmount: { type: 'number', minimum: 0, maximum: 10000 },
          },
        },
        ContactRequest: {
          type: 'object',
          required: ['name', 'email', 'subject', 'message'],
          properties: {
            name: { type: 'string', minLength: 2 },
            email: { type: 'string', format: 'email' },
            subject: { type: 'string', minLength: 1 },
            message: { type: 'string', minLength: 10 },
          },
        },
        AttorneyProfileResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                name: { type: 'string' },
                slug: { type: 'string' },
                bar_number: { type: 'string', nullable: true },
                bar_state: { type: 'string', nullable: true },
                firm_name: { type: 'string', nullable: true },
                address_city: { type: 'string', nullable: true },
                address_state: { type: 'string', nullable: true },
                is_verified: { type: 'boolean' },
                rating_average: { type: 'number', nullable: true },
                review_count: { type: 'integer' },
                years_experience: { type: 'integer', nullable: true },
                bio: { type: 'string', nullable: true },
                phone: { type: 'string', nullable: true },
                website: { type: 'string', nullable: true },
                specialties: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      slug: { type: 'string' },
                      is_primary: { type: 'boolean' },
                    },
                  },
                },
                bar_admissions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      state: { type: 'string' },
                      bar_number: { type: 'string' },
                      status: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        CreateReviewRequest: {
          type: 'object',
          required: ['attorneyId', 'rating'],
          properties: {
            attorneyId: { type: 'string', format: 'uuid' },
            bookingId: { type: 'string', format: 'uuid', description: 'Optional booking reference' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            comment: { type: 'string', maxLength: 5000 },
            would_recommend: { type: 'boolean' },
          },
        },
        CreateQuestionRequest: {
          type: 'object',
          required: ['title', 'body'],
          properties: {
            title: { type: 'string', minLength: 10, maxLength: 200 },
            body: { type: 'string', minLength: 20, maxLength: 5000 },
            specialtyId: { type: 'string', format: 'uuid', description: 'Related practice area' },
            state: { type: 'string', maxLength: 2, description: 'Relevant state code' },
          },
        },
      },
    },
    tags: [
      { name: 'Search', description: 'Attorney search and discovery' },
      { name: 'Attorneys', description: 'Attorney profiles and details' },
      { name: 'Reviews', description: 'Attorney review system' },
      { name: 'Bookings', description: 'Video consultation booking management' },
      { name: 'Availability', description: 'Attorney availability and scheduling' },
      { name: 'Q&A', description: 'Community legal questions and answers' },
      { name: 'Endorsements', description: 'Peer endorsements between attorneys' },
      { name: 'Specialties', description: 'Legal practice areas directory' },
      { name: 'Statistics', description: 'Aggregated attorney statistics' },
      { name: 'Pricing', description: 'Practice area pricing and barometer data' },
      { name: 'Authentication', description: 'User sign-in and sign-up' },
      { name: 'Contact', description: 'Contact form' },
      { name: 'System', description: 'Health checks and operational endpoints' },
      { name: 'Documentation', description: 'API documentation' },
    ],
  }
}

export async function GET() {
  const spec = buildSpec()

  return NextResponse.json(spec, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
