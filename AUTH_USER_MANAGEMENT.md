# Auth User Management Guide

This guide explains how the user management system works with Supabase Auth.

## Overview

The user management system now works directly with the `auth.users` table and updates user roles in the `raw_user_meta_data` JSON column.

## How It Works

### 1. **User Data Source**
- Users are fetched from `auth.users` table using `supabase.auth.admin.listUsers()`
- User roles are stored in `raw_user_meta_data.role` field
- User names are stored in `raw_user_meta_data.full_name` or `raw_user_meta_data.name`

### 2. **Role Management**
- Roles are updated using `supabase.auth.admin.updateUserById()`
- The `user_metadata` is updated with the new role
- Existing metadata is preserved and only the role is changed

### 3. **Available Roles**
- `user` - Basic user access
- `customer` - Customer with shopping privileges
- `vendor` - Vendor with product management access
- `admin` - Full administrative access

## User Metadata Structure

The `raw_user_meta_data` JSON column contains:

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "full_name": "User Name",
  "role": "admin",
  "avatar_url": "https://...",
  "email_verified": true,
  "phone_verified": false
}
```

## Features

### User Management Dashboard
- **Location**: `/dashboard/admin/settings`
- **Access**: Admin users only
- **Features**:
  - View all users with their roles
  - Update user roles
  - Refresh user list
  - See user creation dates and last sign-in

### Role Assignment
- Click "Edit Role" button next to any user
- Select new role from dropdown
- Click "Update Role" to save changes
- Role is immediately updated in auth.users table

## API Endpoints Used

- `supabase.auth.admin.listUsers()` - Fetch all users
- `supabase.auth.admin.getUserById()` - Get specific user
- `supabase.auth.admin.updateUserById()` - Update user metadata

## Security

- Only admin users can access user management
- Role updates are logged in Supabase Auth logs
- User metadata is preserved during updates

## Troubleshooting

### Common Issues

1. **"Failed to fetch users" error**:
   - Check if you have admin privileges
   - Verify Supabase Auth is properly configured
   - Ensure you're logged in as an admin

2. **"Failed to update user role" error**:
   - Check if you have admin privileges
   - Verify the user exists in auth.users
   - Check Supabase Auth logs for details

3. **No users showing up**:
   - Ensure you're logged in as an admin
   - Check if users exist in auth.users table
   - Verify admin role in your user metadata

### Manual Role Update

If you need to manually update a user's role:

```sql
-- This is for reference only - use the admin interface instead
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data, 
  '{role}', 
  '"admin"'
) 
WHERE id = 'user-uuid';
```

## Best Practices

1. **Role Hierarchy**: Use consistent role names across your application
2. **Metadata Preservation**: Always preserve existing metadata when updating
3. **Admin Access**: Ensure only trusted users have admin role
4. **Audit Trail**: Monitor role changes in Supabase Auth logs

## Examples

### Checking User Role
```typescript
const { data: { user } } = await supabase.auth.getUser()
const userRole = user?.user_metadata?.role || 'user'
```

### Role-Based Access Control
```typescript
const isAdmin = user?.user_metadata?.role === 'admin'
const isVendor = user?.user_metadata?.role === 'vendor'
const isCustomer = user?.user_metadata?.role === 'customer'
``` 