 'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  Users,
  AlertTriangle,
  CreditCard,
  Store,
  FileText,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/ThemeContext'
import { useState } from 'react'

const vendorLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/dashboard/products', icon: Package },
  { name: 'Customers', href: '/dashboard/users', icon: Users },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Stock Alerts', href: '/dashboard/stock-alerts', icon: AlertTriangle },
  { name: 'Payouts', href: '/dashboard/payouts', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

const adminLinks = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Vendors', href: '/admin/vendors', icon: Store },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const { theme } = useTheme()
  const [isSalesOpen, setIsSalesOpen] = useState(false)
  
  // In a real app, you'd check the user role from auth context
  const isAdmin = pathname?.startsWith('/admin')
  const links = isAdmin ? adminLinks : vendorLinks

    // Sales submenu items
  const salesItems = [
    { name: 'Direct Sales', href: '/dashboard/direct-sales', icon: FileText },
    { name: 'Completed Sales', href: '/dashboard/completed-sales', icon: FileText },
    { name: 'Completed Orders', href: '/dashboard/completed-orders', icon: FileText }
  ]
  
  return (
    <div className={cn("w-60 h-full flex flex-col border-r border-theme-100 bg-blue-600  ", className)}>
      <div className="p-4 border-b border-blue-500/30">
        <h1 className="text-xl font-bold text-white">
          {isAdmin ? 'Admin Dashboard' : 'Vendor Dashboard'}
        </h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => { 
          const isActive = pathname === link.href || 
                          (pathname?.startsWith(link.href) && link.href !== (isAdmin ? '/admin' : '/dashboard'))
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                isActive
                  ? "bg-blue-700 text-white font-medium border-l-2 border-white"
                  : "text-blue-100 hover:bg-blue-700/50 hover:text-white"
              )}
            >
              <link.icon className={cn(
                "w-4 h-4 mr-3 shrink-0",
                isActive ? "text-white" : "text-blue-200"
              )} />
              {link.name}
              
              {/* Optional: Add indicator for items needing attention */}
              {link.name === 'Stock Alerts' && (
                <span className="ml-auto h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  3
                </span>
              )}
            </Link>
          )
        })}
           {/* Sales Dropdown Section */}
        <div className="mb-2">
          <button
            onClick={() => setIsSalesOpen(!isSalesOpen)}
            className={cn(
              "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors",
              pathname?.startsWith('/dashboard/sales')
                ? "bg-blue-700 text-white font-medium border-l-2 border-white"
                : "text-blue-100 hover:bg-blue-700/50 hover:text-white"
            )}
          >
            <div className="flex items-center">
              <ShoppingCart className="w-4 h-4 mr-3 shrink-0" />
              <span>Sales</span>
            </div>
            {isSalesOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          
          {isSalesOpen && (
            <div className="ml-6 mt-1 space-y-1">
              {salesItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                      isActive
                        ? "bg-blue-800 text-white font-medium"
                        : "text-blue-100 hover:bg-blue-700/30 hover:text-white"
                    )}
                  >
                    <item.icon className="w-4 h-4 mr-3 shrink-0" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </nav>
      
      {/* Optional: Add a footer section */}
      <div className="p-4 mt-auto border-t border-blue-500/30">
        <div className="flex items-center gap-2 text-sm text-white">
          <div className="h-2 w-2 rounded-full bg-green-400"></div>
          <span>Store Online</span>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
