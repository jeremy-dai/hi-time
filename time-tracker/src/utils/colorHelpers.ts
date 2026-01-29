import { CATEGORY_COLORS_HEX, CATEGORY_LABELS } from '../constants/colors'
import type { CategoryKey } from '../types/time'

/**
 * Get category colors (background and text)
 * @param category - The category key (R, W, G, P, M, or '')
 * @returns Object with bg and text color hex values
 */
export function getCategoryColor(category: CategoryKey): { bg: string; text: string } {
  return CATEGORY_COLORS_HEX[category] || CATEGORY_COLORS_HEX['']
}

/**
 * Get human-readable category label
 * @param category - The category key (R, W, G, P, M, or '')
 * @returns Category label (e.g., "Rest", "Work", "Play")
 */
export function getCategoryLabel(category: CategoryKey): string {
  return CATEGORY_LABELS[category] || ''
}

/**
 * Get inline style object for category badge
 * @param category - The category key (R, W, G, P, M, or '')
 * @returns React CSSProperties object with backgroundColor and color
 */
export function getCategoryBadgeStyle(category: CategoryKey): React.CSSProperties {
  const colors = getCategoryColor(category)
  return {
    backgroundColor: colors.bg,
    color: colors.text
  }
}

/**
 * Check if a color is dark (requiring white text)
 * @param hexColor - Hex color string (e.g. #FF0000)
 * @returns boolean
 */
export function isDarkColor(hexColor: string): boolean {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  // Calculate relative luminance
  // Standard formula: 0.299R + 0.587G + 0.114B
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  
  // Threshold can be adjusted, 128 is standard mid-point
  return brightness < 150 // Slightly higher threshold for better contrast preference
}
