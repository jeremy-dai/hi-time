export const CATEGORY_COLORS = {
  R: 'bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700',
  W: 'bg-yellow-400 hover:bg-yellow-500 text-black dark:bg-yellow-500 dark:hover:bg-yellow-600 dark:text-gray-900',
  G: 'bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700',
  P: 'bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700',
  M: 'bg-orange-700 hover:bg-orange-800 text-white dark:bg-orange-600 dark:hover:bg-orange-700',
  '': 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100'
} as const

export const CATEGORY_BORDER_COLORS = {
  R: 'border-green-500 dark:border-green-500',
  W: 'border-yellow-400 dark:border-yellow-500',
  G: 'border-blue-500 dark:border-blue-600',
  P: 'border-red-500 dark:border-red-600',
  M: 'border-orange-700 dark:border-orange-600',
  '': 'border-gray-300 dark:border-gray-600'
} as const

export const CATEGORY_LABELS = {
  R: 'Rest',
  W: 'Productive Work',
  G: 'Guilty Free Play',
  P: 'Procrastination',
  M: 'Mandatory Work',
  '': 'Empty'
} as const

// Short names for CSV and compact displays
export const CATEGORY_SHORT_NAMES = {
  R: 'Rest',
  W: 'Work',
  G: 'Growth',
  P: 'Personal',
  M: 'Mandatory',
  '': ''
} as const

export const CATEGORY_GRADIENTS = {
  R: 'bg-gradient-to-br from-green-400 to-green-500 dark:from-green-500 dark:to-green-600',
  W: 'bg-gradient-to-br from-yellow-300 to-yellow-400 dark:from-yellow-400 dark:to-yellow-500',
  G: 'bg-gradient-to-br from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600',
  P: 'bg-gradient-to-br from-red-400 to-red-500 dark:from-red-500 dark:to-red-600',
  M: 'bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700',
  '': 'bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600'
} as const

export const CATEGORY_SUB_LEFT = {
  R: ['border-l-green-300', 'border-l-green-400', 'border-l-green-500', 'border-l-green-600'],
  W: ['border-l-yellow-300', 'border-l-yellow-400', 'border-l-yellow-500', 'border-l-yellow-600'],
  G: ['border-l-blue-300', 'border-l-blue-400', 'border-l-blue-500', 'border-l-blue-600'],
  P: ['border-l-red-300', 'border-l-red-400', 'border-l-red-500', 'border-l-red-600'],
  M: ['border-l-orange-300', 'border-l-orange-400', 'border-l-orange-600', 'border-l-orange-700'],
  '': ['border-l-gray-300', 'border-l-gray-400', 'border-l-gray-500', 'border-l-gray-600']
} as const
