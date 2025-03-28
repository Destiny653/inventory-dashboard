 'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Bell, 
  Search, 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings,
  ChevronDown,
  ShoppingCart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sidebar } from './Sidebar'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { useTheme } from '@/app/context/ThemeContext'

export function Header({ user }: { user: { name?: string; email?: string; avatar?: string } }) {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const { theme } = useTheme()
  
  // Determine user role from path
  const isAdmin = pathname?.includes('/admin')
  const isVendor = pathname?.includes('/vendor')
  const userRole = isAdmin ? 'admin' : isVendor ? 'vendor' : 'customer'
  
  // Mock notifications
  const notifications = [
    {
      id: 1,
      title: 'New Order',
      message: 'You have received a new order #12345',
      time: '10 minutes ago',
      read: false,
    },
    {
      id: 2,
      title: 'Payment Received',
      message: 'Payment of $89.99 has been processed',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 3,
      title: 'Product Out of Stock',
      message: 'Wireless Earbuds is now out of stock',
      time: '1 day ago',
      read: true,
    },
  ]
  
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="pr-0">
          <Sidebar className="px-2" />
        </SheetContent>
      </Sheet>
      
      <Link href="/" className="flex items-center gap-2 md:gap-3">
        <span className="font-bold text-xl text-theme">MultiVendor</span>
      </Link>
      
      <div className="relative md:flex-1 md:flex md:justify-center">
        {searchOpen ? (
          <div className="absolute inset-0 flex items-center bg-background md:relative md:w-2/3 md:mx-auto">
            <input
              type="search"
              placeholder="Search..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-theme"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-0" 
              onClick={() => setSearchOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="icon" 
            className="ml-auto md:hidden" 
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        )}
        
        <div className="hidden md:flex md:w-2/3 mx-auto relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search products, orders, customers..."
            className="flex h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-theme"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Theme Switcher */}
        <ThemeSwitcher />
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-theme"></span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Notifications</h4>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-theme">
                  Mark all as read
                </Button>
              </div>
            </div>
            <div className="max-h-80 overflow-auto">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                <div className="grid gap-1">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-3 hover:bg-muted ${notification.read ? '' : 'bg-theme-50'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 h-2 w-2 rounded-full ${notification.read ? 'bg-transparent' : 'bg-theme-500'}`} />
                        <div className="grid gap-1">
                          <div className="font-medium">{notification.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {notification.message}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {notification.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t text-center">
              <Link href="/dashboard/notifications" className="text-xs text-theme hover:underline">
                View all notifications
              </Link>
            </div>
          </PopoverContent>
        </Popover>
        
        {userRole === 'customer' && (
          <Button variant="outline" size="icon" asChild>
            <Link href="/cart">
              <ShoppingCart className="h-4 w-4" />
              <span className="sr-only">Cart</span>
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-theme text-white">
                3
              </Badge>
            </Link>
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="pl-2 pr-3 h-9">
              <Avatar className="h-6 w-6 mr-2 border border-theme-200">
                <AvatarImage src={user?.avatar || ''} alt={user?.name || 'User'} />
                <AvatarFallback className="bg-theme-100 text-theme-800">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <span className="max-w-[100px] truncate">{user?.name || 'User'}</span>
              <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4 text-theme-500" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4 text-theme-500" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/logout" className="cursor-pointer text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
