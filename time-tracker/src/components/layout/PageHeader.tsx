import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Menu } from 'lucide-react'
import { SyncStatusIndicator } from '../SyncStatusIndicator'
import type { SyncStatus } from '../../hooks/useSyncState'
import YearNavigator from '../shared/YearNavigator'
import { cn } from '../../utils/classNames'

interface PageHeaderProps {
  /**
   * Page title
   */
  title: string
  /**
   * Optional subtitle or description
   */
  subtitle?: string
  /**
   * Optional icon to display before the title
   */
  icon?: LucideIcon
  /**
   * Sync status props (optional)
   */
  sync?: {
    status: SyncStatus
    lastSynced?: Date | null
    hasUnsavedChanges: boolean
    onSyncNow?: () => void
    error?: Error | null
  }
  /**
   * Year navigation props (optional)
   */
  yearNav?: {
    year: number
    onYearChange: (year: number) => void
    variant?: 'default' | 'emerald'
    minYear?: number
    maxYear?: number
  }
  /**
   * Additional controls (export buttons, etc.)
   */
  actions?: ReactNode
  /**
   * Additional content below the header (stats, filters, etc.)
   */
  children?: ReactNode
  /**
   * @deprecated All pages now use unified header style
   */
  variant?: 'default' | 'banner'
  /**
   * @deprecated No longer used - all pages use unified header style
   */
  bannerTheme?: 'emerald' | 'blue' | 'purple'
  /**
   * Additional className
   */
  className?: string
  /**
   * Mobile menu button handler (for pages with sidebars)
   */
  onMobileMenuClick?: () => void
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  sync,
  yearNav,
  actions,
  children,
  className,
  onMobileMenuClick
}: PageHeaderProps) {
  return (
    <div className={className}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile menu button (only shown when onMobileMenuClick is provided) */}
          {onMobileMenuClick && (
            <button
              onClick={onMobileMenuClick}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          )}
          {Icon && <Icon className="w-6 h-6 text-emerald-600" />}
          <div>
            <h1 className={cn(
              "font-bold text-gray-900",
              subtitle ? "text-xl" : "text-2xl"
            )}>{title}</h1>
            {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {sync && (
            <SyncStatusIndicator
              status={sync.status}
              lastSynced={sync.lastSynced}
              hasUnsavedChanges={sync.hasUnsavedChanges}
              onSyncNow={sync.onSyncNow}
              compact={true}
            />
          )}
          {actions}
          {yearNav && (
            <YearNavigator
              year={yearNav.year}
              onYearChange={yearNav.onYearChange}
              variant={yearNav.variant}
              minYear={yearNav.minYear}
              maxYear={yearNav.maxYear}
            />
          )}
        </div>
      </div>
      {children}
    </div>
  )
}
