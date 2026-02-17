import type { Product } from '@/lib/types'

export type SizeStockMap = Record<string, number>

export function normalizeSizeStock(value: unknown): SizeStockMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  const entries = Object.entries(value as Record<string, unknown>)
  const normalized: SizeStockMap = {}

  for (const [size, raw] of entries) {
    const quantity = Number(raw)
    normalized[size] = Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0
  }

  return normalized
}

export function getStockForSize(product: Product, size: string): number {
  const sizeStock = normalizeSizeStock(product.size_stock)
  if (Object.keys(sizeStock).length === 0) {
    return product.stock
  }
  return sizeStock[size] ?? 0
}

export function getAvailableSizes(product: Product): string[] {
  const sizes = product.sizes || []
  const sizeStock = normalizeSizeStock(product.size_stock)
  if (Object.keys(sizeStock).length === 0) {
    return sizes
  }
  return sizes.filter((size) => (sizeStock[size] ?? 0) > 0)
}

export function getTotalStock(product: Product): number {
  const sizeStock = normalizeSizeStock(product.size_stock)
  if (Object.keys(sizeStock).length === 0 || !(product.sizes || []).length) {
    return product.stock
  }

  return (product.sizes || []).reduce((sum, size) => sum + (sizeStock[size] ?? 0), 0)
}
