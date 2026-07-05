// ═══════════════════════════════════════════════════════════════════
// API Request Validation
// ═══════════════════════════════════════════════════════════════════

import { z } from 'zod'

// Common validation schemas
export const commonSchemas = {
  email: z.string().email().max(255),
  phone: z.string().regex(/^[+]?[\d\s\-()]{7,20}$/).optional(),
  name: z.string().min(2).max(100),
  password: z.string().min(8).max(128),
  id: z.string().min(1),
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
  sort: z.object({
    field: z.string().min(1),
    direction: z.enum(['asc', 'desc']).default('desc'),
  }),
}

// API-specific validators
export const apiValidators = {
  login: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
  }),
  createBooking: z.object({
    customerId: commonSchemas.id,
    branchId: commonSchemas.id,
    employeeId: commonSchemas.id.optional(),
    serviceIds: z.array(commonSchemas.id).min(1),
    startDate: z.string().datetime(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    notes: z.string().max(1000).optional(),
  }),
  createCustomer: z.object({
    firstName: commonSchemas.name,
    lastName: commonSchemas.name,
    email: commonSchemas.email.optional(),
    phone: commonSchemas.phone,
  }),
  updateService: z.object({
    name: commonSchemas.name.optional(),
    description: z.string().max(2000).optional(),
    duration: z.number().int().min(5).max(480).optional(),
    price: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
}

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: z.ZodError
}

export function validateAPIRequest<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): ValidationResult<T> {
  const result = schema.safeParse(body)
  if (!result.success) {
    return { success: false, errors: result.error }
  }
  return { success: true, data: result.data }
}

export function createAPIValidator<T>(schema: z.ZodSchema<T>) {
  return (body: unknown): ValidationResult<T> => validateAPIRequest(schema, body)
}