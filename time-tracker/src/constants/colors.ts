// Hex color values for components that need inline styles (e.g., Handsontable)
export const CATEGORY_COLORS_HEX = {
  'R': { bg: '#b5d9c8', text: '#0d3025' },      // Soft mint green with darker text
  'W': { bg: '#f9e5c1', text: '#3d2a15' },      // Soft golden beige with darker text
  'G': { bg: '#b5d3e8', text: '#0d2535' },      // Soft sky blue with darker text
  'P': { bg: '#d9a5a8', text: '#3d1515' },      // Dusty rose with darker text
  'M': { bg: '#c5b8d4', text: '#2d1f3d' },      // Dusty lavender with darker text
  '': { bg: '#f3f4f6', text: '#4b5563' }        // Light gray with darker text
} as const

// Ghost cell colors (lighter backgrounds, same text color as real cells for consistency)
export const GHOST_CATEGORY_COLORS_HEX = {
  'R': { bg: '#e5f3ed', text: '#0d3025' },      // Very light mint, same text as real
  'W': { bg: '#fdf5e8', text: '#3d2a15' },      // Very light cream, same text as real
  'G': { bg: '#e5f1f8', text: '#0d2535' },      // Very light blue, same text as real
  'P': { bg: '#f5e5e6', text: '#3d1515' },      // Very light rose, same text as real
  'M': { bg: '#f0edf5', text: '#2d1f3d' },      // Very light lavender, same text as real
  '': { bg: '#f9fafb', text: '#4b5563' }        // Very light gray, same text as real
} as const

// Subcategory shade variations (for border-left in Handsontable and Settings inputs)
// Strong contrast between adjacent shades for clear visual distinction in cell borders
export const SUBCATEGORY_SHADES_HEX = {
  'R': ['#e8f5ee', '#c8e4d5', '#9acab5', '#72b599', '#4a9f7d'],  // Mint green: very light → light → medium → medium-dark → dark
  'W': ['#fffaf0', '#feedcc', '#f4d6a3', '#edc172', '#e5ab41'],  // Golden: cream → light → medium → medium-dark → amber
  'G': ['#e0ecf5', '#bdd9ed', '#94c0df', '#6ba7d1', '#4590c4'],  // Sky blue: very light → light → medium → medium-dark → deep blue
  'P': ['#f5dfe0', '#e8bfc1', '#d59398', '#c26a70', '#af4248'],  // Dusty rose: very light → light → medium → medium-dark → deep rose
  'M': ['#ebe5f1', '#d5c8e0', '#b9a5c8', '#9d82b0', '#815f98'],  // Dusty lavender: very light → light → medium → medium-dark → deep purple
  '': ['#eff0f1', '#d8dadd', '#b4b8be', '#8a909a', '#606876']    // Gray: very light → light → medium → medium-dark → charcoal
} as const

// Tailwind CSS classes for React components
export const CATEGORY_COLORS = {
  R: 'bg-[#b5d9c8] hover:bg-[#9acab5] text-[#0d3025]',
  W: 'bg-[#f9e5c1] hover:bg-[#f6dbad] text-[#3d2a15]',
  G: 'bg-[#b5d3e8] hover:bg-[#9ec3e0] text-[#0d2535]',
  P: 'bg-[#d9a5a8] hover:bg-[#c68d90] text-[#3d1515]',
  M: 'bg-[#c5b8d4] hover:bg-[#ad9bc0] text-[#2d1f3d]',
  '': 'bg-gray-100 hover:bg-gray-200 text-gray-700'
} as const

export const CATEGORY_BORDER_COLORS = {
  R: 'border-[#b5d9c8]',
  W: 'border-[#f9e5c1]',
  G: 'border-[#b5d3e8]',
  P: 'border-[#d9a5a8]',
  M: 'border-[#c5b8d4]',
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
  P: 'bg-gradient-to-br from-[#ecc5c8] to-[#d9a5a8]',
  M: 'bg-gradient-to-br from-[#ddd5e8] to-[#c5b8d4]',
  '': 'bg-gradient-to-br from-gray-200 to-gray-300'
} as const

export const CATEGORY_SUB_LEFT = {
  R: ['border-l-[#e8f5ee]', 'border-l-[#c8e4d5]', 'border-l-[#9acab5]', 'border-l-[#72b599]', 'border-l-[#4a9f7d]'],
  W: ['border-l-[#fffaf0]', 'border-l-[#feedcc]', 'border-l-[#f4d6a3]', 'border-l-[#edc172]', 'border-l-[#e5ab41]'],
  G: ['border-l-[#e0ecf5]', 'border-l-[#bdd9ed]', 'border-l-[#94c0df]', 'border-l-[#6ba7d1]', 'border-l-[#4590c4]'],
  P: ['border-l-[#f5dfe0]', 'border-l-[#e8bfc1]', 'border-l-[#d59398]', 'border-l-[#c26a70]', 'border-l-[#af4248]'],
  M: ['border-l-[#ebe5f1]', 'border-l-[#d5c8e0]', 'border-l-[#b9a5c8]', 'border-l-[#9d82b0]', 'border-l-[#815f98]'],
  '': ['border-l-[#eff0f1]', 'border-l-[#d8dadd]', 'border-l-[#b4b8be]', 'border-l-[#8a909a]', 'border-l-[#606876]']
} as const
