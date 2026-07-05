import type { PaginatedResponse, PaginationParams, FilterParams } from '@/types'

export function buildPagination(params: PaginationParams): { skip: number; take: number } {
  const page = Math.max(1, params.page || 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20))
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  }
}

export function buildOrderBy(params: PaginationParams): Record<string, string> {
  if (!params.sortBy) return { createdAt: 'desc' }
  return { [params.sortBy]: params.sortOrder || 'desc' }
}

export function paginateResult<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const page = Math.max(1, params.page || 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20))
  const totalPages = Math.ceil(total / pageSize)

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

export function buildSearchFilter(search?: string, fields: string[] = []): Record<string, unknown> {
  if (!search || fields.length === 0) return {}
  return {
    OR: fields.map((field) => ({
      [field]: { contains: search, mode: 'insensitive' as const },
    })),
  }
}

export function buildFilterParams(filters: FilterParams): Record<string, unknown> {
  const where: Record<string, unknown> = {}

  if (filters.search) {
    // search handled separately
  }
  if (filters.status) where.status = filters.status
  if (filters.branchId) where.branchId = filters.branchId
  if (filters.employeeId) where.employeeId = filters.employeeId
  if (filters.categoryId) where.categoryId = filters.categoryId
  if (filters.dateFrom && filters.dateTo) {
    where.createdAt = { gte: new Date(filters.dateFrom), lte: new Date(filters.dateTo) }
  } else if (filters.dateFrom) {
    where.createdAt = { gte: new Date(filters.dateFrom) }
  } else if (filters.dateTo) {
    where.createdAt = { lte: new Date(filters.dateTo) }
  }

  return where
}