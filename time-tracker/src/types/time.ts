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

export interface WeekReview {
  year: number
  weekNumber: number // ISO week number (1-53)
  review: string
  createdAt: number
  updatedAt: number
}

export interface YearWeekReviews {
  year: number
  reviews: Record<number, WeekReview> // week number -> review
}

export interface DailyShipping {
  year: number
  month: number // 1-12
  day: number // 1-31
  shipped: string
  completed: boolean
  createdAt: number
  updatedAt: number
}

export interface YearDailyShipping {
  year: number
  entries: Record<string, DailyShipping> // 'YYYY-MM-DD' -> shipping entry
}

export interface AnnualReview {
  year: number
  review: string
  createdAt: number
  updatedAt: number
}

export interface GoalMilestone {
  id: string
  goalId: string
  title: string
  completed: boolean
  displayOrder: number
  createdAt: number
  updatedAt: number
}

export interface QuarterlyGoal {
  id: string
  year: number
  quarter: number // 1-4
  title: string
  description?: string
  completed: boolean
  displayOrder: number
  milestones: GoalMilestone[]
  createdAt: number
  updatedAt: number
}

export interface QuarterGoals {
  year: number
  quarter: number
  goals: QuarterlyGoal[]
}