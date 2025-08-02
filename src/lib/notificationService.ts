import { supabase, supabaseAdmin } from './supabase'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'order' | 'payment' | 'stock' | 'system' | 'status_update' | 'new_signup'
  read: boolean
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateNotificationParams {
  targetUserId: string
  title: string
  message: string
  type?: Notification['type']
  metadata?: Record<string, any>
}

export interface OrderNotificationParams {
  orderId: string
  orderNumber: string
  customerId: string
  vendorId?: string
  status: string
  totalAmount: number
  oldStatus?: string
}

export interface StockNotificationParams {
  productId: string
  productName: string
  currentStock: number
  threshold: number
  vendorId: string
}

export class NotificationService {
  // Send notification to a specific user
  static async sendNotification(params: CreateNotificationParams): Promise<Notification | null> {
    try {
      if (!supabaseAdmin) {
        console.error('Admin client not configured')
        return null
      }

      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: params.targetUserId,
          title: params.title,
          message: params.message,
          type: params.type || 'system',
          metadata: params.metadata || {},
          read: false
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating notification:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in sendNotification:', error)
      return null
    }
  }

  // Send notification to multiple users
  static async sendNotificationToUsers(
    userIds: string[],
    params: Omit<CreateNotificationParams, 'targetUserId'>
  ): Promise<Notification[]> {
    try {
      if (!supabaseAdmin) {
        console.error('Admin client not configured')
        return []
      }

      const notifications = userIds.map(userId => ({
        user_id: userId,
        title: params.title,
        message: params.message,
        type: params.type || 'system',
        metadata: params.metadata || {},
        read: false
      }))

      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert(notifications)
        .select()

      if (error) {
        console.error('Error creating notifications:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in sendNotificationToUsers:', error)
      return []
    }
  }

  // Send notification to all users with a specific role
  static async sendNotificationToRole(
    role: string,
    params: Omit<CreateNotificationParams, 'targetUserId'>
  ): Promise<Notification[]> {
    try {
      if (!supabaseAdmin) {
        console.error('Admin client not configured')
        return []
      }

      // Get all users with the specified role
      const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (usersError) {
        console.error('Error fetching users:', usersError)
        return []
      }

      const targetUsers = users.users.filter(user => 
        user.user_metadata?.role === role
      )

      if (targetUsers.length === 0) {
        console.log(`No users found with role: ${role}`)
        return []
      }

      return await this.sendNotificationToUsers(
        targetUsers.map(user => user.id),
        params
      )
    } catch (error) {
      console.error('Error in sendNotificationToRole:', error)
      return []
    }
  }

  // Send order status update notification
  static async sendOrderStatusNotification(params: OrderNotificationParams): Promise<void> {
    try {
      // Notify customer about status change
      await this.sendNotification({
        targetUserId: params.customerId,
        title: 'Order Status Updated',
        message: `Your order #${params.orderNumber} status has been updated to: ${params.status}`,
        type: 'status_update',
        metadata: {
          order_id: params.orderId,
          order_number: params.orderNumber,
          old_status: params.oldStatus,
          new_status: params.status,
          total_amount: params.totalAmount
        }
      })

      // Notify all admins about the status change
      await this.sendNotificationToRole('admin', {
        title: 'Order Status Changed',
        message: `Order #${params.orderNumber} status changed from ${params.oldStatus || 'unknown'} to ${params.status}`,
        type: 'order',
        metadata: {
          order_id: params.orderId,
          order_number: params.orderNumber,
          customer_id: params.customerId,
          old_status: params.oldStatus,
          new_status: params.status,
          total_amount: params.totalAmount
        }
      })

      // Notify vendor if specified
      if (params.vendorId) {
        await this.sendNotification({
          targetUserId: params.vendorId,
          title: 'Order Status Updated',
          message: `Order #${params.orderNumber} status has been updated to: ${params.status}`,
          type: 'order',
          metadata: {
            order_id: params.orderId,
            order_number: params.orderNumber,
            customer_id: params.customerId,
            new_status: params.status,
            total_amount: params.totalAmount
          }
        })
      }
    } catch (error) {
      console.error('Error in sendOrderStatusNotification:', error)
    }
  }

  // Send new order notification
  static async sendNewOrderNotification(params: OrderNotificationParams): Promise<void> {
    try {
      // Notify all admins about new order
      await this.sendNotificationToRole('admin', {
        title: 'New Order Received',
        message: `New order #${params.orderNumber} received for $${params.totalAmount}`,
        type: 'order',
        metadata: {
          order_id: params.orderId,
          order_number: params.orderNumber,
          customer_id: params.customerId,
          total_amount: params.totalAmount
        }
      })

      // Notify vendor about new order
      if (params.vendorId) {
        await this.sendNotification({
          targetUserId: params.vendorId,
          title: 'New Order Assignment',
          message: `You have received a new order #${params.orderNumber} for $${params.totalAmount}`,
          type: 'order',
          metadata: {
            order_id: params.orderId,
            order_number: params.orderNumber,
            customer_id: params.customerId,
            total_amount: params.totalAmount
          }
        })
      }
    } catch (error) {
      console.error('Error in sendNewOrderNotification:', error)
    }
  }

  // Send low stock notification
  static async sendLowStockNotification(params: StockNotificationParams): Promise<void> {
    try {
      // Notify all admins about low stock
      await this.sendNotificationToRole('admin', {
        title: 'Low Stock Alert',
        message: `Product "${params.productName}" is running low on stock. Current quantity: ${params.currentStock}`,
        type: 'stock',
        metadata: {
          product_id: params.productId,
          product_name: params.productName,
          current_stock: params.currentStock,
          threshold: params.threshold,
          vendor_id: params.vendorId
        }
      })

      // Notify vendor about low stock
      await this.sendNotification({
        targetUserId: params.vendorId,
        title: 'Low Stock Alert',
        message: `Your product "${params.productName}" is running low on stock. Current quantity: ${params.currentStock}`,
        type: 'stock',
        metadata: {
          product_id: params.productId,
          product_name: params.productName,
          current_stock: params.currentStock,
          threshold: params.threshold
        }
      })
    } catch (error) {
      console.error('Error in sendLowStockNotification:', error)
    }
  }

  // Send new user signup notification
  static async sendNewUserNotification(userId: string, userEmail: string, fullName?: string, role?: string): Promise<void> {
    try {
      await this.sendNotificationToRole('admin', {
        title: 'New User Signup',
        message: `New user signed up: ${fullName || userEmail}`,
        type: 'new_signup',
        metadata: {
          user_id: userId,
          email: userEmail,
          full_name: fullName || 'N/A',
          role: role || 'user'
        }
      })
    } catch (error) {
      console.error('Error in sendNewUserNotification:', error)
    }
  }

  // Get user's notifications
  static async getUserNotifications(userId: string, limit: number = 10): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching notifications:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getUserNotifications:', error)
      return []
    }
  }

  // Get unread notification count
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        console.error('Error fetching unread count:', error)
        return 0
      }

      return data?.length || 0
    } catch (error) {
      console.error('Error in getUnreadCount:', error)
      return 0
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in markAsRead:', error)
      return false
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in markAllAsRead:', error)
      return false
    }
  }
} 