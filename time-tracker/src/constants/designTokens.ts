/**
 * Design Tokens - Centralized design system variables
 * Simple, practical constants without over-engineering
 */

// Border Radius
export const RADIUS = {
  sm: 'rounded-sm',      // Tiny elements (heatmap cells)
  default: 'rounded-xl', // Standard UI elements
  full: 'rounded-full',  // Circular elements (badges, avatars)
} as const

// Spacing (padding, margin, gap)
export const SPACING = {
  // Padding
  cardLg: 'p-6',
  cardMd: 'p-4',
  cardSm: 'p-3',

  // Vertical spacing
  sectionGap: 'space-y-6',
  componentGap: 'space-y-4',
  itemGap: 'space-y-3',

  // Horizontal spacing
  inlineGapSm: 'space-x-2',
  inlineGapMd: 'space-x-3',
  inlineGapLg: 'space-x-4',

  // Grid gap
  gridGap: 'gap-6',
  gridGapSm: 'gap-4',
} as const

// Shadows
export const SHADOW = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  none: 'shadow-none',
} as const

// Transitions
export const TRANSITION = {
  colors: 'transition-colors duration-200',
  all: 'transition-all duration-200',
  transform: 'transition-transform duration-300',
  shadow: 'transition-shadow duration-200',
} as const

// Typography
export const TYPOGRAPHY = {
  // Font sizes
  size: {
    xs: 'text-xs',      // 12px - captions
    sm: 'text-sm',      // 14px - body text
    base: 'text-base',  // 16px - large body
    lg: 'text-lg',      // 18px - subsection headings
    xl: 'text-xl',      // 20px - section headings
    '2xl': 'text-2xl',  // 24px - page titles
  },

  // Font weights
  weight: {
    normal: 'font-normal',     // 400
    medium: 'font-medium',     // 500
    semibold: 'font-semibold', // 600
    bold: 'font-bold',         // 700
  },

  // Letter spacing (for headings)
  tracking: {
    tight: 'tracking-tight',   // Headings
    normal: 'tracking-normal', // Body
    wide: 'tracking-wide',     // Labels
  },

  // Line height
  leading: {
    tight: 'leading-tight',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
  },
} as const

// Colors (semantic) - Gentle Mint-Green Theme (Emerald)
export const COLORS = {
  // Primary actions - Soft emerald/mint (like left panel)
  primary: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  primaryHover: 'hover:bg-emerald-600',
  primaryLight: 'bg-emerald-50 text-emerald-900',

  // Secondary actions - Soft gray
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  secondaryHover: 'hover:bg-gray-200',

  // Danger - Softer red
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  dangerHover: 'hover:bg-red-600',
  dangerLight: 'bg-red-50 text-red-700',

  // Success - Harmonious green (same as primary)
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  successLight: 'bg-emerald-50 text-emerald-900',

  // Warning - Soft amber
  warning: 'bg-amber-500 hover:bg-amber-600 text-white',
  warningLight: 'bg-amber-50 text-amber-900',

  // Info - Soft emerald
  info: 'bg-emerald-50 text-emerald-900',
  infoAccent: 'text-emerald-600',

  // Borders
  border: 'border-gray-200',
  borderHover: 'hover:border-emerald-300',
  borderFocus: 'border-emerald-500',

  // Backgrounds
  bgWhite: 'bg-white',
  bgGray: 'bg-gray-50',
  bgMint: 'bg-emerald-50',
} as const

// Interactive states
export const STATES = {
  hover: {
    card: 'hover:shadow-md hover:border-emerald-200',
    button: 'hover:shadow-md',
  },

  focus: {
    ring: 'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
    ringOffset: 'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
  },

  disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
} as const

// Button styles (complete button patterns)
export const BUTTON = {
  primary: `${RADIUS.default} px-4 py-2 ${COLORS.primary} ${TYPOGRAPHY.weight.semibold} ${TYPOGRAPHY.size.sm} ${SHADOW.sm} ${TRANSITION.colors} ${STATES.focus.ringOffset}`,

  secondary: `${RADIUS.default} px-4 py-2 ${COLORS.secondary} ${TYPOGRAPHY.weight.medium} ${TYPOGRAPHY.size.sm} ${TRANSITION.colors} ${STATES.focus.ringOffset}`,

  danger: `${RADIUS.default} px-4 py-2 ${COLORS.danger} ${TYPOGRAPHY.weight.semibold} ${TYPOGRAPHY.size.sm} ${SHADOW.sm} ${TRANSITION.colors} ${STATES.focus.ringOffset}`,

  ghost: `${RADIUS.default} px-4 py-2 bg-transparent hover:bg-emerald-50 text-emerald-700 ${TYPOGRAPHY.weight.medium} ${TYPOGRAPHY.size.sm} ${TRANSITION.colors}`,
} as const

// Card styles
export const CARD = {
  default: `${RADIUS.default} ${SPACING.cardLg} ${COLORS.bgWhite} ${SHADOW.sm}`,
  compact: `${RADIUS.default} ${SPACING.cardMd} ${COLORS.bgWhite} ${SHADOW.sm}`,
} as const

// Input styles
export const INPUT = {
  default: `${RADIUS.default} px-4 py-2.5 ${TYPOGRAPHY.size.sm} ${TYPOGRAPHY.weight.medium} border ${COLORS.border} ${STATES.focus.ring} ${TRANSITION.all} ${SHADOW.sm}`,
} as const

// Banner styles (info messages) - Updated with emerald theme
export const BANNER = {
  info: `${RADIUS.default} p-4 bg-emerald-50 text-emerald-900`,
  success: `${RADIUS.default} p-4 bg-emerald-50 text-emerald-900`,
  warning: `${RADIUS.default} p-4 bg-amber-50 text-amber-900`,
  error: `${RADIUS.default} p-4 bg-red-50 text-red-900`,
} as const
