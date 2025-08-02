# User Management Setup Guide

This guide explains how to set up and use the user management system with Supabase Auth.

## Overview

The user management system works with the existing `auth.users` table and stores user roles in the `raw_user_meta_data` JSON column. No additional tables are required.

## Database Setup

### 1. **Run the SQL Script**
Execute the `database_setup.sql` script in your Supabase SQL editor to set up:
- Automatic role assignment for new users
- Helper functions for role management
- Performance indexes
- Security policies

### 2. **Verify Setup**
Check that the following functions exist in your Supabase dashboard:
- `handle_new_user()` - Sets default role for new users
- `update_user_role()` - Updates user role
- `get_user_role()` - Gets user role
- `get_users_with_roles()` - Lists all users with roles
- `is_admin()`, `is_vendor()`, `is_customer()` - Role checking functions

## Features

### User Management Dashboard
- **Location**: `/dashboard/admin/settings`
- **Access**: Admin users only
- **Features**:
  - View all users with their roles
  - Update user roles (user, customer, vendor, admin)
  - Refresh user list
  - See user creation dates and last sign-in

### Automatic Role Assignment
When a new user signs up, they automatically get:
- Default role: `user`
- Full name from registration data
- Avatar URL if provided

### User Roles
- **user**: Basic user with limited access
- **customer**: Customer with shopping privileges
- **vendor**: Vendor with product management access
- **admin**: Full administrative access

## How to Use

### 1. **Access User Management**
- Navigate to `/dashboard/admin/settings`
- Click on the "Users" tab
- Ensure you're logged in as an admin

### 2. **View Users**
- All users are displayed in a table
- Shows name, email, role, creation date, and last sign-in
- Roles are color-coded with badges

### 3. **Update User Roles**
- Click "Edit Role" button next to any user
- Select new role from dropdown
- Click "Update Role" to save changes
- Role is immediately updated in auth.users table

### 4. **Refresh Data**
- Click "Refresh" button to reload user list

## Database Schema

### auth.users Table Structure
```sql
-- Users are stored in auth.users table
-- Roles are in raw_user_meta_data JSON column
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'full_name' as full_name,
  created_at,
  last_sign_in_at
FROM auth.users;
```

### User Metadata Structure
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

## Security

### Row Level Security (RLS)
- Users can only view their own data
- Admins can view all user data
- Role updates are logged in Supabase Auth logs

### Admin Access Control
- Only users with `role: 'admin'` can access user management
- Role updates require admin privileges
- All changes are audited in Supabase logs

## API Functions

### Available Functions
```sql
-- Update user role
SELECT update_user_role('user-uuid', 'admin');

-- Get user role
SELECT get_user_role('user-uuid');

-- Check if user is admin
SELECT is_admin('user-uuid');

-- List all users with roles
SELECT * FROM get_users_with_roles();
```

### Frontend Integration
```typescript
// Check user role
const { data: { user } } = await supabase.auth.getUser()
const userRole = user?.user_metadata?.role || 'user'

// Role-based access control
const isAdmin = user?.user_metadata?.role === 'admin'
const isVendor = user?.user_metadata?.role === 'vendor'
const isCustomer = user?.user_metadata?.role === 'customer'
```

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
   - Run the database setup script
   - Check if users exist in auth.users table
   - Verify admin role in your user metadata

4. **Role not updating**:
   - Check if the user has proper metadata structure
   - Verify the update function has proper permissions
   - Check Supabase logs for errors

### Manual Role Update
If you need to manually update a user's role:
```sql
-- Update user role manually
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
) 
WHERE id = 'user-uuid';
```

### Check User Metadata
```sql
-- View user metadata
SELECT 
  id,
  email,
  raw_user_meta_data
FROM auth.users 
WHERE id = 'user-uuid';
```

## Best Practices

### 1. **Role Hierarchy**
- Use consistent role names across your application
- Implement proper role-based access control
- Document role permissions clearly

### 2. **Security**
- Only grant admin role to trusted users
- Monitor role changes in Supabase logs
- Implement proper authentication checks

### 3. **Performance**
- Use indexes for role-based queries
- Cache user roles when possible
- Limit admin API calls

### 4. **Data Integrity**
- Always preserve existing metadata when updating
- Validate role names before updates
- Handle missing metadata gracefully

## Migration from Other Systems

### From Custom User Tables
1. Export user data from custom table
2. Import users into auth.users
3. Set roles in raw_user_meta_data
4. Update application to use auth.users

### From External Auth Systems
1. Migrate users to Supabase Auth
2. Set appropriate roles in metadata
3. Update application authentication
4. Test role-based access control

## Examples

### Creating a New User with Role
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      full_name: 'John Doe',
      role: 'customer'
    }
  }
})
```

### Checking User Permissions
```typescript
const { data: { user } } = await supabase.auth.getUser()

if (user?.user_metadata?.role === 'admin') {
  // Show admin features
} else if (user?.user_metadata?.role === 'vendor') {
  // Show vendor features
} else {
  // Show basic user features
}
```

### Updating User Role (Admin Only)
```typescript
// This should be done through the admin interface
// or using the update_user_role function
const { error } = await supabase.rpc('update_user_role', {
  user_id: 'user-uuid',
  new_role: 'admin'
})
``` 