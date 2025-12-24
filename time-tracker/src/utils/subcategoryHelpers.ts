import type { SubcategoryDef } from '../api'
import type { SubcategoryRef } from '../types/time'

/**
 * Normalize subcategory array to always use {index, name} format
 */
export function normalizeSubcategories(subs: SubcategoryDef[]): SubcategoryDef[] {
  if (!Array.isArray(subs)) return []
  return subs.filter(sub => {
    // Runtime safety: filter out non-objects (like old strings) or nulls
    if (typeof sub !== 'object' || sub === null) return false
    // Ensure name exists and is a string
    const name = (sub as any).name
    if (typeof name !== 'string') return false
    return name.trim().length > 0
  })
}

/**
 * Normalize a single subcategory reference
 */
export function normalizeSubcategoryRef(sub: SubcategoryRef | null | undefined): SubcategoryRef | null {
  if (!sub) return null
  // Runtime safety: ignore old string format
  if (typeof sub !== 'object') return null
  return sub
}

/**
 * Get subcategory name for display
 */
export function getSubcategoryName(sub: SubcategoryRef | null | undefined): string {
  if (!sub) return ''
  // Runtime safety: ignore old string format
  if (typeof sub !== 'object') return ''
  return sub.name || ''
}

/**
 * Get subcategory index for color
 */
export function getSubcategoryIndex(
  sub: SubcategoryRef | null | undefined
): number {
  if (!sub) return 0
  // Runtime safety: ignore old string format
  if (typeof sub !== 'object') return 0
  return sub.index || 0
}

/**
 * Find next available index for a category (for adding new subcategories)
 */
export function getNextSubcategoryIndex(subs: SubcategoryDef[]): number {
  const normalized = normalizeSubcategories(subs)
  if (normalized.length === 0) return 0
  const maxIndex = Math.max(...normalized.map(s => s.index))
  return maxIndex + 1
}
