import { useState, type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { cn } from '../../utils/classNames'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

interface AppLayoutProps {
  sidebar: ReactNode
  header?: ReactNode
  children: ReactNode
}

export default function AppLayout({ sidebar, header, children }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className={cn(
      'min-h-screen transition-colors duration-300',
      'bg-gray-50 text-gray-900'
    )}>
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <button 
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 flex flex-col gap-0">
             <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
                 <SheetTitle className="font-bold text-lg">Menu</SheetTitle>
             </div>
             <div className="flex-1 overflow-y-auto p-4" onClick={() => setIsMobileMenuOpen(false)}>
                  {sidebar}
             </div>
          </SheetContent>
        </Sheet>
        <div className="font-bold text-lg text-gray-900">Hi-Time</div>
        <div className="w-10" /> {/* Spacer for balance */}
      </div>

      <div className="max-w-[1920px] mx-auto p-2 md:p-4 flex flex-col md:flex-row gap-4">
        
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-[200px] md:sticky md:top-4 md:self-start md:h-[calc(100vh-2rem)] shrink-0 z-10">
          {sidebar}
        </aside>
        
        <div className="flex-1 min-w-0 flex flex-col h-full">
          {header && (
            <div className={cn(
              'mb-2',
              'bg-white rounded-xl py-2 px-3 shadow-sm'
            )}>
              {header}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
