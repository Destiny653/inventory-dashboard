'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { NotificationService, type Notification } from '@/lib/notificationService'
import {
  Bell,
  Search,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  ChevronDown,
  ShoppingCart,
  Loader2,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock
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
import { useTheme } from '../../context/ThemeContext'
import SignOutButton from '../SignOutButton'
import { toast } from 'sonner'
import Image from 'next/image'

export function Header({ user }: { user: { id: string; name?: string | null; email?: string | null; avatar?: string | null } }) {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const { theme } = useTheme()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(true)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  // Determine user role from path
  const isAdmin = pathname?.includes('/admin')
  const isVendor = pathname?.includes('/vendor')
  const userRole = isAdmin ? 'admin' : isVendor ? 'vendor' : 'customer'

  useEffect(() => {
    fetchNotifications()
    const subscription = setupRealtimeNotifications()
    
    return () => {
      subscription?.unsubscribe()
    }
  }, [user.id])

  async function fetchNotifications() {
    try {
      setLoadingNotifications(true)
      const notifications = await NotificationService.getUserNotifications(user.id, 10)
      setNotifications(notifications)
      updateUnreadCount(notifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  function setupRealtimeNotifications() {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)
          
          // Show toast for new notifications
          toast(newNotification.title, {
            description: newNotification.message,
            duration: 5000,
          })
        }
      )
      .subscribe()
  }

  function updateUnreadCount(notifications: Notification[]) {
    const count = notifications.filter(n => !n.read).length
    setUnreadCount(count)
  }

  async function markAsRead(notificationId: string) {
    try {
      const success = await NotificationService.markAsRead(notificationId)
      if (success) {
        setNotifications(prev =>
          prev.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  async function markAllAsRead() {
    try {
      const success = await NotificationService.markAllAsRead(user.id)
      if (success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        )
        setUnreadCount(0)
        toast.success('All notifications marked as read')
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Failed to mark notifications as read')
    }
  }

  function formatTimeAgo(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return `${seconds} seconds ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    return `${Math.floor(seconds / 86400)} days ago`
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-4 w-4 text-blue-500" />
      case 'payment':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'stock':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case 'status_update':
        return <Clock className="h-4 w-4 text-purple-500" />
      case 'new_signup':
        return <User className="h-4 w-4 text-indigo-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  function getNotificationTitle(type: string) {
    switch (type) {
      case 'order': return 'New Order'
      case 'payment': return 'Payment Received'
      case 'stock': return 'Stock Alert'
      case 'status_update': return 'Status Update'
      case 'new_signup': return 'New User'
      case 'system': return 'System Notification'
      default: return 'Notification'
    }
  }

  function getNotificationLink(notification: Notification): string {
    switch (notification.type) {
      case 'order':
        return `/dashboard/orders/${notification.metadata?.order_id || ''}`
      case 'payment':
        return `/dashboard/payments/${notification.metadata?.payment_id || ''}`
      case 'stock':
        return `/dashboard/products/${notification.metadata?.product_id || ''}`
      case 'status_update':
        return `/dashboard/orders/${notification.metadata?.order_id || ''}`
      default:
        return '/dashboard/notifications'
    }
  }

  return (
    <header className="flex h-16 items-center gap-2 md:gap-4 border-b bg-background px-2 md:px-6 flex-shrink-0">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8 md:h-9 md:w-9 md:hidden">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="pr-0 md:hidden">
          <Sidebar className="px-2" />
        </SheetContent>
      </Sheet>

      <Link href="/" className="flex items-center gap-1 md:gap-3">
        <span className="font-bold text-base md:text-xl text-theme"><Image src="/multivendor-logo.png" alt="Logo" width={300} height={400} /></span>
      </Link>

      <div className="relative flex-1 md:flex md:justify-center">
        {searchOpen ? (
          <div className="absolute inset-0 flex items-center bg-background md:relative md:w-2/1 md:mx-auto">
            <input
              type="search"
              placeholder="Search..."
              className="flex h-8 md:h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-theme"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 h-8 w-8 md:h-9 md:w-9"
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
            className="ml-auto h-8 w-8 md:h-9 md:w-9 md:hidden"
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

      <div className="flex items-center gap-1 md:gap-2">
        <div className="hidden xs:block">
          <ThemeSwitcher />
        </div>

        <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative h-8 w-8 md:h-9 md:w-9">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[calc(100vw-20px)] sm:w-80 p-0" 
            align="end"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="p-3 border-b bg-theme-50 dark:bg-theme-900">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-theme-900 dark:text-theme-100">Notifications</h4>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto p-0 text-xs text-theme hover:text-theme-600"
                    onClick={markAllAsRead}
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
            </div>
            <div className="max-h-80 overflow-auto">
              {loadingNotifications ? (
                <div className="py-6 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  No notifications
                </div>
              ) : (
                <div className="grid gap-1">
                  {notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      href={getNotificationLink(notification)}
                      onClick={() => {
                        markAsRead(notification.id)
                        setIsNotificationOpen(false)
                      }}
                      className={`block p-3 hover:bg-theme-50 dark:hover:bg-theme-900/50 transition-colors ${
                        !notification.read ? 'bg-theme-50 dark:bg-theme-900/30' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="grid gap-1 flex-1">
                          <div className="font-medium flex justify-between items-start">
                            <span className="text-theme-900 dark:text-theme-100">
                              {getNotificationTitle(notification.type)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                          </div>
                          <div className="text-sm text-theme-600 dark:text-theme-300">
                            {notification.message}
                          </div>
                          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1 bg-theme-100 dark:bg-theme-800 p-2 rounded">
                              {Object.entries(notification.metadata).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                                  <span>{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 border-t text-center bg-theme-50 dark:bg-theme-900">
              <Link 
                href="/dashboard/notifications" 
                className="text-xs text-theme hover:text-theme-600 hover:underline"
                onClick={() => setIsNotificationOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 md:h-9 pl-1 pr-2 md:pl-2 md:pr-3">
              <Avatar className="h-5 w-5 md:h-6 md:w-6 mr-1 md:mr-2 border border-theme-200">
                <AvatarImage src={user?.avatar || ''} alt={user?.name || 'User'} />
                <AvatarFallback className="bg-theme-100 text-theme-800 text-xs md:text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[40px] md:max-w-[100px] truncate text-xs md:text-sm">
                {user?.name || 'User'}
              </span>
              <ChevronDown className="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white">
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
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <SignOutButton />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}