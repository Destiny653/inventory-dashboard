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
  ChevronDown,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/ThemeContext'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Vendors', href: '/dashboard/admin/vendors', icon: Store },
  { name: 'Products', href: '/dashboard/admin/products', icon: Package },
  { name: 'Orders', href: '/dashboard/admin/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/dashboard/admin/customers', icon: Users },
  { name: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
]

const customerLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const { theme } = useTheme()
  const [isSalesOpen, setIsSalesOpen] = useState(false)
  const [userRole, setUserRole] = useState<string>('customer')
  const [isLoading, setIsLoading] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Get user role from Supabase metadata
  useEffect(() => {
    const getUserRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const role = session.user.user_metadata?.role || 'customer'
          setUserRole(role.toLowerCase())
        }
      } catch (error) {
        console.error('Error getting user role:', error)
        setUserRole('customer') // fallback to customer
      } finally {
        setIsLoading(false)
      }
    }

    getUserRole()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const role = session.user.user_metadata?.role || 'customer'
        setUserRole(role.toLowerCase())
      } else {
        setUserRole('customer')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Determine which links to show based on user role
  const getLinksForRole = (role: string) => {
    switch (role) {
      case 'admin':
        return adminLinks
      case 'vendor':
        return vendorLinks
      case 'customer':
        return customerLinks
      default:
        return customerLinks
    }
  }

  const links = getLinksForRole(userRole)
  const isAdmin = userRole === 'admin'
  const isVendor = userRole === 'vendor'

  // Sales submenu items (only for vendors)
  const salesItems = [
    { name: 'Direct Sales', href: `/dashboard${isAdmin ? '/admin' : ''}/sales/direct-sales`, icon: FileText },
    { name: 'Completed Sales', href: `/dashboard${isAdmin ? '/admin' : ''}/sales/completed-sales`, icon: FileText },
    { name: 'Completed Orders', href: `/dashboard${isAdmin ? '/admin' : ''}/sales/completed-orders`, icon: FileText }
  ]

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn("h-full flex flex-col border-r border-theme-100 bg-blue-600 transition-all duration-300", isCollapsed ? "w-16" : "w-60", className)}>
        <div className="p-4 border-b border-blue-500/30 flex justify-between items-center">
          {!isCollapsed && <h1 className="text-xl font-bold text-white">Loading...</h1>}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-white">
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>
      </div>
    )
  }

  // Get dashboard title based on role
  const getDashboardTitle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin Dashboard'
      case 'vendor':
        return 'Vendor Dashboard'
      case 'customer':
        return 'Customer Dashboard'
      default:
        return 'Dashboard'
    }
  }
  
  return (
    <div className={cn("h-full flex flex-col border-r border-theme-100 bg-blue-600 transition-all duration-300", isCollapsed ? "w-16" : "w-60", className)}>
      <div className="p-4 border-b border-blue-500/30 flex justify-between items-center">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-white">
            {getDashboardTitle(userRole)}
          </h1>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="text-white hover:bg-blue-700/50 p-1 rounded"
        >
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {links.map((link) => { 
          const isActive = pathname === link.href || 
                          (pathname?.startsWith(link.href) && link.href !== '/dashboard')
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm rounded-md transition-colors group",
                isActive
                  ? "bg-blue-700 text-white font-medium border-l-2 border-white"
                  : "text-blue-100 hover:bg-blue-700/50 hover:text-white"
              )}
              title={isCollapsed ? link.name : undefined}
            >
              <link.icon className={cn(
                "w-4 h-4 shrink-0",
                isCollapsed ? "mx-auto" : "mr-3",
                isActive ? "text-white" : "text-blue-200"
              )} />
              {!isCollapsed && (
                <>
                  {link.name}
                  {/* Optional: Add indicator for items needing attention */}
                  {link.name === 'Stock Alerts' && (
                    <span className="ml-auto h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      3
                    </span>
                  )}
                </>
              )}
            </Link>
          )
        })}
        
        {/* Sales Dropdown Section - Only show for vendors */} 
        {(isVendor || isAdmin) && (
          <div className="mb-2">
            <button
              onClick={() => setIsSalesOpen(!isSalesOpen)}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors",
                pathname?.startsWith('/dashboard/sales') || pathname?.includes('sales')
                  ? "bg-blue-700 text-white font-medium border-l-2 border-white"
                  : "text-blue-100 hover:bg-blue-700/50 hover:text-white"
              )}
            >
              <div className="flex items-center">
                <ShoppingCart className={cn(
                  "w-4 h-4 shrink-0",
                  isCollapsed ? "mx-auto" : "mr-3"
                )} />
                {!isCollapsed && <span>Sales</span>}
              </div>
              {!isCollapsed && (isSalesOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              ))}
            </button>
            
            {isSalesOpen && !isCollapsed && (
              <div className="ml-6 mt-1 space-y-1 overflow-hidden">
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
        )}
      </nav>
      
      {/* Optional: Add a footer section */}
      <div className="p-4 mt-auto border-t border-blue-500/30">
        {!isCollapsed && (
          <>
            <div className="flex items-center gap-2 text-sm text-white">
              <div className="h-2 w-2 rounded-full bg-green-400"></div>
              <span>Store Online</span>
            </div>
            {/* Show current role for debugging */}
            <div className="mt-2 text-xs text-blue-200 capitalize">
              Role: {userRole}
            </div>
          </>
        )}
        {isCollapsed && (
          <div className="flex justify-center">
            <div className="h-2 w-2 rounded-full bg-green-400"></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar