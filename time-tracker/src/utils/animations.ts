/**
 * Animation utilities - Simple, practical animations
 * No over-engineering, just smooth UX improvements
 */

/**
 * Fade in animation for page transitions
 */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
} as const

/**
 * Slide up animation for modals
 */
export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.3 },
} as const

/**
 * Scale animation for buttons/cards
 */
export const scaleOnHover = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.2 },
} as const

/**
 * CSS animation classes (for non-React components)
 */
export const ANIMATIONS = {
  // Fade transitions
  fadeIn: 'animate-in fade-in duration-200',
  fadeOut: 'animate-out fade-out duration-200',

  // Slide transitions
  slideInFromRight: 'animate-in slide-in-from-right duration-300',
  slideInFromLeft: 'animate-in slide-in-from-left duration-300',
  slideInFromBottom: 'animate-in slide-in-from-bottom duration-300',

  // Scale
  scaleIn: 'animate-in zoom-in duration-200',

  // Spin (for loading)
  spin: 'animate-spin',
} as const
