import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      targetUserId, 
      title, 
      message, 
      type = 'system', 
      metadata = {} 
    } = body

    // Validate required fields
    if (!targetUserId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: targetUserId, title, message' },
        { status: 400 }
      )
    }

    // Check if admin client is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Admin client not configured' },
        { status: 500 }
      )
    }

    // Insert notification into database
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: targetUserId,
        title,
        message,
        type,
        metadata,
        read: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notification: data
    })

  } catch (error) {
    console.error('Error in notification API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to send notifications to multiple users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'system'
    const title = searchParams.get('title')
    const message = searchParams.get('message')
    const role = searchParams.get('role') // 'admin', 'vendor', 'customer'

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Missing required query parameters: title, message' },
        { status: 400 }
      )
    }

    // Check if admin client is available
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Admin client not configured' },
        { status: 500 }
      )
    }

    // Get users based on role
    let usersQuery = supabaseAdmin.auth.admin.listUsers()
    
    if (role) {
      // Filter by role if specified
      const { data: users, error: usersError } = await usersQuery
      
      if (usersError) {
        return NextResponse.json(
          { error: 'Failed to fetch users' },
          { status: 500 }
        )
      }

      const targetUsers = users.users.filter(user => 
        user.user_metadata?.role === role
      )

      if (targetUsers.length === 0) {
        return NextResponse.json(
          { error: `No users found with role: ${role}` },
          { status: 404 }
        )
      }

      // Create notifications for all target users
      const notifications = targetUsers.map(user => ({
        user_id: user.id,
        title,
        message,
        type,
        metadata: { role, sent_at: new Date().toISOString() },
        read: false
      }))

      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert(notifications)
        .select()

      if (error) {
        console.error('Error creating notifications:', error)
        return NextResponse.json(
          { error: 'Failed to create notifications' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        notifications: data,
        count: data.length
      })

    } else {
      // Send to all users
      const { data: users, error: usersError } = await usersQuery
      
      if (usersError) {
        return NextResponse.json(
          { error: 'Failed to fetch users' },
          { status: 500 }
        )
      }

      const notifications = users.users.map(user => ({
        user_id: user.id,
        title,
        message,
        type,
        metadata: { sent_at: new Date().toISOString() },
        read: false
      }))

      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert(notifications)
        .select()

      if (error) {
        console.error('Error creating notifications:', error)
        return NextResponse.json(
          { error: 'Failed to create notifications' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        notifications: data,
        count: data.length
      })
    }

  } catch (error) {
    console.error('Error in notification API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 