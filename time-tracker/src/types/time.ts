export type SubcategoryRef = {
  index: number
  name: string
} | string

export interface TimeBlock {
  id: string
  time: string
  day: number
  category: CategoryKey
  subcategory?: SubcategoryRef | null
  notes: string
}

export interface CategoryColors {
  [key: string]: string
}

// Category keys - use CATEGORY_LABELS from constants/colors.ts for display names
export const CATEGORY_KEYS = ['R', 'W', 'G', 'P', 'M', ''] as const

export type CategoryKey = typeof CATEGORY_KEYS[number]