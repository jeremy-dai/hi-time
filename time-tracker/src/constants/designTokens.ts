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
    '2xs': 'text-2xs',  // 10px - data labels, metadata
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

// Colors (semantic) - Modern Emerald Theme
export const COLORS = {
  // Primary actions - Emerald (like linear/vercel)
  primary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  primaryHover: 'hover:bg-emerald-700',
  primaryLight: 'bg-emerald-50 text-emerald-900',

  // Secondary actions - Zinc
  secondary: 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900',
  secondaryHover: 'hover:bg-zinc-200',

  // Danger - Red
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  dangerHover: 'hover:bg-red-600',
  dangerLight: 'bg-red-50 text-red-700',

  // Success - Emerald (consistent with primary)
  success: 'bg-emerald-500 hover:bg-emerald-600 text-white',
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
  borderFocus: 'border-emerald-400',

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
    ring: 'focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent',
    ringOffset: 'focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2',
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

// Banner styles (info messages) - Emerald theme
export const BANNER = {
  info: `${RADIUS.default} p-4 bg-emerald-50 text-emerald-900`,
  success: `${RADIUS.default} p-4 bg-emerald-50 text-emerald-900`,
  warning: `${RADIUS.default} p-4 bg-amber-50 text-amber-900`,
  error: `${RADIUS.default} p-4 bg-red-50 text-red-900`,
} as const

// Page Layout styles (unified white card layout)
export const PAGE_LAYOUT = {
  // Container - all pages use unified white card
  container: 'bg-white rounded-xl shadow-sm',

  // Padding
  padding: 'p-3 sm:p-6',

  // Sidebar widths
  sidebarNarrow: 'w-[var(--sidebar-width-collapsed)]', // 64px
  sidebarWide: 'w-[var(--sidebar-width)]', // 170px
  sidebarCollapsed: 'w-[var(--sidebar-width-collapsed)]',
} as const

// Page Header styles (unified header style)
export const PAGE_HEADER = {
  // Title sizes
  title: 'text-2xl font-bold text-gray-900',
  titleWithSubtitle: 'text-xl font-bold text-gray-900',
  subtitle: 'text-gray-500 text-sm',

  // Icon color - unified emerald
  icon: 'text-emerald-600',
} as const

// Modern Design System Tokens

export const SHADOW_MODERN = {
  glow: 'shadow-glow',
  glowSm: 'shadow-glow-sm',
  card: 'shadow-card',
  cardHover: 'shadow-card-hover',
  elevated: 'shadow-elevated',
} as const

export const GRADIENT = {
  primary: 'gradient-primary',
  mesh: 'bg-mesh',
  text: 'text-gradient',
  border: 'gradient-border',
} as const

export const GLASS = {
  card: 'glass-card',
  cardStrong: 'glass-card-strong',
} as const

export const ANIMATION = {
  fadeIn: 'animate-in fade-in duration-500',
  slideUp: 'animate-in slide-in-from-bottom duration-500',
  scaleIn: 'animate-[scale-in_0.3s_ease-out]',
  shimmer: 'animate-[shimmer_2s_linear_infinite]',
  glowPulse: 'animate-[glow-pulse_2s_ease-in-out_infinite]',
  stagger: (index: number) => `stagger-${Math.min(index + 1, 5)}`,
} as const

export const CARD_MODERN = {
  default: `${SHADOW_MODERN.card} hover:${SHADOW_MODERN.cardHover} transition-all duration-300`,
  glass: `${GLASS.card} hover:${SHADOW_MODERN.cardHover} transition-all duration-300`,
  interactive: `${SHADOW_MODERN.card} gradient-border hover:shadow-lg transition-all duration-300`,
} as const

export const CHART_CONTAINER = {
  default: `bg-white ${SHADOW_MODERN.card} rounded-xl p-4`,
  glass: `${GLASS.card} rounded-xl p-4`,
  animated: `bg-white ${SHADOW_MODERN.card} rounded-xl p-4 hover:scale-[1.01] transition-transform duration-300`,
} as const
