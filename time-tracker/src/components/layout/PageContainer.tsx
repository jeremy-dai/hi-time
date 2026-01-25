import { useState, type ReactNode, isValidElement, cloneElement } from 'react'
import { cn } from '../../utils/classNames'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type SidebarWidth = 'narrow' | 'wide'

interface PageContainerProps {
  children: ReactNode
  /**
   * @deprecated All pages now use unified white card layout
   */
  variant?: 'full' | 'constrained' | 'constrained-wide'
  /**
   * Optional secondary sidebar content (Learning documents, Review seasons)
   */
  sidebar?: ReactNode
  /**
   * Sidebar width: 'narrow' (w-32) or 'wide' (w-72)
   */
  sidebarWidth?: SidebarWidth
  /**
   * Whether sidebar can be collapsed (desktop only)
   */
  sidebarCollapsible?: boolean
  /**
   * Default collapsed state for collapsible sidebar
   */
  sidebarDefaultCollapsed?: boolean
  /**
   * Optional header content for the page
   */
  header?: ReactNode
  /**
   * Additional className for the container
   */
  className?: string
}

export function PageContainer({
  children,
  sidebar,
  sidebarWidth = 'wide',
  sidebarCollapsible = false,
  sidebarDefaultCollapsed = false,
  header,
  className
}: PageContainerProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(sidebarDefaultCollapsed)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Width mapping
  const widthClasses = {
    narrow: 'w-32',
    wide: 'w-72'
  }

  const collapsedWidth = 'w-12'

  // Layout without sidebar - simple white card
  if (!sidebar) {
    return (
      <div className={cn('bg-white rounded-xl shadow-sm p-4 sm:p-6', className)}>
        {header && <div className="mb-4 sm:mb-6">{header}</div>}
        {children}
      </div>
    )
  }

  // Layout with sidebar - white card containing sidebar + content
  return (
    <div className={cn('bg-white rounded-xl shadow-sm overflow-hidden', className)}>
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={cn(
          'md:hidden fixed inset-y-0 left-0 z-50 bg-white shadow-xl transform transition-transform duration-300',
          widthClasses[sidebarWidth],
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-full overflow-y-auto">
          {sidebar}
        </div>
      </div>

      <div className="flex h-full">
        {/* Desktop sidebar */}
        <div
          className={cn(
            'hidden md:flex flex-col border-r border-gray-200 transition-all duration-300 shrink-0',
            sidebarCollapsible && sidebarCollapsed ? collapsedWidth : widthClasses[sidebarWidth]
          )}
        >
          {/* Collapse toggle button */}
          {sidebarCollapsible && (
            <div className="p-2 border-b border-gray-200 flex justify-end shrink-0">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>
          )}

          {/* Sidebar content - hide when collapsed */}
          {(!sidebarCollapsible || !sidebarCollapsed) && (
            <div className="flex-1 overflow-y-auto">
              {sidebar}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 overflow-auto">
          <div className="p-4 sm:p-6">
            {header && (
              <div className="mb-4 sm:mb-6">
                {/* Inject onMobileMenuClick into PageHeader if sidebar exists */}
                {isValidElement(header)
                  ? cloneElement(header, { onMobileMenuClick: () => setMobileSidebarOpen(true) } as any)
                  : header
                }
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
