// Hex color values for components that need inline styles (e.g., Handsontable)
export const CATEGORY_COLORS_HEX = {
  'R': { bg: '#b5d9c8', text: '#0d3025' },      // Soft mint green with darker text
  'W': { bg: '#f9e5c1', text: '#3d2a15' },      // Soft golden beige with darker text
  'G': { bg: '#b5d3e8', text: '#0d2535' },      // Soft sky blue with darker text
  'P': { bg: '#f0c5c5', text: '#3d1515' },      // Soft coral pink with darker text
  'M': { bg: '#e8c5b0', text: '#32200d' },      // Soft warm terracotta with darker text
  '': { bg: '#f3f4f6', text: '#4b5563' }        // Light gray with darker text
} as const

// Ghost cell colors (lighter backgrounds, same text color as real cells for consistency)
export const GHOST_CATEGORY_COLORS_HEX = {
  'R': { bg: '#e5f3ed', text: '#0d3025' },      // Very light mint, same text as real
  'W': { bg: '#fdf5e8', text: '#3d2a15' },      // Very light cream, same text as real
  'G': { bg: '#e5f1f8', text: '#0d2535' },      // Very light blue, same text as real
  'P': { bg: '#f8e8e8', text: '#3d1515' },      // Very light pink, same text as real
  'M': { bg: '#f5e8dd', text: '#32200d' },      // Very light peach, same text as real
  '': { bg: '#f9fafb', text: '#4b5563' }        // Very light gray, same text as real
} as const

// Subcategory shade variations (for border-left in Handsontable and Settings inputs)
export const SUBCATEGORY_SHADES_HEX = {
  'R': ['#d0e8db', '#b5d9c8', '#9acab5', '#7fbba2', '#64ab8e'],  // Mint green shades (5 progressive shades)
  'W': ['#fcefd5', '#f9e5c1', '#f6dbad', '#f3d199', '#f0c785'],  // Golden shades (5 progressive shades)
  'G': ['#cce3f0', '#b5d3e8', '#9ec3e0', '#87b3d8', '#70a3d0'],  // Sky blue shades (5 progressive shades)
  'P': ['#f5d8d8', '#f0c5c5', '#ebb2b2', '#e69f9f', '#e18c8c'],  // Coral pink shades (5 progressive shades)
  'M': ['#f0d8c8', '#e8c5b0', '#e0b298', '#d89f80', '#d08c68'],  // Terracotta shades (5 progressive shades)
  '': ['#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563']    // Gray shades (5 progressive shades)
} as const

// Tailwind CSS classes for React components
export const CATEGORY_COLORS = {
  R: 'bg-[#b5d9c8] hover:bg-[#9acab5] text-[#0d3025]',
  W: 'bg-[#f9e5c1] hover:bg-[#f6dbad] text-[#3d2a15]',
  G: 'bg-[#b5d3e8] hover:bg-[#9ec3e0] text-[#0d2535]',
  P: 'bg-[#f0c5c5] hover:bg-[#ebb2b2] text-[#3d1515]',
  M: 'bg-[#e8c5b0] hover:bg-[#e0b298] text-[#32200d]',
  '': 'bg-gray-100 hover:bg-gray-200 text-gray-700'
} as const

export const CATEGORY_BORDER_COLORS = {
  R: 'border-[#b5d9c8]',
  W: 'border-[#f9e5c1]',
  G: 'border-[#b5d3e8]',
  P: 'border-[#f0c5c5]',
  M: 'border-[#e8c5b0]',
  '': 'border-gray-300'
} as const

export const CATEGORY_LABELS = {
  R: 'Rest',
  W: 'Work',
  G: 'Play',
  P: 'Procrastination',
  M: 'Mandatory',
  '': ''
} as const

export const CATEGORY_GRADIENTS = {
  R: 'bg-gradient-to-br from-[#d0e8db] to-[#b5d9c8]',
  W: 'bg-gradient-to-br from-[#fcefd5] to-[#f9e5c1]',
  G: 'bg-gradient-to-br from-[#cce3f0] to-[#b5d3e8]',
  P: 'bg-gradient-to-br from-[#f5d8d8] to-[#f0c5c5]',
  M: 'bg-gradient-to-br from-[#f0d8c8] to-[#e8c5b0]',
  '': 'bg-gradient-to-br from-gray-200 to-gray-300'
} as const

export const CATEGORY_SUB_LEFT = {
  R: ['border-l-[#d0e8db]', 'border-l-[#b5d9c8]', 'border-l-[#9acab5]', 'border-l-[#7fbba2]', 'border-l-[#64ab8e]'],
  W: ['border-l-[#fcefd5]', 'border-l-[#f9e5c1]', 'border-l-[#f6dbad]', 'border-l-[#f3d199]', 'border-l-[#f0c785]'],
  G: ['border-l-[#cce3f0]', 'border-l-[#b5d3e8]', 'border-l-[#9ec3e0]', 'border-l-[#87b3d8]', 'border-l-[#70a3d0]'],
  P: ['border-l-[#f5d8d8]', 'border-l-[#f0c5c5]', 'border-l-[#ebb2b2]', 'border-l-[#e69f9f]', 'border-l-[#e18c8c]'],
  M: ['border-l-[#f0d8c8]', 'border-l-[#e8c5b0]', 'border-l-[#e0b298]', 'border-l-[#d89f80]', 'border-l-[#d08c68]'],
  '': ['border-l-gray-300', 'border-l-gray-400', 'border-l-gray-500', 'border-l-gray-600', 'border-l-gray-700']
} as const
