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

// Category keys in display order: Work, Mandatory, Procrastination, Rest, Play
// In stacked bars, Work appears at bottom (rendered first)
export const CATEGORY_KEYS = ['W', 'M', 'P', 'R', 'G', ''] as const

export type CategoryKey = typeof CATEGORY_KEYS[number]

export interface DailyMemory {
  date: string // YYYY-MM-DD
  memory: string
  tags?: string[]
  mood?: 'great' | 'good' | 'neutral' | 'bad' | 'terrible'
  createdAt: number
  updatedAt: number
}

export interface YearMemories {
  year: number
  memories: Record<string, DailyMemory>
}