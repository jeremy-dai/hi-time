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
